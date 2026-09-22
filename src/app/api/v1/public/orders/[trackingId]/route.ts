import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { errorResponse } from '@/lib/apiUtils'

const handler = async (ctx: HandlerContext) => {
  const trackingId = ctx.params.trackingId

  const order = await prisma.order.findUnique({
    where: { trackingId },
    include: {
      items: true,
      timeline: {
        orderBy: { createdAt: 'desc' }
      },
      payments: {
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'asc' },
      },
    }
  })

  if (!order) {
    return errorResponse('Order not found', 'NOT_FOUND', 404, [], ctx.requestId)
  }

  // Map internal ERP states to customer-friendly terminology
  const getCustomerFriendlyStatus = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'CONFIRMED':
      case 'WAITING_FOR_CHEF':
        return 'Order Received'
      case 'QUOTE_DRAFT':
        return 'Quote Pending'
      case 'QUOTE_SENT':
        return 'Quote Sent (Awaiting Payment)'
      case 'CHEF_ACCEPTED':
      case 'MAKING':
      case 'DECORATING':
        return "We're preparing your cake"
      case 'READY_FOR_PICKUP':
      case 'PENDING_ASSIGNMENT':
      case 'ASSIGNED_TO_DRIVER':
      case 'PICKED_UP':
        return 'Ready for Delivery'
      case 'ON_THE_WAY':
        return 'Out for Delivery'
      case 'DELIVERED':
      case 'COMPLETED':
        return 'DELIVERED'
      case 'CANCELLED':
      case 'FAILED_DELIVERY':
        return 'Issue with Order (Cancelled or Failed)'
      default:
        return 'Processing'
    }
  }

  // Calculate payment summary
  const totalPaid = order.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const balanceDue = Math.max(0, Number(order.totalAmount) - totalPaid)
  const hasAdvancePayment = order.payments.some((p: any) => p.type === 'ADVANCE')

  // Return limited public information (no internal IDs or sensitive notes)
  const publicOrder = {
    orderNumber: order.orderNumber,
    status: getCustomerFriendlyStatus(order.status),
    targetDate: order.targetDate,
    timeTarget: order.targetDate,
    deliveryType: order.deliveryType,
    // Financial breakdown for customer bill
    subtotal: Number(order.subtotal),
    deliveryCharge: Number(order.deliveryCharge),
    discount: Number(order.discount),
    totalAmount: Number(order.totalAmount),
    // Payment summary
    totalPaid,
    balanceDue,
    hasAdvancePayment,
    payments: order.payments.map((p: any) => ({
      amount: Number(p.amount),
      type: p.type,
      method: p.method,
      paidAt: p.verifiedAt || p.updatedAt,
    })),
    items: order.items.map((i: any) => ({
      productName: i.productName,
      quantity: i.quantity,
      variant: i.variant,
      flavor: i.flavor,
      price: Number(i.price),
      image: i.image,
      messageOnCake: i.messageOnCake,
    })),
    timeline: order.timeline.map((t: any) => ({
      status: getCustomerFriendlyStatus(t.nextState),
      createdAt: t.createdAt
    }))
  }

  return NextResponse.json(publicOrder, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}

export const GET = withApiHandler(handler, true)
