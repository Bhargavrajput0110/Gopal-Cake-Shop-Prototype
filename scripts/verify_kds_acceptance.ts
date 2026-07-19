import 'dotenv/config'
import { prisma as db } from '../src/lib/prisma'
import { OrderSource } from '@prisma/client'
import { StorefrontEngine } from '../src/lib/orders/StorefrontEngine'

async function getDummyUsers() {
  const item1 = await db.orderItem.findFirst({ include: { order: true } })
  const branch = await db.branch.findFirst()
  const product = await db.product.findFirst()
  
  if (!item1 || !item1.order) throw new Error("No order items found in DB to extract customer IDs")
  if (!branch) throw new Error("No branch found")
  if (!product) throw new Error("No product found")
  
  return { customer: { id: item1.order.customerId }, normalCustomer: { id: item1.order.customerId }, branchId: branch.id, productId: product.id }
}

async function runSimulation() {
  console.log('--- Starting Saturday Rush Simulation ---')
  const { customer, normalCustomer, branchId, productId } = await getDummyUsers()
  
  const orders = []
  const orderItems = []
  
  console.log('1. Creating 50 Cakes (Orders)...')
  for (let i = 1; i <= 50; i++) {
    const isVIP = i <= 12
    const isUrgent = i > 12 && i <= 20
    const isPhoto = i > 20 && i <= 30
    const isWedding = i > 30 && i <= 35
    const isLastMinute = i > 35 && i <= 40
    
    let targetDate = new Date()
    if (isUrgent || isLastMinute) {
      targetDate.setMinutes(targetDate.getMinutes() + 45) // Due in 45 mins
    } else {
      targetDate.setHours(targetDate.getHours() + 4) // Due later today
    }
    
    const engine = new StorefrontEngine(isVIP ? customer.id : normalCustomer.id, 'System')
    const cartItem = {
      productId: productId,
      productName: isWedding ? '3-Tier Wedding Cake' : isPhoto ? 'Custom Photo Cake' : `Standard Cake ${i}`,
      quantity: 1,
      weight: isWedding ? 5 : 1,
      flavor: 'Chocolate',
      price: 1500,
    }
    
    const context = { actorId: 'System', role: 'ADMIN', source: OrderSource.IN_STORE, canOverrideDelivery: true }
    
    const order = await StorefrontEngine.processCheckout(context as any, {
      customerId: isVIP ? customer.id : normalCustomer.id,
      branchId: branchId,
      items: [cartItem],
      targetDate: targetDate.toISOString(),
      deliveryType: 'DELIVERY',
      paymentMethod: 'CASH',
      paymentType: 'FULL',
      isPriority: isUrgent || isLastMinute,
      internalNotes: isVIP ? 'VIP Customer' : ''
    } as any)
    
    orders.push(order)
    
    const dbOrder = await db.order.findUnique({ where: { id: order.id }, include: { items: true }})
    if (dbOrder && dbOrder.items.length > 0) {
      orderItems.push(dbOrder.items[0])
    }
  }
  
  console.log('2. Sales Edits 5 orders (Kitchen Notes added)')
  for (let i = 0; i < 5; i++) {
    await db.kitchenNote.create({
      data: {
        orderItemId: orderItems[i].id,
        createdBy: 'Sales Agent',
        role: 'SALESPERSON',
        type: 'Customer Change',
        message: 'Customer requested eggless instead of regular.'
      }
    })
  }
  
  console.log('3. Cancelling 2 orders')
  for (let i = 5; i < 7; i++) {
    await db.orderItem.update({
      where: { id: orderItems[i].id },
      data: { status: 'CANCELLED' }
    })
  }
  
  console.log('4. Pausing 3 orders (Blocked)')
  for (let i = 7; i < 10; i++) {
    await db.orderItem.update({
      where: { id: orderItems[i].id },
      data: { status: 'MAKING', isBlocked: true, pauseReason: 'Waiting for photo print' }
    })
  }
  
  console.log('5. Advancing 20 to QC_PASSED and 20 to PACKED')
  for (let i = 10; i < 30; i++) {
    await db.orderItem.update({
      where: { id: orderItems[i].id },
      data: { status: 'QC_PASSED', qcAt: new Date() }
    })
  }
  for (let i = 30; i < 50; i++) {
    await db.orderItem.update({
      where: { id: orderItems[i].id },
      data: { status: 'PACKED', packedAt: new Date() }
    })
  }
  
  console.log('6. Assigning Deliveries (Simulating Driver Dashboard prep)')
  // Deliveries will be used in Stage 3, but we set them up here.
  for (let i = 35; i < 50; i++) { // 15 Deliveries
    await db.orderItem.update({
      where: { id: orderItems[i].id },
      data: { status: 'READY_FOR_PICKUP' }
    })
    await db.order.update({
      where: { id: orderItems[i].orderId },
      data: { status: 'READY' }
    })
  }
  
  console.log('✅ Saturday Rush Simulation Complete!')
  console.log(`Created ${orders.length} orders total. Run KDS to visually inspect the board.`)
}

runSimulation()
  .catch(console.error)
  .finally(async () => await db.$disconnect())
