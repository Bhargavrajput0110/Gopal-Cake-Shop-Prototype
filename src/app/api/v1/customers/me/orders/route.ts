import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { CustomerService } from '@/services/CustomerService'
import { errorResponse } from '@/lib/apiUtils'

const handler = async (ctx: HandlerContext) => {
  const { req, user, requestId } = ctx

  const phone = user.phone || user.user_metadata?.phone
  if (!phone) {
    return errorResponse('Customer profile not linked', 'NOT_FOUND', 404, [], requestId)
  }

  const customer = await CustomerService.getCustomerByPhone(phone)
  if (!customer) {
    return errorResponse('Customer not found in CRM', 'NOT_FOUND', 404, [], requestId)
  }

  const { searchParams } = req.nextUrl
  let page = parseInt(searchParams.get('page') || '1', 10)
  let limit = parseInt(searchParams.get('limit') || '10', 10)

  if (isNaN(page) || page < 1) page = 1
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 10

  const skip = (page - 1) * limit

  const whereClause = {
    customerId: customer.id
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
        payments: true
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      skip,
      take: limit
    }),
    prisma.order.count({ where: whereClause })
  ])

  // Map to the shape expected by the frontend
  const mappedOrders = orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: customer.name,
    customerPhone: customer.phone,
    grandTotal: Number(order.totalAmount || 0),
    totalAmount: Number(order.totalAmount || 0),
    advancePaid: order.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0,
    pendingBalance: Number(order.totalAmount || 0) - (order.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0),
    timeTarget: order.targetDate?.toISOString(),
    targetDate: order.targetDate?.toISOString(),
    deliveryType: order.deliveryType,
    deliveryAddress: order.deliveryAddress,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map(item => ({
      name: item.productName,
      qty: item.quantity,
      weight: item.weight ? `${item.weight}kg` : undefined,
      notes: item.notes || item.messageOnCake || undefined,
      flavor: item.flavor || undefined,
      price: Number(item.price)
    }))
  }))

  return NextResponse.json({
    data: mappedOrders,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  })
}

export const GET = withApiHandler(handler, true)
