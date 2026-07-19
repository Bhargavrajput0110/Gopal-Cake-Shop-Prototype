import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function wipeOrders() {
  console.log("Wiping all existing orders to prepare for clean RC1 QA baseline...")
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Payment", "Timeline", "OrderItem", "Order", "NotificationLog" CASCADE;`)

  console.log("Wipe complete.")
}

wipeOrders()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
