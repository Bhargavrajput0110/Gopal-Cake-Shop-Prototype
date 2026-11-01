import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';

export const GET = withApiHandler(async (ctx) => {
  const { appRole, params } = ctx;
  if (appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Retailer ID is required' }, { status: 400 });
  }

  const retailer = await prisma.retailer.findUnique({
    where: { id },
    include: {
      ledgerEntries: {
        orderBy: { date: 'asc' },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  if (!retailer) {
    return NextResponse.json({ error: 'Retailer not found' }, { status: 404 });
  }

  // Calculate lifetime totals
  let totalBilled = 0;
  let totalPaid = 0;
  let totalReturns = 0;

  retailer.ledgerEntries.forEach((entry) => {
    const amt = Number(entry.amount);
    if (entry.type === 'BILLING') totalBilled += amt;
    else if (entry.type === 'PAYMENT') totalPaid += amt;
    else if (entry.type === 'RETURN') totalReturns += amt;
  });

  return NextResponse.json({
    success: true,
    data: {
      retailer: {
        id: retailer.id,
        name: retailer.name,
        shopName: retailer.shopName,
        phone: retailer.phone,
        email: retailer.email,
        address: retailer.address,
        city: retailer.city,
        partyType: retailer.partyType || 'VENDOR',
        category: retailer.category || 'Raw Ingredients',
        openingBalance: Number(retailer.openingBalance),
        currentBalance: Number(retailer.currentBalance),
        creditLimit: retailer.creditLimit ? Number(retailer.creditLimit) : null,
        notes: retailer.notes,
        isActive: retailer.isActive,
        createdAt: retailer.createdAt,
      },
      stats: {
        totalBilled,
        totalPaid,
        totalReturns,
        netBalance: Number(retailer.currentBalance),
        entryCount: retailer.ledgerEntries.length,
      },
      entries: retailer.ledgerEntries.map((e) => ({
        id: e.id,
        date: e.date,
        type: e.type,
        amount: Number(e.amount),
        paymentMethod: e.paymentMethod,
        referenceNo: e.referenceNo,
        description: e.description,
        balanceAfter: e.balanceAfter ? Number(e.balanceAfter) : null,
        createdBy: e.createdBy?.name || 'Admin',
      })),
    },
  });
});

export const PATCH = withApiHandler(async (ctx) => {
  const { appRole, params, req } = ctx;
  if (appRole && appRole !== 'ADMIN' && appRole !== 'MANAGER' && appRole !== 'SALESPERSON') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = params;
  const body = await req.json();

  const dataToUpdate: any = {};
  if (body.name !== undefined) dataToUpdate.name = body.name.trim();
  if (body.shopName !== undefined) dataToUpdate.shopName = body.shopName ? body.shopName.trim() : null;
  if (body.phone !== undefined) {
    const digits = body.phone ? body.phone.replace(/\D/g, '') : '';
    if (digits && digits.length !== 10) {
      return NextResponse.json({ error: 'Mobile number must be exactly 10 digits' }, { status: 400 });
    }
    dataToUpdate.phone = digits || null;
  }
  if (body.email !== undefined) dataToUpdate.email = body.email ? body.email.trim() : null;
  if (body.address !== undefined) dataToUpdate.address = body.address ? body.address.trim() : null;
  if (body.city !== undefined) dataToUpdate.city = body.city ? body.city.trim() : 'Surat';
  if (body.creditLimit !== undefined) {
    dataToUpdate.creditLimit = (body.creditLimit !== '' && body.creditLimit !== null && !isNaN(Number(body.creditLimit)))
      ? Number(body.creditLimit)
      : null;
  }
  if (body.notes !== undefined) dataToUpdate.notes = body.notes ? body.notes.trim() : null;
  if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);

  const updated = await prisma.retailer.update({
    where: { id },
    data: dataToUpdate,
  });

  return NextResponse.json({
    success: true,
    data: updated,
  });
});

export const DELETE = withApiHandler(async (ctx) => {
  const { appRole, params } = ctx;
  if (appRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admin can delete retailer accounts' }, { status: 403 });
  }

  const { id } = params;
  await prisma.retailer.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
    message: 'Retailer deleted successfully',
  });
});
