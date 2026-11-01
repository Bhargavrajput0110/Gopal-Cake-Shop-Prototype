import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import { Prisma, RetailerTransactionType, PaymentMethod } from '@prisma/client';

export const GET = withApiHandler(async (ctx) => {
  const { appRole, req } = ctx;
  if (appRole && appRole !== 'ADMIN' && appRole !== 'MANAGER' && appRole !== 'SALESPERSON') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const url = req.nextUrl;
  const view = url.searchParams.get('view') || 'daily'; // 'daily' | 'monthly' | 'all'
  const dateStr = url.searchParams.get('date'); // 'YYYY-MM-DD'
  const monthStr = url.searchParams.get('month'); // 'YYYY-MM'
  const retailerId = url.searchParams.get('retailerId');
  const typeFilter = url.searchParams.get('type') as RetailerTransactionType | null;
  const partyType = url.searchParams.get('partyType')?.trim(); // 'VENDOR' | 'RETAILER' | 'all'

  let startDate: Date;
  let endDate: Date;

  if (view === 'monthly' && monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    startDate = startOfMonth(new Date(year, month - 1, 1));
    endDate = endOfMonth(new Date(year, month - 1, 1));
  } else if (dateStr) {
    const parsed = parseISO(dateStr);
    startDate = startOfDay(parsed);
    endDate = endOfDay(parsed);
  } else {
    // Default to today
    const now = new Date();
    if (view === 'monthly') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else {
      startDate = startOfDay(now);
      endDate = endOfDay(now);
    }
  }

  const whereClause: Prisma.RetailerLedgerEntryWhereInput = {
    date: {
      gte: startDate,
      lte: endDate,
    },
    ...(retailerId ? { retailerId } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(partyType && partyType !== 'all' ? { retailer: { partyType } } : {}),
  };

  const entries = await prisma.retailerLedgerEntry.findMany({
    where: whereClause,
    include: {
      retailer: {
        select: {
          id: true,
          name: true,
          shopName: true,
          phone: true,
          currentBalance: true,
          partyType: true,
          category: true,
        },
      },
      createdBy: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: { date: 'desc' },
  });

  // Calculate Aggregates
  let totalBilled = 0;
  let totalPaid = 0;
  let totalReturns = 0;
  let totalAdjustments = 0;

  const paymentMethodBreakdown: Record<string, number> = {
    CASH: 0,
    UPI: 0,
    CARD: 0,
    MANUAL: 0,
  };

  const dayBreakdownMap: Record<string, { date: string; billed: number; paid: number; count: number }> = {};

  entries.forEach((entry) => {
    const amt = Number(entry.amount);
    const dayKey = format(entry.date, 'yyyy-MM-dd');

    if (!dayBreakdownMap[dayKey]) {
      dayBreakdownMap[dayKey] = { date: dayKey, billed: 0, paid: 0, count: 0 };
    }
    dayBreakdownMap[dayKey].count += 1;

    if (entry.type === 'BILLING') {
      totalBilled += amt;
      dayBreakdownMap[dayKey].billed += amt;
    } else if (entry.type === 'PAYMENT') {
      totalPaid += amt;
      dayBreakdownMap[dayKey].paid += amt;
      const m = entry.paymentMethod || 'CASH';
      paymentMethodBreakdown[m] = (paymentMethodBreakdown[m] || 0) + amt;
    } else if (entry.type === 'RETURN') {
      totalReturns += amt;
    } else if (entry.type === 'ADJUSTMENT') {
      totalAdjustments += amt;
    }
  });

  // Retailer Ledger Summaries for Monthly View
  let retailerSummaries: any[] = [];
  if (view === 'monthly') {
    const allRetailers = await prisma.retailer.findMany({
      where: {
        isActive: true,
        ...(partyType && partyType !== 'all' ? { partyType } : {}),
      },
      include: {
        ledgerEntries: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: { type: true, amount: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    retailerSummaries = allRetailers.map((r) => {
      let monthBilled = 0;
      let monthPaid = 0;
      let monthReturns = 0;

      r.ledgerEntries.forEach((e) => {
        const amt = Number(e.amount);
        if (e.type === 'BILLING') monthBilled += amt;
        else if (e.type === 'PAYMENT') monthPaid += amt;
        else if (e.type === 'RETURN') monthReturns += amt;
      });

      const currentBal = Number(r.currentBalance);
      const openingBal = currentBal - (monthBilled - monthPaid - monthReturns);

      return {
        id: r.id,
        name: r.name,
        shopName: r.shopName,
        phone: r.phone,
        partyType: r.partyType || 'VENDOR',
        category: r.category || (r.partyType === 'VENDOR' ? 'Raw Ingredients' : 'Retail Store'),
        openingBalance: Math.max(0, openingBal),
        billed: monthBilled,
        paid: monthPaid,
        returns: monthReturns,
        closingBalance: currentBal,
        hasActivity: r.ledgerEntries.length > 0,
      };
    });
  }

  // Calculate separate aggregates for Vendors (Payables) and Retailers (Receivables)
  const [vendorPayableAgg, retailerReceivableAgg] = await Promise.all([
    prisma.retailer.aggregate({
      where: { isActive: true, partyType: 'VENDOR' },
      _sum: { currentBalance: true },
      _count: { id: true },
    }),
    prisma.retailer.aggregate({
      where: { isActive: true, partyType: 'RETAILER' },
      _sum: { currentBalance: true },
      _count: { id: true },
    }),
  ]);

  const totalPayableToVendors = Number(vendorPayableAgg._sum.currentBalance || 0);
  const totalReceivableFromRetailers = Number(retailerReceivableAgg._sum.currentBalance || 0);

  return NextResponse.json({
    success: true,
    data: {
      view,
      range: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalBilled,
        totalPaid,
        totalReturns,
        totalAdjustments,
        netCashflow: totalPaid,
        netReceivableGrowth: totalBilled - totalPaid - totalReturns,
        totalPayableToVendors,
        totalReceivableFromRetailers,
        vendorCount: vendorPayableAgg._count.id,
        retailerCount: retailerReceivableAgg._count.id,
        entriesCount: entries.length,
        paymentMethodBreakdown,
      },
      trends: Object.values(dayBreakdownMap).sort((a, b) => a.date.localeCompare(b.date)),
      retailerSummaries,
      entries: entries.map((e) => ({
        id: e.id,
        date: e.date,
        type: e.type,
        amount: Number(e.amount),
        paymentMethod: e.paymentMethod,
        referenceNo: e.referenceNo,
        description: e.description,
        balanceAfter: e.balanceAfter ? Number(e.balanceAfter) : null,
        retailer: {
          id: e.retailer.id,
          name: e.retailer.name,
          shopName: e.retailer.shopName,
          phone: e.retailer.phone,
          currentBalance: Number(e.retailer.currentBalance),
        },
        createdBy: e.createdBy?.name || 'Admin',
      })),
    },
  });
});

export const POST = withApiHandler(async (ctx) => {
  const { appRole, user, req } = ctx;
  if (appRole && appRole !== 'ADMIN' && appRole !== 'MANAGER' && appRole !== 'SALESPERSON') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const {
    retailerId,
    newRetailerName,
    newRetailerShop,
    newRetailerPhone,
    date,
    type,
    amount,
    paymentMethod,
    referenceNo,
    description,
  } = body;

  const numericAmount = Math.abs(Number(amount));
  if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
    return NextResponse.json({ error: 'Valid positive amount is required' }, { status: 400 });
  }

  if (!type || !['BILLING', 'PAYMENT', 'RETURN', 'ADJUSTMENT'].includes(type)) {
    return NextResponse.json({ error: 'Valid transaction type (BILLING, PAYMENT, RETURN, ADJUSTMENT) is required' }, { status: 400 });
  }

  // Handle transaction
  const result = await prisma.$transaction(async (tx) => {
    let targetRetailerId = retailerId;

    if (!targetRetailerId && newRetailerName?.trim()) {
      // Find or create retailer
      let found = await tx.retailer.findFirst({
        where: {
          OR: [
            { name: { equals: newRetailerName.trim(), mode: 'insensitive' } },
            ...(newRetailerPhone ? [{ phone: { equals: newRetailerPhone.trim() } }] : []),
          ],
        },
      });

      if (!found) {
        found = await tx.retailer.create({
          data: {
            name: newRetailerName.trim(),
            shopName: newRetailerShop?.trim() || null,
            phone: newRetailerPhone?.trim() || null,
            openingBalance: 0,
            currentBalance: 0,
          },
        });
      }
      targetRetailerId = found.id;
    }

    if (!targetRetailerId) {
      throw new Error('Retailer must be selected or specified');
    }

    const retailer = await tx.retailer.findUnique({
      where: { id: targetRetailerId },
    });

    if (!retailer) {
      throw new Error('Retailer not found');
    }

    const currentBalance = Number(retailer.currentBalance);
    let delta = 0;

    if (type === 'BILLING') {
      delta = numericAmount; // Retailer owes more
    } else if (type === 'PAYMENT') {
      delta = -numericAmount; // Retailer paid down balance
    } else if (type === 'RETURN') {
      delta = -numericAmount; // Returned goods credited
    } else if (type === 'ADJUSTMENT') {
      // If adjustment, treat as credit reduction by default unless specified
      delta = -numericAmount;
    }

    const newBalance = Math.max(0, currentBalance + delta);

    // Update retailer current balance
    const updatedRetailer = await tx.retailer.update({
      where: { id: targetRetailerId },
      data: {
        currentBalance: newBalance,
      },
    });

    // Create entry
    const entryDate = date ? new Date(date) : new Date();

    const createdEntry = await tx.retailerLedgerEntry.create({
      data: {
        retailerId: targetRetailerId,
        date: entryDate,
        type: type as RetailerTransactionType,
        amount: numericAmount,
        paymentMethod: paymentMethod ? (paymentMethod as PaymentMethod) : 'CASH',
        referenceNo: referenceNo?.trim() || null,
        description: description?.trim() || null,
        balanceAfter: newBalance,
        createdById: user?.id || null,
      },
      include: {
        retailer: {
          select: { id: true, name: true, shopName: true, currentBalance: true },
        },
      },
    });

    return { createdEntry, updatedRetailer };
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
