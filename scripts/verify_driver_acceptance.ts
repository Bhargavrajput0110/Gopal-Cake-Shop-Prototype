import 'dotenv/config'
import { prisma as db } from '../src/lib/prisma'
import { OrderSource, DeliveryFailureReason } from '@prisma/client'
import { StorefrontEngine } from '../src/lib/orders/StorefrontEngine'

async function setupDrivers(branchId: string) {
  const drivers = []
  for (let i = 1; i <= 6; i++) {
    const driver = await db.user.upsert({
      where: { email: `driver${i}@test.com` },
      update: { branchId },
      create: {
        email: `driver${i}@test.com`,
        username: `driver${i}`,
        name: `Driver ${i}`,
        passwordHash: 'dummy',
        phone: `999999990${i}`,
        role: 'DELIVERY',
        branchId,
        status: 'ACTIVE'
      }
    })
    drivers.push(driver)
  }
  return drivers
}

async function getDummyUsers() {
  const branch = await db.branch.findFirst()
  const product = await db.product.findFirst()
  
  if (!branch) throw new Error("No branch found")
  if (!product) throw new Error("No product found")
    
  let customer = await db.customer.findFirst({ where: { isVip: true } })
  if (!customer) {
    customer = await db.customer.create({
      data: { name: 'VIP Customer', phone: '5551234567', isVip: true }
    })
  }

  let normalCustomer = await db.customer.findFirst({ where: { isVip: false } })
  if (!normalCustomer) {
    normalCustomer = await db.customer.create({
      data: { name: 'Regular Customer', phone: '5559876543', isVip: false }
    })
  }
  
  return { customer, normalCustomer, branchId: branch.id, productId: product.id }
}

async function runSimulation() {
  console.log('--- Starting Driver Delivery Simulation ---')
  const { customer, normalCustomer, branchId, productId } = await getDummyUsers()
  
  const drivers = await setupDrivers(branchId)
  console.log(`Initialized 6 Drivers for Branch: ${branchId}`)

  // 1. Create 50 Deliveries
  // 12 VIP, 8 urgent, 10 cash collections
  console.log('1. Creating 50 Deliveries...')
  const orders = []
  
  for (let i = 1; i <= 50; i++) {
    const isVIP = i <= 12
    const isUrgent = i > 12 && i <= 20
    const isCOD = i > 20 && i <= 30
    
    // Assign cyclically to drivers
    const driverIndex = (i - 1) % 6
    const driver = drivers[driverIndex]

    const targetDate = new Date()
    // Stagger delivery times
    targetDate.setHours(targetDate.getHours() + (i % 5))
    
    const cartItem = {
      productId,
      productName: `Delivery Item ${i}`,
      quantity: 1,
      weight: 1,
      price: 500,
    }
    
    const context = { actorId: 'System', role: 'ADMIN', source: OrderSource.IN_STORE, canOverrideDelivery: true }
    
    // Checkout
    const order = await StorefrontEngine.processCheckout(context as any, {
      customerId: isVIP ? customer.id : normalCustomer.id,
      branchId,
      items: [cartItem],
      targetDate: targetDate.toISOString(),
      deliveryType: 'DELIVERY',
      paymentMethod: 'CASH',
      paymentType: isCOD ? 'ADVANCE' : 'FULL', // Advance leaves COD balance
      isPriority: isUrgent,
      internalNotes: isVIP ? 'VIP delivery!' : ''
    } as any)

    // Bypass KDS completely to place it directly in READY state and assign driver
    const updatedOrder = await db.order.update({
      where: { id: order.id },
      data: {
        status: 'READY',
        driverId: driver.id,
        deliveryAddress: `Test Address ${i}, City`
      }
    })
    
    orders.push(updatedOrder)
  }
  
  // 2. Simulate 5 Failed Deliveries
  console.log('2. Simulating 5 Failed Deliveries (Driver App Flow)...')
  for (let i = 0; i < 5; i++) {
    const order = orders[i]
    await db.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        deliveryFailureReason: DeliveryFailureReason.CUSTOMER_UNAVAILABLE
      }
    })
    await db.timeline.create({
      data: {
        orderId: order.id,
        actorId: order.driverId!,
        action: 'MARK_FAILED',
        eventType: 'FAILED_DELIVERY',
        status: 'CANCELLED',
        nextState: 'CANCELLED',
        note: 'No answer at door',
        reasonCode: 'CUSTOMER_UNAVAILABLE'
      }
    })
  }

  // 3. Simulate 20 Completed Deliveries (Half COD, Half Paid)
  console.log('3. Simulating 20 Completed Deliveries...')
  for (let i = 5; i < 25; i++) {
    const order = orders[i]
    await db.order.update({
      where: { id: order.id },
      data: {
        status: 'DELIVERED',
        cashCollectedAmount: 500 // Assuming full amount if COD
      }
    })
    await db.timeline.create({
      data: {
        orderId: order.id,
        actorId: order.driverId!,
        action: 'DRIVER_UPDATE',
        eventType: 'STATE_TRANSITION',
        status: 'DELIVERED',
        nextState: 'DELIVERED',
        note: 'Collected: ₹500'
      }
    })
  }

  // 4. Leave the remaining 25 in READY/OUT_FOR_DELIVERY state
  console.log('4. Transitioning 10 to OUT_FOR_DELIVERY...')
  for (let i = 25; i < 35; i++) {
    const order = orders[i]
    await db.order.update({
      where: { id: order.id },
      data: { status: 'OUT_FOR_DELIVERY' }
    })
  }
  
  console.log('✅ Driver Delivery Simulation Complete!')
  console.log('Run the Driver App and Manager Dashboard to visually inspect the live states.')
}

runSimulation()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
