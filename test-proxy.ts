import { prismaTest } from './tests/setup/prisma-test'
import { prisma } from './src/lib/prisma'

async function main() {
  console.log("Using prismaTest (tests/setup):")
  await prismaTest.branch.count()
  
  console.log("\nUsing prisma (src/lib):")
  await prisma.branch.count()
  
  process.exit(0)
}
main().catch(console.error)
