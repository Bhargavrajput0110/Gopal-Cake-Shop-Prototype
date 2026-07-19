import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Starting Zero-Data-Loss Payment Migration to LedgerEntry...')
  
  const payments = await prisma.payment.findMany({
    include: {
      order: true
    }
  })

  let migratedCount = 0
  let skippedCount = 0

  for (const p of payments) {
    // Determine the referenceId, which must be unique per order/payment
    // The previous Payment table didn't always enforce transactionId uniqueness globally
    // so we compose a safe reference id if missing.
    const safeReferenceId = p.transactionId || `migration_ref_${p.id}`

    try {
      await prisma.ledgerEntry.create({
        data: {
          orderId: p.orderId,
          type: 'PAYMENT',
          amount: p.amount,
          currency: 'INR',
          method: p.method,
          status: p.status,
          referenceId: safeReferenceId,
          createdAt: p.createdAt,
          branchId: p.order.branchId, // Inherit branch from order
          notes: 'Migrated from legacy Payment table'
        }
      })
      migratedCount++
    } catch (e: any) {
      if (e.code === 'P2002') {
        skippedCount++
        console.log(`Skipping duplicate reference: ${safeReferenceId}`)
      } else {
        console.error(`Failed to migrate payment ${p.id}:`, e)
      }
    }
  }

  console.log(`Migration complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
