import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { FinancialService } from '@/services/FinancialService'

const handler = async (ctx: HandlerContext) => {
  const { id } = ctx.params

  if (!id) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      ledgerEntries: true,
      items: {
        include: {
          media: true
        }
      }
    }
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const summary = await FinancialService.calculateFinancialSummary(order);
  
  const enrichedOrder = {
    ...order,
    totalAmount: summary.totalAmount,
    paidAmount: summary.paidAmount,
    pendingBalance: summary.outstandingAmount,
    financialStatus: summary.paymentStatus,
    payments: undefined, // ensure backwards compatibility or just remove it if frontend does not rely on raw payments
  }

  return NextResponse.json({ success: true, data: enrichedOrder })
}

export const GET = withApiHandler(handler, true)
