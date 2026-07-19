import { prisma } from './src/lib/prisma'
import { prismaTest } from './tests/setup/prisma-test'

async function main() {
  console.log("1. Counting branches...")
  const count1 = await prisma.branch.count()
  console.log("Count1:", count1)
  
  if (count1 === 0) {
    console.log("2. Inserting 8 branches...")
    await prisma.branch.createMany({
      data: Array.from({length: 8}).map((_, i) => ({
        id: `B-${i}`,
        name: `Branch ${i}`,
        isActive: true,
        code: `B${i}`,
        address: '...'
      }))
    })
    console.log("Inserted.")
  }

  const count2 = await prisma.branch.count()
  console.log("Count2:", count2)
  
  console.log("3. Truncating...")
  await prismaTest.$executeRawUnsafe(`TRUNCATE TABLE "postgres_test"."Branch" CASCADE;`)
  console.log("Truncated.")
  
  const count3 = await prisma.branch.count()
  console.log("Count3:", count3)
  
  const count4 = await prismaTest.branch.count()
  console.log("Count4 (prismaTest):", count4)

  process.exit(0)
}

main().catch(console.error)
