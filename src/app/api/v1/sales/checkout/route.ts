import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { StorefrontEngine, CheckoutContext, CheckoutPayload } from '@/lib/orders/StorefrontEngine'
import { CustomerSearchService } from '@/lib/customers/CustomerSearchService'
import { OrderSource, PaymentMethod, PaymentType, DeliveryType } from '@prisma/client'

const SalesCheckoutSchema = z.object({
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
    messageOnCake: z.string().optional()
  })).min(1, 'Cart is empty'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentType: z.nativeEnum(PaymentType),
  branchId: z.string(),
  deliveryType: z.nativeEnum(DeliveryType),
  deliveryDate: z.string(),
  deliveryAddress: z.string().optional(),
  couponCode: z.string().optional(),
  internalNotes: z.string().optional(),
  referenceImages: z.array(z.string()).optional(), // Cloudinary URLs uploaded via Sales Dashboard
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !['SALESPERSON', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = SalesCheckoutSchema.parse(body)

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
      internalNotes: data.internalNotes,
      idempotencyKey: data.idempotencyKey
    }

    // 3. Define Context (Sales)
    const context: CheckoutContext = {
      source: OrderSource.SALES,
      createdById: session.user.id,
      canOverridePrice: false, // Sales cannot override standard pricing
      canOverrideDelivery: false,
      canAssignPriority: false
    }

    // 4. Process Checkout
    const order = await StorefrontEngine.processCheckout(context, payload)

    return NextResponse.json({ 
      success: true, 
      orderId: order.id,
      orderNumber: order.orderNumber
    })
  } catch (error: any) {
    console.error('Sales Checkout Error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
