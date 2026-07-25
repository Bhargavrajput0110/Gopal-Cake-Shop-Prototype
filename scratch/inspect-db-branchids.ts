import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function inspectDb() {
  console.log('=== INSPECTING FIRST 5 ORDERS IN DB ===')
  const orders = await prisma.order.findMany({
    take: 5,
    select: { id: true, orderNumber: true, branchId: true }
  })
  console.log('Sample orders:', JSON.stringify(orders, null, 2))

  console.log('=== TESTING EQUALITY QUERY ===')
  const test1 = await prisma.order.count({ where: { branchId: 'khanderao' } })
  console.log('Count where branchId == "khanderao":', test1)

  const test2 = await prisma.order.count({ where: { branchId: 'b-001' } })
  console.log('Count where branchId == "b-001":', test2)

  const test3 = await prisma.order.count({ where: { branchId: 'Khanderao Branch' } })
  console.log('Count where branchId == "Khanderao Branch":', test3)

  const test4 = await prisma.order.count({ where: { branchId: 'Khanderao Market' } })
  console.log('Count where branchId == "Khanderao Market":', test4)
}

inspectDb().catch(console.error).finally(() => prisma.$disconnect())
