import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function countOrdersByBranch() {
  console.log('=== COUNTING ORDERS GROUPED BY BRANCHID ===')
  const grouped = await prisma.order.groupBy({
    by: ['branchId'],
    _count: { id: true }
  })

  console.log('Grouped counts:', grouped)
}

countOrdersByBranch().catch(console.error).finally(() => prisma.$disconnect())
