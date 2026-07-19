import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { StorefrontEngine, CheckoutContext, CheckoutPayload } from '@/lib/orders/StorefrontEngine'
import { CustomerSearchService } from '@/lib/customers/CustomerSearchService'
import { OrderSource, PaymentMethod, PaymentType, DeliveryType } from '@prisma/client'

const AdminCheckoutSchema = z.object({
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
  customer: z.object({
    phone: z.string().min(10, 'Valid phone number is required'),
    name: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
  }),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    weight: z.number().default(1),
    flavor: z.string().optional(),
    messageOnCake: z.string().optional(),
    overridePrice: z.number().optional() // Admins can set custom prices
  })).min(1, 'Cart is empty'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentType: z.nativeEnum(PaymentType),
  branchId: z.string(),
  deliveryType: z.nativeEnum(DeliveryType),
  deliveryDate: z.string(),
  deliveryAddress: z.string().optional(),
  couponCode: z.string().optional(),
  overrideDeliveryCharge: z.number().optional(), // Admins can waive or set delivery fee
  isPriority: z.boolean().optional(), // Admins can prioritize
  internalNotes: z.string().optional(),
  referenceImages: z.array(z.string()).optional(),
})

export const POST = withApiHandler(async (ctx: HandlerContext) => {
  const { user, appRole, req } = ctx
  if (!user || appRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
    const data = AdminCheckoutSchema.parse(body)

    // 1. Resolve Customer
    const customer = await CustomerSearchService.resolveCustomer({
      phone: data.customer.phone,
      name: data.customer.name,
      email: data.customer.email
    })

    // 2. Build Payload
    const payload: CheckoutPayload = {
      customerId: customer.id,
      branchId: data.branchId,
      items: data.items,
      deliveryType: data.deliveryType,
      targetDate: data.deliveryDate,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod,
      paymentType: data.paymentType,
      couponCode: data.couponCode,
      overrideDeliveryCharge: data.overrideDeliveryCharge,
      isPriority: data.isPriority,
      internalNotes: data.internalNotes,
      idempotencyKey: data.idempotencyKey
    }

    // 3. Define Context (Admin)
    const context: CheckoutContext = {
      source: OrderSource.ADMIN,
      createdById: user.id,
      canOverridePrice: true, // Admin superpowers
      canOverrideDelivery: true, // Admin superpowers
      canAssignPriority: true // Admin superpowers
    }

    // 4. Process Checkout
    const order = await StorefrontEngine.processCheckout(context, payload)

    return NextResponse.json({ 
      success: true, 
      orderId: order.id,
      orderNumber: order.orderNumber
    })
}, true)
