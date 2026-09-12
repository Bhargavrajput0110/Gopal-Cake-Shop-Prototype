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

  // Enforce Mandatory Customer Details
  if (!data.customerName || data.customerName.trim().length < 2) {
    return errorResponse('Customer Full Name is required to place a POS order', 'VALIDATION_ERROR', 400, [], requestId)
  }
  const cleanPhone = (data.customerPhone || '').replace(/\D/g, '')
  if (cleanPhone.length !== 10) {
    return errorResponse('Valid 10-digit Customer Phone Number is required to place a POS order', 'VALIDATION_ERROR', 400, [], requestId)
  }

  // Enforce Mandatory Delivery Address
  if (data.deliveryType === 'DELIVERY') {
    if (!data.address || !data.address.house?.trim() || !data.address.street?.trim()) {
      return errorResponse('House/Flat No. and Delivery Location are required for delivery orders', 'VALIDATION_ERROR', 400, [], requestId)
    }
  }

  // 1. Resolve Customer (Fast Track)
  const resolved = await CustomerSearchService.resolveCustomer({ 
    phone: cleanPhone, 
    name: data.customerName.trim() 
  });
  const customerId = resolved.id;

  const payload: CheckoutPayload = {
    customerId: customerId,
    branchId: data.branchId || 'default-branch',
    items: data.items,
    deliveryType: data.deliveryType as DeliveryType,
    deliveryAddress: data.deliveryType === 'DELIVERY' && data.address 
      ? [data.address.house, data.address.street, data.address.area, data.address.city, data.address.pin, data.address.landmark].filter(Boolean).join(', ')
      : undefined,
    targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : new Date().toISOString(),
    paymentMethod: data.payments && data.payments.length > 0 ? (data.payments[0].method as PaymentMethod) : PaymentMethod.CASH,
    paymentType: data.paymentType === 'PARTIAL' ? PaymentType.ADVANCE : PaymentType.FULL,
    payments: data.payments.map(p => ({ method: p.method as PaymentMethod, amount: p.amount })),
    idempotencyKey: data.idempotencyKey || `pos-${Date.now()}`,
    type: data.type || 'ORDER',
    couponCode: data.discountCode,
    overrideDiscount: data.overrideDiscount,
    isPriority: data.isPriority,
    isFarDistance: data.isFarDistance,
    deliveryDistanceKm: data.deliveryDistanceKm
  }

  // 3. Define Context (POS)
  const context: CheckoutContext = {
    source: OrderSource.POS,
    createdById: user.id,
    canOverridePrice: ['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole), // POS allows salespeople to negotiate/set custom design prices
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
