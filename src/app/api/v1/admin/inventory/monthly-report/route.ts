import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { InventoryUnitStatus, PaymentMethod } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role?.toUpperCase();
    const rawPerms = (session?.user as any)?.customPermissions;
    let customPerms: Record<string, boolean> = {};
    if (rawPerms) {
      try {
        customPerms = typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms;
      } catch (e) {}
    }

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canAccessMonthlyReport = role === 'ADMIN' || customPerms['inv_ca_monthly_report'] === true;
    if (!canAccessMonthlyReport) {
      return NextResponse.json({ 
        success: false, 
        error: "Forbidden: Monthly Tax & Financial Statements for CA are strictly confidential and restricted by Rishi Bhai." 
      }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);

    const monthParam = searchParams.get('month'); // 1-12
    const yearParam = searchParams.get('year'); // e.g. 2026
    const branchId = searchParams.get('branchId') || 'ALL';

    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[month - 1];

    // Branch Details
    let branchInfo: any = { name: "All Branches & Central Factory", code: "ALL" };
    if (branchId !== 'ALL') {
      const b = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { id: true, name: true, code: true, address: true }
      });
      if (b) branchInfo = b;
    }

    const branchFilter = branchId !== 'ALL' ? { branchId } : {};

    // 1. Sold Barcode Units in this Month
    const soldUnits = await prisma.inventoryUnit.findMany({
      where: {
        status: InventoryUnitStatus.SOLD,
        soldAt: { gte: startOfMonth, lte: endOfMonth },
        ...branchFilter
      },
      select: {
        sellingPrice: true,
        soldPrice: true,
        category: true,
        flavor: true,
        variantWeight: true,
      }
    });

    let grossBarcodeTurnover = 0;
    let netBarcodeTurnover = 0;
    let totalBarcodeDiscounts = 0;

    for (const u of soldUnits) {
      const orig = Number(u.sellingPrice || 0);
      const sold = u.soldPrice !== null && u.soldPrice !== undefined ? Number(u.soldPrice) : orig;
      grossBarcodeTurnover += orig;
      netBarcodeTurnover += sold;
      if (orig > sold) {
        totalBarcodeDiscounts += (orig - sold);
      }
    }

    // 2. Orders Invoiced in this Month
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { notIn: ['CANCELLED', 'REFUNDED', 'QUOTE_DRAFT'] },
        ...branchFilter
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        subtotal: true,
        discount: true,
        deliveryCharge: true,
        payments: {
          select: { method: true, amount: true, status: true }
        }
      }
    });

    const totalOrdersCount = orders.length;
    let totalInvoicedRevenue = 0;
    let totalOrderDiscounts = 0;
    let totalDeliveryCollected = 0;
    let paymentSplit: Record<string, number> = {
      CASH: 0,
      UPI: 0,
      CARD: 0,
      ONLINE: 0
    };

    for (const ord of orders) {
      totalInvoicedRevenue += Number(ord.totalAmount || 0);
      totalOrderDiscounts += Number(ord.discount || 0);
      totalDeliveryCollected += Number(ord.deliveryCharge || 0);

      for (const p of ord.payments) {
        if (p.status === 'SUCCESS') {
          const m = p.method || 'CASH';
          paymentSplit[m] = (paymentSplit[m] || 0) + Number(p.amount || 0);
        }
      }
    }

    // If order revenue is 0 (or testing with barcode sales), ensure net barcode revenue is considered
    const finalGrossSales = Math.max(totalInvoicedRevenue + totalOrderDiscounts, grossBarcodeTurnover);
    const finalNetSales = Math.max(totalInvoicedRevenue, netBarcodeTurnover);
    const finalDiscountsConceded = Math.max(totalOrderDiscounts, totalBarcodeDiscounts);

    // GST Estimates (GST 5% inclusive for Bakery / Confectionery)
    const gstRate = 5;
    const estimatedGstAmount = (finalNetSales * gstRate) / (100 + gstRate);
    const netTaxableTurnover = finalNetSales - estimatedGstAmount;
    const cgst = estimatedGstAmount / 2;
    const sgst = estimatedGstAmount / 2;

    // 3. Stock Inward Receipts from Central Kitchen
    const inwardBatches = await prisma.inventoryBatch.findMany({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        ...branchFilter
      },
      select: {
        id: true,
        category: true,
        openingQty: true,
        isBarcodeTracked: true,
      }
    });

    const totalInwardUnits = inwardBatches.reduce((sum, b) => sum + (Number(b.openingQty) || 0), 0);
    const inwardAssetValuation = totalInwardUnits * 450; // estimated average base

    // 4. Wastage & Spoilage Write-Offs (Sec 17(5)(h) CGST Input Tax Reversal info)
    const wastageUnits = await prisma.inventoryUnit.findMany({
      where: {
        status: { in: [InventoryUnitStatus.DAMAGED, InventoryUnitStatus.EXPIRED] },
        updatedAt: { gte: startOfMonth, lte: endOfMonth },
        ...branchFilter
      },
      select: {
        status: true,
        damageReason: true,
        sellingPrice: true
      }
    });

    let totalWastageLoss = 0;
    const reasonBreakdown: Record<string, { count: number; lossAmount: number }> = {};

    for (const u of wastageUnits) {
      const reason = u.damageReason || (u.status === 'EXPIRED' ? 'Unsold expired' : 'Unspecified damage');
      const loss = Number(u.sellingPrice || 0);
      totalWastageLoss += loss;
      if (!reasonBreakdown[reason]) {
        reasonBreakdown[reason] = { count: 0, lossAmount: 0 };
      }
      reasonBreakdown[reason].count += 1;
      reasonBreakdown[reason].lossAmount += loss;
    }

    // 5. Month-End Active Inventory Valuation (Balance Sheet Inventory Asset)
    const activeUnits = await prisma.inventoryUnit.findMany({
      where: {
        status: InventoryUnitStatus.IN_STOCK,
        ...branchFilter
      },
      select: {
        sellingPrice: true,
        category: true
      }
    });

    const closingInventoryCount = activeUnits.length;
    const closingInventoryValuation = activeUnits.reduce((sum, u) => sum + Number(u.sellingPrice || 0), 0);

    return NextResponse.json({
      success: true,
      period: {
        month,
        monthName,
        year,
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        branch: branchInfo
      },
      company: {
        tradeName: "Gopal Cake Shop",
        legalOwner: "Rishi Bhai / Gopal Confectionery",
        gstin: "24AAAFG0000A1Z2",
        state: "Gujarat (24)",
        city: "Vadodara",
        natureOfBusiness: "Bakery, Cakes, Desserts & Confectionery Manufacturing and Retail"
      },
      salesTurnover: {
        grossSales: finalGrossSales,
        discountsConceded: finalDiscountsConceded,
        netTaxableSales: netTaxableTurnover,
        gstRatePercent: gstRate,
        estimatedGstAmount,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalNetInvoiced: finalNetSales,
        totalOrdersCount,
        paymentSplit
      },
      stockInward: {
        totalBatches: inwardBatches.length,
        totalUnitsReceived: totalInwardUnits,
        inwardAssetValuation
      },
      spoilageWriteOff: {
        totalUnitsWrittenOff: wastageUnits.length,
        totalLossAmount: totalWastageLoss,
        reasonBreakdown: Object.entries(reasonBreakdown).map(([reason, d]) => ({
          reason,
          count: d.count,
          lossAmount: d.lossAmount
        }))
      },
      monthEndInventoryValuation: {
        activeUnitsCount: closingInventoryCount,
        inventoryAssetValuation: closingInventoryValuation
      },
      generatedAt: now.toISOString(),
      generatedBy: session?.user?.name || "Store Admin"
    });
  } catch (error: any) {
    console.error("GET /api/v1/admin/inventory/monthly-report error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

