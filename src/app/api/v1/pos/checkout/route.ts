import { NextResponse } from 'next/server'
import { StorefrontEngine, CheckoutContext, CheckoutPayload } from '@/lib/orders/StorefrontEngine'
import { CustomerSearchService } from '@/lib/customers/CustomerSearchService'
import { OrderSource, PaymentMethod, PaymentType, DeliveryType } from '@prisma/client'
import { PosCheckoutSchema } from '@/dtos/OrderSchemas'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { errorResponse } from '@/lib/apiUtils'
import { NotificationService } from '@/services/notifications/NotificationService'

const handler = async (ctx: HandlerContext) => {
  const { req, user, appRole, requestId } = ctx

  if (!appRole || !['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole)) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401, [], requestId)
  }

  const body = await req.json()
  const data = PosCheckoutSchema.parse(body)

  let customerName = (data.customerName || '').trim()
  if (customerName.length < 2) customerName = 'Walk-in Customer'

  let cleanPhone = (data.customerPhone || '').replace(/\D/g, '')
  if (cleanPhone.length !== 10) cleanPhone = '9999999999'

  if (data.deliveryType === 'DELIVERY') {
    if (!data.address || !data.address.house?.trim() || !data.address.street?.trim()) {
      return errorResponse('House/Flat No. and Delivery Location are required for delivery orders', 'VALIDATION_ERROR', 400, [], requestId)
    }
  }

  const resolved = await CustomerSearchService.resolveCustomer({ phone: cleanPhone, name: customerName })
  const customerId = resolved.id

  // Convert global POS vendor assignments into item-level required vendors for StorefrontEngine
  if (data.vendorAssignments && data.items.length > 0) {
    const v = data.vendorAssignments;
    const globalVendors: string[] = [];
    if (v.photoVendorRequired) globalVendors.push('VENDOR_PHOTO');
    if (v.acrylicVendorRequired) globalVendors.push('VENDOR_ACRYLIC');
    if (v.floralVendorRequired) globalVendors.push('VENDOR_FLORIST');
    
    if (globalVendors.length > 0) {
      if (!data.items[0].requiredVendors) data.items[0].requiredVendors = [];
      data.items[0].requiredVendors = Array.from(new Set([...data.items[0].requiredVendors, ...globalVendors]));
      // Also attach the per-vendor notes so they flow through to child items
      (data.items[0] as any).vendorNotes = {
        VENDOR_PHOTO: v.photoVendorRequired || '',
        VENDOR_ACRYLIC: v.acrylicVendorRequired || '',
        VENDOR_FLORIST: v.floralVendorRequired || '',
      };
    }
  }

  const payload: CheckoutPayload = {
    customerId,
    branchId: data.branchId || 'default-branch',
    items: data.items,
    deliveryType: data.deliveryType as DeliveryType,
    deliveryAddress: data.deliveryType === 'DELIVERY' && data.address
      ? [data.address.house, data.address.street, data.address.area, data.address.city, data.address.pin, data.address.landmark].filter(Boolean).join(', ')
      : undefined,
    targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : new Date().toISOString(),
    paymentMethod: data.payments?.length > 0 ? (data.payments[0].method as PaymentMethod) : PaymentMethod.CASH,
    paymentType: data.paymentType === 'PARTIAL' ? PaymentType.ADVANCE : PaymentType.FULL,
    payments: data.payments.map(p => ({ method: p.method as PaymentMethod, amount: p.amount })),
    idempotencyKey: data.idempotencyKey || `pos-${Date.now()}`,
    type: data.type || 'ORDER',
    couponCode: data.discountCode,
    overrideDiscount: data.overrideDiscount,
    isPriority: data.isPriority,
    isFarDistance: data.isFarDistance,
    deliveryDistanceKm: data.deliveryDistanceKm,
  }

  if (appRole === 'SALESPERSON' && data.overrideDiscount && data.overrideDiscount > 0) {
    const subtotal = data.items.reduce((acc, item) => acc + ((item.overridePrice || 0) * item.quantity), 0)
    const maxAllowed = subtotal > 0 ? subtotal * 0.25 : 0
    if (subtotal > 0 && data.overrideDiscount > (maxAllowed + 0.05)) {
      return errorResponse(`Salesperson discount is capped at 25% max (₹${maxAllowed.toFixed(2)}). For higher discounts, please contact Admin (Rishi Bhai).`, 'DISCOUNT_LIMIT_EXCEEDED', 400, [], requestId)
    }
  }

  const context: CheckoutContext = {
    source: OrderSource.POS,
    createdById: user.id,
    canOverridePrice: ['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole),
    canOverrideDelivery: false,
    canOverrideDiscount: ['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole),
    canAssignPriority: true,
  }

  const order = await StorefrontEngine.processCheckout(context, payload)

  // Fire notifications DIRECTLY & SYNCHRONOUSLY — no Outbox, no cron dependency.
  // This guarantees: (1) Salesperson gets IN_APP alert, (2) Customer gets WhatsApp.
  try {
    await NotificationService.handleTimelineEvent(
      {
        action: 'CREATED_VIA_STOREFRONT',
        orderId: order.id,
        orderNumber: order.orderNumber,
        branchId: order.branchId,
        actorId: user.id,
        nextState: order.status,
      },
      `pos-checkout-${order.id}` // deterministic eventId for idempotency
    )
  } catch (notifErr) {
    // NEVER fail the checkout because of a notification error
    console.error('[POS] Notification dispatch failed (non-fatal):', notifErr)
  }

  return NextResponse.json({
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
  })
}

export const POST = withApiHandler(handler)
