import { NextResponse } from 'next/server'
import { StorefrontEngine, CheckoutContext, CheckoutPayload } from '@/lib/orders/StorefrontEngine'
import { CustomerSearchService } from '@/lib/customers/CustomerSearchService'
import { OrderSource, PaymentMethod, PaymentType, DeliveryType } from '@prisma/client'
import { PosCheckoutSchema } from '@/dtos/OrderSchemas'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { errorResponse } from '@/lib/apiUtils'

const handler = async (ctx: HandlerContext) => {
  const { req, user, appRole, requestId } = ctx

  if (!appRole || !['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole)) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401, [], requestId)
  }

  const body = await req.json()
  const data = PosCheckoutSchema.parse(body)

  // 1. Resolve Customer (Fast Track)
  const customerId = data.customerId === 'walk-in' ? (await CustomerSearchService.resolveCustomer({ phone: '0000000000', name: 'Walk-in' })).id : data.customerId

  const payload: CheckoutPayload = {
    customerId: customerId,
    branchId: data.branchId || 'default-branch',
    items: data.items,
    deliveryType: DeliveryType.PICKUP,
    targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : new Date().toISOString(),
    paymentMethod: data.payments && data.payments.length > 0 ? (data.payments[0].method as PaymentMethod) : PaymentMethod.CASH,
    paymentType: data.paymentType === 'PARTIAL' ? PaymentType.ADVANCE : PaymentType.FULL,
    payments: data.payments.map(p => ({ method: p.method as PaymentMethod, amount: p.amount })),
    idempotencyKey: `pos-${Date.now()}`,
    type: 'ORDER',
    couponCode: data.discountCode,
    overrideDiscount: data.overrideDiscount,
    isPriority: data.isPriority
  }

  // 3. Define Context (POS)
  const context: CheckoutContext = {
    source: OrderSource.POS,
    createdById: user.id,
    canOverridePrice: appRole === 'ADMIN', // Only admins using POS can override price
    canOverrideDelivery: false,
    canOverrideDiscount: ['ADMIN', 'MANAGER'].includes(appRole),
    canAssignPriority: true
  }

  // 4. Process Checkout
  // Note: withApiHandler catches exceptions and turns them into 500 automatically
  const order = await StorefrontEngine.processCheckout(context, payload)

  return NextResponse.json({ 
    success: true, 
    orderId: order.id,
    orderNumber: order.orderNumber
  })
}

export const POST = withApiHandler(handler)
