import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma as db } from '@/lib/prisma'
import { FinancialService } from '@/services/FinancialService'
import { Role } from '@prisma/client'
import { OrderTransitionService } from '@/services/OrderTransitionService'
import { toBranchId } from '@/lib/branches'

export const POST = withApiHandler(async (ctx) => {
  const { id } = ctx.params

  // Parse body safely — always cast amount to Number so '2' === 2
  let body: any = {};
  try { body = await ctx.req.json(); } catch { /* empty body */ }
  const { method } = body;
  const amount = Number(body.amount);

  if (!amount || amount <= 0 || !method) {
    return NextResponse.json({ success: false, error: 'amount (positive number) and method are required' }, { status: 400 })
  }

  const order = await db.order.findUnique({
    where: { id },
    include: { ledgerEntries: true, payments: true }
  })

  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
  }

  // Branch isolation: non-ADMIN users can only record payments on their own branch's orders
  if (ctx.appRole !== 'ADMIN' && ctx.branchId && toBranchId(order.branchId) !== toBranchId(ctx.branchId)) {
    return NextResponse.json({ success: false, error: 'Access denied: order belongs to a different branch' }, { status: 403 })
  }

  // Calculate REAL outstanding balance from ledger (ground truth — ignores stale Order.pendingBalance field)
  const summary = await FinancialService.calculateFinancialSummary(order);
  const balance = summary.outstandingAmount;

  if (balance <= 0) {
    return NextResponse.json({ success: false, error: 'This order has no outstanding balance to collect.' }, { status: 400 })
  }

  // Cap amount at actual outstanding balance — handles floating-point drift and stale pendingBalance
  // (e.g. if order.pendingBalance=2 but real ledger shows 1.99, we pay 1.99 not 2)
  const safeAmount = Math.min(amount, balance);

  // Idempotency: client can pass x-transaction-id header to prevent duplicates
  const referenceId = ctx.req.headers.get('x-transaction-id') || undefined

  let payment;
  try {
    payment = await FinancialService.recordLedgerEntry({
      orderId: id,
      type: 'PAYMENT',
      amount: safeAmount,
      method,
      referenceId,
      actorId: ctx.user?.id || 'SYSTEM',
      role: ctx.appRole as Role
    });
  } catch (err: any) {
    console.error('[Payments] recordLedgerEntry failed:', err.message, err.stack);
    return NextResponse.json({ success: false, error: err.message || 'Failed to record payment' }, { status: 400 });
  }

  // Auto-handover: re-fetch fresh summary AFTER payment is recorded
  let handedOver = false;
  if (order.deliveryType === 'PICKUP' && order.status === 'READY_FOR_PICKUP') {
    try {
      const newSummary = await FinancialService.calculateFinancialSummary(id);
      if (newSummary.outstandingAmount <= 0) {
        await OrderTransitionService.transitionState({
          orderId: id,
          action: 'complete',
          actorId: ctx.user?.id || 'SYSTEM',
          appRole: ctx.appRole as any,
          branchId: ctx.branchId,
        });
        handedOver = true;
      }
    } catch (err: any) {
      console.error('[Payments] Auto-handover failed:', err.message);
      // Non-fatal — payment was still recorded successfully
    }
  }

  return NextResponse.json({ success: true, data: payment, handedOver })
})
