import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function checkBranchIds() {
  console.log('=== CHECKING DISTINCT BRANCH IDS ON ORDER TABLE ===')
  const orders = await prisma.order.findMany({
    select: { id: true, orderNumber: true, branchId: true, status: true },
    take: 20
  })

  console.log('Sample 20 orders branchIds:')
  orders.forEach(o => console.log(`Order ${o.orderNumber || o.id} -> branchId: "${o.branchId}"`))

  const countKhanderao = await prisma.order.count({ where: { branchId: 'khanderao' } })
  const countNull = await prisma.order.count({ where: { branchId: null as any } })
  console.log(`\nCount for branchId === "khanderao":`, countKhanderao)
  console.log(`Count for branchId === null:`, countNull)
}

checkBranchIds().catch(console.error).finally(() => prisma.$disconnect())
