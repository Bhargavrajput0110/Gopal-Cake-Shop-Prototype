import { PrismaClient } from '@prisma/client'
import assert from 'assert'

const prisma = new PrismaClient()

async function main() {
  console.log("--- PHASE 4 VERIFICATION ---")
  
  // Create a dummy order for testing
  const dummyCustomer = await prisma.customer.upsert({
    where: { phone: '+91 9999999999' },
    update: {},
    create: { phone: '+91 9999999999', name: 'Test Customer', branchId: 'BRANCH_UMA' }
  })
  
  const order = await prisma.order.create({
    data: {
      orderNumber: `TEST-${Date.now()}`,
      customerId: dummyCustomer.id,
      branchId: 'BRANCH_UMA',
      targetDate: new Date(),
      status: 'NEW',
      subtotal: 0,
      totalAmount: 0
    }
  })
  
  let passed = true
  const checks: string[] = []
  
  function report(name: string, ok: boolean, err?: any) {
    checks.push(`${ok ? 'PASS' : 'FAIL'} - ${name}`)
    if (!ok) {
      passed = false
      if (err) checks.push(`  Error: ${err.message || err}`)
    }
  }

  try {
    // 4. Create a real ingredient request.
    const req = await prisma.ingredientRequest.create({
      data: {
        orderId: order.id,
        itemCode: 'FLOUR',
        itemName: 'Flour',
        qty: 1,
        unit: 'kg',
        requestedById: 'user-sales1', // just a dummy id
        status: 'PENDING'
      }
    })
    report('Create ingredient request', true)
    
    // 9. Create a vendor task
    const task = await prisma.vendorTask.create({
      data: {
        orderId: order.id,
        vendorType: 'photo',
        status: 'PENDING',
        instructions: 'Test instructions'
      }
    })
    report('Create vendor task', true)
    
    // Test persistence
    const fetchedReq = await prisma.ingredientRequest.findUnique({ where: { id: req.id } })
    const fetchedTask = await prisma.vendorTask.findUnique({ where: { id: task.id } })
    report('Ingredient request persistence', fetchedReq !== null)
    report('Vendor task persistence', fetchedTask !== null)

  } catch (e) {
    report('Database operations', false, e)
  }
  
  // Cleanup test order
  await prisma.vendorTask.deleteMany({ where: { orderId: order.id } })
  await prisma.ingredientRequest.deleteMany({ where: { orderId: order.id } })
  await prisma.order.delete({ where: { id: order.id } })

  console.log(checks.join('\n'))
  process.exit(passed ? 0 : 1)
}

main().catch(console.error).finally(() => prisma.$disconnect())
