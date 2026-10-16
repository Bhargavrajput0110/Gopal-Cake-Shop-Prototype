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
  // If the user pastes with 91 or +91 country code, strip it so it's 10 digits
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    cleanPhone = cleanPhone.substring(2);
  } else if (cleanPhone.length === 13 && cleanPhone.startsWith('091')) {
    cleanPhone = cleanPhone.substring(3);
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.substring(1);
  }
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
    const cakeVendors: string[] = [];
    if (v.photoVendorRequired) cakeVendors.push('VENDOR_PHOTO');
    if (v.acrylicVendorRequired) cakeVendors.push('VENDOR_ACRYLIC');
    if (v.floralVendorRequired) cakeVendors.push('VENDOR_FLORIST');
    
    if (cakeVendors.length > 0) {
      // Find the specific cake item to attach cake supplies to (avoid attaching cake supplies to a bouquet item)
      const targetCakeItem = data.items.find((item: any) => {
        const isBqt = item.requiredVendors?.includes('VENDOR_FLORIST') && !item.designId && (!item.weight || item.weight === 0);
        return !isBqt;
      }) || data.items[0];

      if (!targetCakeItem.requiredVendors) targetCakeItem.requiredVendors = [];
      targetCakeItem.requiredVendors = Array.from(new Set([...targetCakeItem.requiredVendors, ...cakeVendors]));
      // Also attach the per-vendor notes so they flow through to child items
      (targetCakeItem as any).vendorNotes = {
        ...((targetCakeItem as any).vendorNotes || {}),
        ...(v.photoVendorRequired ? { VENDOR_PHOTO: v.photoVendorRequired } : {}),
        ...(v.acrylicVendorRequired ? { VENDOR_ACRYLIC: v.acrylicVendorRequired } : {}),
        ...(v.floralVendorRequired ? { VENDOR_FLORIST: v.floralVendorRequired } : {}),
      };
    }
  }

  const payload: CheckoutPayload = {
    customerId,
    branchId: data.branchId || 'default-branch',
    items: data.items,
    customerNotes: data.notes || data.items?.find((i: any) => i.notes)?.notes,
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
    const hasB2bItems = data.items.some(i => i.productId.startsWith('b2b-'));
    const subtotal = data.items.reduce((acc, item) => acc + ((item.overridePrice || 0) * item.quantity), 0)
    // Salesperson gets 25% max for retail, but B2B portal allows up to 40% admin-approved rates
    const maxPercent = hasB2bItems ? 0.40 : 0.25;
    const maxAllowed = subtotal > 0 ? subtotal * maxPercent : 0
    if (subtotal > 0 && data.overrideDiscount > (maxAllowed + 0.05)) {
      return errorResponse(`Salesperson discount is capped at ${maxPercent * 100}% max (₹${maxAllowed.toFixed(2)}). For higher discounts, please contact Admin (Rishi Bhai).`, 'DISCOUNT_LIMIT_EXCEEDED', 400, [], requestId)
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
