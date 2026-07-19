import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { StorefrontEngine } from '../src/lib/orders/StorefrontEngine'
import { DeliveryType, OrderSource } from '@prisma/client'
import crypto from 'crypto'

async function runStressTest() {
  console.log("Starting RC1 Sustained Spike Load Testing...")
  
  const branch = await prisma.branch.findFirst({ where: { code: 'KHD' }})
  const customer = await prisma.customer.findFirst()
  // Fetch any actual product id to ensure valid DB relations
  const product = await prisma.product.findFirst()

  if (!branch || !customer || !product) {
    console.error("Missing seeded data. Run seed first.")
    return
  }

  const concurrentOrders = 100
  const promises: Promise<any>[] = []

  const start = Date.now()

  console.log(`Firing ${concurrentOrders} concurrent checkout transactions...`)

  for (let i = 0; i < concurrentOrders; i++) {
    const payload = {
      customerId: customer.id,
      branchId: branch.id,
      deliveryType: DeliveryType.DELIVERY,
      deliveryAddress: `Stress Address ${i}`,
      deliveryDate: new Date().toISOString(),
      targetDate: new Date().toISOString(),
      deliveryTimeSlot: "10:00 AM - 12:00 PM",
      advancePaid: 100, // Partial payment
      items: [
        { 
          productId: product.id, 
          quantity: 1, 
          weight: 1, 
          flavor: 'Chocolate', 
          messageOnCake: `Stress ${i}`, 
          price: 500, 
          productName: product.name 
        }
      ]
    }

    const context = {
      source: 'WEBSITE' as OrderSource,
      branchId: branch.id,
      canOverridePrices: false,
      canOverrideDelivery: false,
      requireAdvancePayment: true,
      userRole: 'CUSTOMER' as const
    }

    promises.push(
      StorefrontEngine.processCheckout(context, payload)
        .catch(err => {
          console.error(`Order ${i} failed: ${err.message}`)
          return null
        })
    )
  }

  const results = await Promise.all(promises)
  
  const end = Date.now()
  const durationMs = end - start
  const successfulCount = results.filter(r => r !== null).length
  const failedCount = concurrentOrders - successfulCount

  console.log(`\nStress Test Results:`)
  console.log(`Duration: ${durationMs}ms`)
  console.log(`Success: ${successfulCount}`)
  console.log(`Failed: ${failedCount}`)

  if (failedCount > 0) {
    console.error(`❌ STRESS TEST FAILED. Dropped ${failedCount} orders.`)
  } else if (durationMs > 20000) {
    console.error(`⚠️ STRESS TEST PASSED WITH WARNING. Took ${durationMs}ms which is slow.`)
  } else {
    console.log(`✅ STRESS TEST PASSED. Handled ${concurrentOrders} concurrent orders perfectly.`)
  }
}

runStressTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
