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
      }
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

  // Return limited public information (no internal IDs or sensitive notes)
  const publicOrder = {
    orderNumber: order.orderNumber,
    status: getCustomerFriendlyStatus(order.status),
    targetDate: order.targetDate,
    timeTarget: order.targetDate,
    totalAmount: order.totalAmount,
    items: order.items.map((i: any) => ({
      productName: i.productName,
      quantity: i.quantity,
      variant: i.variant,
      image: i.image
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
