import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  const branches = await prisma.branch.findMany()
  console.log('Current Branches in DB:', JSON.stringify(branches, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
