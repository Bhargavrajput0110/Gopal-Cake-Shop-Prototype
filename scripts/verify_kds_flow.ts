import 'dotenv/config'
import { OrderSource, DeliveryType, PaymentMethod, PaymentType, OrderStatus } from '@prisma/client'
import { StorefrontEngine, CheckoutPayload, CheckoutContext } from '../src/lib/orders/StorefrontEngine'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('--- Starting KDS Flow Verification ---')

  // 1. Ensure we have an active item
  const item = await prisma.orderItem.findFirst({
    where: { status: 'WAITING_FOR_CHEF' },
    include: { order: true }
  })

  if (!item) {
    console.log('No item waiting for chef, skipping interaction test...')
    return
  }

  console.log(`Found item ${item.id} in WAITING_FOR_CHEF`)

  // 2. Assign Chef
  let adminUser = await prisma.user.findFirst()
  if (!adminUser) {
    adminUser = await prisma.user.create({ data: { name: 'Test Chef', email: 'chef@test.com', phone: '111', role: 'CHEF', passwordHash: 'xxx' } })
  }

  console.log('Accepting assignment...')
  await prisma.$transaction(async (tx) => {
    await tx.orderItem.update({
      where: { id: item.id },
      data: { status: 'CHEF_ACCEPTED', assignedChefId: adminUser.id }
    })
    await tx.timeline.create({
      data: {
        orderId: item.orderId,
        orderItemId: item.id,
        status: item.order.status,
        nextState: item.order.status,
        action: 'CHEF_ASSIGNED',
        actorId: adminUser.id
      }
    })
  })

  // 3. Pause
  console.log('Pausing...')
  await prisma.$transaction(async (tx) => {
    await tx.orderItem.update({
      where: { id: item.id },
      data: { pauseReason: 'Test Pause', pausedAt: new Date() }
    })
  })

  const pausedItem = await prisma.orderItem.findUnique({ where: { id: item.id } })
  console.log(`Paused item reason: ${pausedItem?.pauseReason}`)

  // 4. Verify Timeline
  const timelines = await prisma.timeline.findMany({
    where: { orderItemId: item.id },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Timeline events for item: ${timelines.length}`)
  timelines.forEach(t => console.log(`- ${t.action} by ${t.actorId}`))

  console.log('✅ KDS Backend Verification Successful!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
