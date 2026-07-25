import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function inspectUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, branchId: true, status: true }
  })
  console.log('All Users in DB:', JSON.stringify(users, null, 2))
}

inspectUsers().catch(console.error).finally(() => prisma.$disconnect())
