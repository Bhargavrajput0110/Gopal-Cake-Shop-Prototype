import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { toBranchId } from '../src/lib/branches'

async function testListOrdersQuery() {
  const branchId = 'khanderao'
  const role = 'MANAGER'
  const canonicalBranchId = branchId ? toBranchId(branchId) : null;
  const db = prisma

  const whereClause: any = {}
  if (role && role.toUpperCase() !== 'ADMIN' && canonicalBranchId) {
    whereClause.branchId = canonicalBranchId
  }

  console.log('Testing listOrders query with whereClause:', whereClause)

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: whereClause,
      skip: 0,
      take: 20,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        customer: true,
        items: true,
      }
    }),
    db.order.count({ where: whereClause }),
  ])

  console.log('Result total:', total)
  console.log('Result orders length:', orders.length)
  if (orders.length > 0) {
    console.log('First order ID:', orders[0].id)
    console.log('First order branchId:', orders[0].branchId)
  }
}

testListOrdersQuery().catch(console.error).finally(() => prisma.$disconnect())
