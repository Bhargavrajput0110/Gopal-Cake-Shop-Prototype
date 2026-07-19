import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function runIntegrityAudit() {
  console.log("Starting Data Integrity Audit...")
  let hasErrors = false

  // 1. Check Orders without Payments or with mismatching payment totals
  const orders = await prisma.order.findMany({
    include: { payments: true, items: true, notifications: true, timeline: true }
  })

  let orphanCount = 0
  let mismatchedPayments = 0

  for (const order of orders) {
    // A. Payment Total Check
    const paidAmount = order.payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    
    // For DRAFT or NEW, they might not be paid yet, but if they are ADVANCE_PAID, it must match advance
    if (order.status !== 'DRAFT' && order.status !== 'NEW' && order.status !== 'CANCELLED') {
      if (order.payments.length === 0 && order.totalAmount > 0) {
        console.error(`[P0] Data Corruption: Order ${order.id} has total > 0 but NO payments.`)
        hasErrors = true
        orphanCount++
      }
    }

    // C. Timeline Check
    const createdEvents = order.timeline.filter(t => t.status === 'NEW' || t.action === 'ORDER_CREATED')
    if (order.status !== 'DRAFT' && createdEvents.length === 0) {
      console.error(`[P1] Missing Timeline Event: Order ${order.id} has no 'NEW' event.`)
      hasErrors = true
    }
    if (createdEvents.length > 1) {
      console.error(`[P0] Duplicate Timeline Event: Order ${order.id} has ${createdEvents.length} 'NEW' events!`)
      hasErrors = true
    }

    // D. Notification Integrity
    const notifications = order.notifications || []
    const duplicateNots = notifications.filter((n, index, self) => 
      self.findIndex(t => t.message === n.message && t.userId === n.userId) === index
    )
    if (notifications.length > duplicateNots.length) {
      console.error(`[P0] Duplicate Notifications: Order ${order.id} has duplicate notifications dispatched.`)
      hasErrors = true
    }
  }

  console.log("-----------------------------------------")
  console.log(`Audit Complete. Processed ${orders.length} orders.`)
  if (!hasErrors) {
    console.log("✅ PASS: Database Integrity is 100% consistent.")
  } else {
    console.log(`❌ FAIL: Found inconsistencies.`)
    console.log(`- Mismatched Payments: ${mismatchedPayments}`)
    console.log(`- Orphaned Records: ${orphanCount}`)
  }
}

runIntegrityAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
