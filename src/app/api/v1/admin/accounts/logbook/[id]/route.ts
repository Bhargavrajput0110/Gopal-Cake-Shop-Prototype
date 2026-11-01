import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';

export const DELETE = withApiHandler(async (ctx) => {
  const { appRole, params } = ctx;
  if (appRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can delete logbook entries' }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const entry = await tx.retailerLedgerEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    const retailer = await tx.retailer.findUnique({
      where: { id: entry.retailerId },
    });

    if (retailer) {
      const amt = Number(entry.amount);
      const current = Number(retailer.currentBalance);
      // Reverse: if BILLING was added, subtract it; if PAYMENT was subtracted, add it back
      let reverseDelta = 0;
      if (entry.type === 'BILLING') {
        reverseDelta = -amt;
      } else {
        reverseDelta = amt;
      }

      await tx.retailer.update({
        where: { id: retailer.id },
        data: {
          currentBalance: Math.max(0, current + reverseDelta),
        },
      });
    }

    await tx.retailerLedgerEntry.delete({
      where: { id },
    });
  });

  return NextResponse.json({
    success: true,
    message: 'Entry deleted and retailer balance restored',
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
  if (body.referenceNo !== undefined) dataToUpdate.referenceNo = body.referenceNo?.trim() || null;
  if (body.description !== undefined) dataToUpdate.description = body.description?.trim() || null;
  if (body.paymentMethod !== undefined) dataToUpdate.paymentMethod = body.paymentMethod as PaymentMethod;

  const updated = await prisma.retailerLedgerEntry.update({
    where: { id },
    data: dataToUpdate,
  });

  return NextResponse.json({
    success: true,
    data: updated,
  });
});
