import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma as db } from '@/lib/prisma'
import { FinancialService } from '@/services/FinancialService'
import { Role, LedgerEntryType } from '@prisma/client'
import { OrderTransitionService } from '@/services/OrderTransitionService'

import { toBranchId } from '@/lib/branches'

export const POST = withApiHandler(async (ctx) => {
  const { id } = ctx.params
  const { amount, method } = await ctx.req.json()

  if (!amount || !method) {
    return NextResponse.json({ error: 'amount and method are required' }, { status: 400 })
  }

  const order = await db.order.findUnique({
    where: { id },
    include: { ledgerEntries: true }
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Branch isolation: non-ADMIN users can only record payments on their own branch's orders
  if (ctx.appRole !== 'ADMIN' && ctx.branchId && toBranchId(order.branchId) !== toBranchId(ctx.branchId)) {
    return NextResponse.json({ error: 'Access denied: order belongs to a different branch' }, { status: 403 })
  }

  const summary = await FinancialService.calculateFinancialSummary(order);
  const balance = summary.outstandingAmount;

  if (amount > balance) {
    return NextResponse.json({ error: 'Amount exceeds balance due' }, { status: 400 })
  }

  // Idempotency: the client might send a transaction ID, or we generate one
  const referenceId = ctx.req.headers.get('x-transaction-id') || undefined

  const payment = await FinancialService.recordLedgerEntry({
    orderId: id,
    type: 'PAYMENT',
    amount,
    method,
    referenceId,
    actorId: ctx.user?.id || 'SYSTEM',
    role: ctx.appRole as Role
  })

  // Auto-handover logic on the backend to avoid frontend stale state issues
  let handedOver = false;
  if (order.deliveryType === 'PICKUP' && order.status === 'READY_FOR_PICKUP') {
    const newSummary = await FinancialService.calculateFinancialSummary(order.id);
    if (newSummary.outstandingAmount === 0) {
      try {
        await OrderTransitionService.transitionState({
          orderId: id,
          action: 'complete',
          actorId: ctx.user?.id || 'SYSTEM',
          appRole: ctx.appRole as any,
          branchId: ctx.branchId,
        });
        handedOver = true;
      } catch (err: any) {
        console.error('[Payments] Auto-handover failed:', err.message);
      }
    }
  }

  return NextResponse.json({ success: true, data: payment, handedOver })
})
