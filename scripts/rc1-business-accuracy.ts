import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { StorefrontEngine } from '../src/lib/orders/StorefrontEngine'
import { DeliveryType, PaymentMethod, PaymentType } from '@prisma/client'

async function verifyFinancialAccuracy() {
  console.log("Starting Financial Accuracy Verification...")
  
  const branch = await prisma.branch.findFirst({ where: { code: 'KHD' }})
  const customer = await prisma.customer.findFirst()
  const product = await prisma.product.findFirst()

  if (!branch || !customer || !product) {
    console.error("Missing seeded data. Run seed first.")
    return
  }

  let hasErrors = false

  // Test Case 1: Standard Order (Base Price + GST + Delivery)
  // Assume: Base Price = 500, GST = 0% (or whatever DB setting is), Delivery = 100
  // Note: SettingsService uses DB. Let's create an order and let the engine calculate it.
  try {
    const payload1 = {
      customerId: customer.id,
      branchId: branch.id,
      deliveryType: DeliveryType.DELIVERY,
      targetDate: new Date().toISOString(),
      items: [{ productId: product.id, quantity: 2, weight: 1, price: 500, productName: product.name }],
      paymentMethod: PaymentMethod.CASH,
      paymentType: PaymentType.ADVANCE,
      payments: [{ method: PaymentMethod.CASH, amount: 200 }]
    }
    const context1 = { source: 'POS' as const, branchId: branch.id }
    
    const order1 = await StorefrontEngine.processCheckout(context1, payload1)
    
    console.log(`Order 1 created: ${order1.orderNumber}`)
    console.log(`- Subtotal expected: 1000, Actual: ${order1.subtotal}`)
    console.log(`- Delivery expected: 100 (or setting), Actual: ${order1.deliveryCharge}`)
    // Advance = 200
    const advancePayments = order1.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    console.log(`- Advance expected: 200, Actual: ${advancePayments}`)
    console.log(`- Total Amount: ${order1.totalAmount}`)
    
    const gstRateStr = await prisma.settings.findFirst({ where: { key: 'GST_RATE' }})
    const gstRate = parseFloat(gstRateStr?.value?.toString() || '0')
    const expectedTax = (Number(order1.subtotal) * gstRate) / 100
    const expectedTotal = Number(order1.subtotal) + Number(order1.deliveryCharge) + expectedTax - Number(order1.discount)
    
    if (Math.abs(expectedTotal - Number(order1.totalAmount)) > 0.01) {
      console.error(`[P0] Order 1 Financial Mismatch! Expected Total ${expectedTotal} != Actual ${order1.totalAmount} (Subtotal: ${order1.subtotal}, Delivery: ${order1.deliveryCharge}, GST: ${expectedTax})`)
      hasErrors = true
    } else {
      console.log(`✅ Order 1 Financials Match perfectly (Includes GST of ${expectedTax}).`)
    }
  } catch (err: any) {
    console.error(`Order 1 failed to process: ${err.message}`)
    hasErrors = true
  }

  // Test Case 2: Full Payment Pickup Order (No Delivery, No Advance (Full payment))
  try {
    const payload2 = {
      customerId: customer.id,
      branchId: branch.id,
      deliveryType: DeliveryType.PICKUP,
      targetDate: new Date().toISOString(),
      items: [{ productId: product.id, quantity: 1, weight: 1, price: 750, productName: product.name }],
      paymentMethod: PaymentMethod.UPI,
      paymentType: PaymentType.FULL
    }
    const context2 = { source: 'POS' as const, branchId: branch.id }
    
    const order2 = await StorefrontEngine.processCheckout(context2, payload2)
    
    console.log(`Order 2 created: ${order2.orderNumber}`)
    console.log(`- Delivery expected: 0, Actual: ${order2.deliveryCharge}`)
    const fullPayments = order2.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    console.log(`- Total Paid expected: ${order2.totalAmount}, Actual: ${fullPayments}`)
    
    if (Number(order2.deliveryCharge) !== 0) {
      console.error(`[P0] Order 2 Pickup Order charged delivery fee: ${order2.deliveryCharge}`)
      hasErrors = true
    }
    
    if (Math.abs(Number(order2.totalAmount) - fullPayments) > 0.01) {
      console.error(`[P0] Order 2 Full Payment Mismatch! Paid ${fullPayments} != Total ${order2.totalAmount}`)
      hasErrors = true
    } else {
      console.log(`✅ Order 2 Financials Match perfectly.`)
    }
  } catch (err: any) {
    console.error(`Order 2 failed to process: ${err.message}`)
    hasErrors = true
  }

  console.log("-----------------------------------------")
  if (!hasErrors) {
    console.log("✅ PASS: Financial Accuracy Verification.")
  } else {
    console.log("❌ FAIL: Financial inaccuracies found.")
  }
}

verifyFinancialAccuracy()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
