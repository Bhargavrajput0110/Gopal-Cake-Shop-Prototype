/**
 * Public API: Look up all orders for a phone number.
 * GET /api/v1/public/orders/by-phone?phone=9876543210
 * No authentication — phone number acts as the lookup key.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')?.replace(/\D/g, '').replace(/^91/, '')

  if (!phone || phone.length !== 10) {
    return NextResponse.json({ error: 'Please provide a valid 10-digit phone number.' }, { status: 400 })
  }

  const customer = await prisma.customer.findUnique({
    where: { phone },
    include: {
      orders: {
        where: { type: 'ORDER' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          orderNumber: true,
          trackingId: true,
          status: true,
          targetDate: true,
          totalAmount: true,
          deliveryType: true,
          createdAt: true,
          items: {
            take: 2,
            select: { productName: true, quantity: true, variant: true }
          },
        }
      }
    }
  })

  if (!customer) {
    return NextResponse.json({ orders: [] })
  }

  const getCustomerFriendlyStatus = (status: string) => {
    switch (status) {
      case 'NEW': case 'CONFIRMED': case 'WAITING_FOR_CHEF': return 'Order Received'
      case 'CHEF_ACCEPTED': case 'MAKING': case 'DECORATING': return "Preparing"
      case 'READY_FOR_PICKUP': case 'PENDING_ASSIGNMENT': case 'ASSIGNED_TO_DRIVER': case 'PICKED_UP': return 'Ready'
      case 'ON_THE_WAY': return 'Out for Delivery'
      case 'DELIVERED': case 'COMPLETED': return 'Delivered'
      case 'CANCELLED': return 'Cancelled'
      case 'FAILED_DELIVERY': return 'Delivery Failed'
      case 'QUOTE_SENT': case 'QUOTE_DRAFT': return 'Quote Pending'
      default: return 'Processing'
    }
  }

  const orders = customer.orders.map((o: any) => ({
    orderNumber: o.orderNumber,
    trackingId: o.trackingId,
    status: getCustomerFriendlyStatus(o.status),
    rawStatus: o.status,
    targetDate: o.targetDate,
    totalAmount: Number(o.totalAmount),
    deliveryType: o.deliveryType,
    createdAt: o.createdAt,
    previewItems: o.items.map((i: any) => ({
      productName: i.productName,
      quantity: i.quantity,
      variant: i.variant,
    })),
  }))

  return NextResponse.json({ customerName: customer.name, orders }, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
