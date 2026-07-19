import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { StorefrontEngine, CheckoutContext, CheckoutPayload } from '@/lib/orders/StorefrontEngine'
import { CustomerSearchService } from '@/lib/customers/CustomerSearchService'
import { OrderSource, PaymentMethod, PaymentType, DeliveryType } from '@prisma/client'

const CheckoutSchema = z.object({
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
  customer: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    email: z.string().email().optional().or(z.literal('')),
  }),
  address: z.object({
    house: z.string(),
    street: z.string(),
    area: z.string(),
    city: z.string(),
    pin: z.string(),
    landmark: z.string().optional(),
  }),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    weight: z.number().default(1),
    flavor: z.string().optional(),
    messageOnCake: z.string().optional()
  })).min(1, 'Cart is empty'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  deliveryType: z.nativeEnum(DeliveryType),
  branchId: z.string(),
  deliveryDate: z.string(),
})

const handler = async (ctx: HandlerContext) => {
  const body = await ctx.req.json()
  const data = CheckoutSchema.parse(body)

  // 1. Resolve Customer via CustomerSearchService
  const customer = await CustomerSearchService.resolveCustomer({
    phone: data.customer.phone,
    name: data.customer.name,
    email: data.customer.email
  })

  const formattedAddress = `${data.address.house}, ${data.address.street}, ${data.address.area}, ${data.address.city}, ${data.address.pin} ${data.address.landmark ? `(Near ${data.address.landmark})` : ''}`

  // 2. Build Payload
  const payload: CheckoutPayload = {
    customerId: customer.id,
    branchId: data.branchId,
    items: data.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      weight: item.weight,
      flavor: item.flavor,
      messageOnCake: item.messageOnCake
    })),
    deliveryType: data.deliveryType,
    targetDate: data.deliveryDate,
    deliveryAddress: formattedAddress,
    paymentMethod: data.paymentMethod,
    paymentType: PaymentType.FULL, // Assuming FULL for website for now
    idempotencyKey: data.idempotencyKey
  }

  // 3. Define Context (Website)
  const context: CheckoutContext = {
    source: OrderSource.WEBSITE,
    canOverridePrice: false,
    canOverrideDelivery: false,
    canAssignPriority: false
  }

  // 4. Process Checkout
  const order = await StorefrontEngine.processCheckout(context, payload)

  return NextResponse.json({ 
    success: true, 
    trackingId: order.trackingId, 
    orderId: order.id 
  })
}

export const POST = withApiHandler(handler, true)
