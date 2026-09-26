import { NextResponse } from 'next/server'
import { StorefrontEngine, CheckoutContext, CheckoutPayload } from '@/lib/orders/StorefrontEngine'
import { CustomerSearchService } from '@/lib/customers/CustomerSearchService'
import { OrderSource, PaymentMethod, PaymentType, DeliveryType } from '@prisma/client'
import { PosCheckoutSchema } from '@/dtos/OrderSchemas'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { errorResponse } from '@/lib/apiUtils'
import { outboxProcessor } from '@/services/event-bus/OutboxProcessor'
import { registerSubscribers } from '@/services/event-bus/EventSubscribers'

const handler = async (ctx: HandlerContext) => {
  const { req, user, appRole, requestId } = ctx

  if (!appRole || !['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole)) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401, [], requestId)
  }

  const body = await req.json()
  const data = PosCheckoutSchema.parse(body)

  // Provide smart fallbacks for customer details
  let customerName = (data.customerName || '').trim()
  if (customerName.length < 2) {
    customerName = 'Walk-in Customer'
  }

  let cleanPhone = (data.customerPhone || '').replace(/\D/g, '')
  if (cleanPhone.length !== 10) {
    cleanPhone = '9999999999'
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
    name: customerName 
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

  // Enforce Business Rule: Salesperson discount capped at 25% max
  if (appRole === 'SALESPERSON' && data.overrideDiscount && data.overrideDiscount > 0) {
    // Calculate subtotal from items
    const subtotal = data.items.reduce((acc, item) => acc + ((item.overridePrice || 0) * item.quantity), 0);
    const maxAllowed = subtotal > 0 ? subtotal * 0.25 : 0;
    if (subtotal > 0 && data.overrideDiscount > (maxAllowed + 0.05)) {
      return errorResponse(`Salesperson discount is capped at 25% max (₹${maxAllowed.toFixed(2)}). For higher discounts, please contact Admin (Rishi Bhai).`, 'DISCOUNT_LIMIT_EXCEEDED', 400, [], requestId);
    }
  }

  // 3. Define Context (POS)
  const context: CheckoutContext = {
    source: OrderSource.POS,
    createdById: user.id,
    canOverridePrice: ['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole), // POS allows salespeople to negotiate/set custom design prices
    canOverrideDelivery: false,
    canOverrideDiscount: ['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole),
    canAssignPriority: true
  }

  // 4. Process Checkout
  // Note: withApiHandler catches exceptions and turns them into 500 automatically
  const order = await StorefrontEngine.processCheckout(context, payload)

  // 5. Immediately fire outbox poll so notifications (WhatsApp + Push) go out NOW
  //    — don't await: fire-and-forget so the API responds fast
  registerSubscribers()
  outboxProcessor.poll().catch((err) => console.error('[POS] Outbox poll failed:', err))

  return NextResponse.json({ 
    success: true, 
    orderId: order.id,
    orderNumber: order.orderNumber
  })
}

export const POST = withApiHandler(handler)
