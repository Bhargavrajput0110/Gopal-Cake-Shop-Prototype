import 'dotenv/config'
import { OrderSource, DeliveryType, PaymentMethod, PaymentType, OrderStatus } from '@prisma/client'
import { StorefrontEngine, CheckoutPayload, CheckoutContext } from '../src/lib/orders/StorefrontEngine'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('--- Starting Multi-Item Order Verification ---')

  // 1. Setup Test Data
  const branch = await prisma.branch.findFirst()
  if (!branch) throw new Error('No branch found')
    
  let customer = await prisma.customer.findFirst({ where: { phone: '9999999999' } })
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: 'Test VIP', phone: '9999999999', isVip: true }
    })
  }

  let products = await prisma.product.findMany({ take: 2 })
  if (products.length < 2) {
    console.log('Seeding dummy products...')
    let cat = await prisma.category.findFirst()
    if (!cat) {
      cat = await prisma.category.create({ data: { name: 'Test Category', slug: 'test-cat-' + Date.now() } })
    }
    await prisma.product.create({
      data: { name: 'Custom Cake A', categoryId: cat.id, basePrice: 500, availableForSale: true }
    })
    await prisma.product.create({
      data: { name: 'Custom Cake B', categoryId: cat.id, basePrice: 600, availableForSale: true }
    })
    products = await prisma.product.findMany({ take: 2 })
  }

  // 2. Build Payload
  const payload: CheckoutPayload = {
    customerId: customer.id,
    branchId: branch.id,
    type: 'ORDER',
    deliveryType: DeliveryType.PICKUP,
    targetDate: new Date().toISOString(),
    paymentMethod: PaymentMethod.CASH,
    paymentType: PaymentType.PARTIAL,
    idempotencyKey: `test_order_${Date.now()}`,
    items: [
      {
        productId: products[0].id,
        quantity: 1,
        weight: 1,
        flavor: 'Chocolate Truffle',
        shape: 'Round',
        messageOnCake: 'Happy Birthday',
        designName: 'Spider-Man Blue',
        boxCount: 1,
        estimatedPrepMinutes: 30
      },
      {
        productId: products[1].id,
        quantity: 2,
        weight: 0.5,
        flavor: 'Vanilla',
        designName: 'Barbie Pink',
        referenceImages: ['https://example.com/barbie.jpg']
      }
    ]
  }

  const context: CheckoutContext = {
    source: OrderSource.POS,
    createdById: undefined,
    canOverridePrice: true
  }

  // 3. Process Checkout
  console.log('Processing checkout...')
  const order = await StorefrontEngine.processCheckout(context, payload)
  console.log(`Order created: ${order.orderNumber} (ID: ${order.id})`)

  // 4. Verify DB State
  const dbOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      items: {
        include: { media: true }
      }
    }
  })

  if (!dbOrder) throw new Error('Order not found in DB')
  console.log(`\nVerified Order Status: ${dbOrder.status}`)
  console.log(`Number of OrderItems: ${dbOrder.items.length}`)
  
  dbOrder.items.forEach((item, index) => {
    console.log(`\n--- Item ${index + 1} ---`)
    console.log(`Product: ${item.productName}`)
    console.log(`Quantity: ${item.quantity}`)
    console.log(`Weight: ${item.weight}kg`)
    console.log(`Flavor: ${item.flavor}`)
    console.log(`Design: ${item.designName}`)
    console.log(`Shape: ${item.shape}`)
    console.log(`Media Count: ${item.media.length}`)
  })

  console.log('\n✅ Verification Successful!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
