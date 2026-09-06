import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma as db } from '@/lib/prisma'
import { FinancialService } from '@/services/FinancialService'
import { Role, LedgerEntryType } from '@prisma/client'

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

  return NextResponse.json({ success: true, data: payment })
})
