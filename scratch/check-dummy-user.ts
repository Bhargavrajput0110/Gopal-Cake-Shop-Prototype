import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function checkUser() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'manager', mode: 'insensitive' } }
  })
  console.log('Manager user in DB:', user)
}

checkUser().catch(console.error).finally(() => prisma.$disconnect())
