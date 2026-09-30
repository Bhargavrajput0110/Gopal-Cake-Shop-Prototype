import { prisma as db } from '../src/lib/prisma';

async function main() {
  console.log('🔧 Fixing corrupted vendor assignments...\n')

  const results: Record<string, number> = {}

  const florist = await db.user.findFirst({ where: { role: 'VENDOR_FLORIST', status: { not: 'SUSPENDED' } } })
  const acrylic = await db.user.findFirst({ where: { role: 'VENDOR_ACRYLIC', status: { not: 'SUSPENDED' } } })
  const photo   = await db.user.findFirst({ where: { role: 'VENDOR_PHOTO',   status: { not: 'SUSPENDED' } } })

  if (florist) {
    const r = await db.orderItem.updateMany({
      where: {
        productName: 'FLORIST Component',
        parentItemId: { not: null },
        NOT: { assignedVendorId: florist.id }
      },
      data: { assignedVendorId: florist.id }
    })
    console.log(`✅ Fixed ${r.count} FLORIST Component rows → assigned to ${florist.name}`)
  }

  if (acrylic) {
    const r = await db.orderItem.updateMany({
      where: {
        productName: 'ACRYLIC Component',
        parentItemId: { not: null },
        NOT: { assignedVendorId: acrylic.id }
      },
      data: { assignedVendorId: acrylic.id }
    })
    console.log(`✅ Fixed ${r.count} ACRYLIC Component rows → assigned to ${acrylic.name}`)
  }

  if (photo) {
    const r = await db.orderItem.updateMany({
      where: {
        productName: 'PHOTO Component',
        parentItemId: { not: null },
        NOT: { assignedVendorId: photo.id }
      },
      data: { assignedVendorId: photo.id }
    })
    console.log(`✅ Fixed ${r.count} PHOTO Component rows → assigned to ${photo.name}`)
  }

  // Clear vendor IDs from main cake items (they shouldn't have them)
  const r4 = await db.orderItem.updateMany({
    where: { parentItemId: null, assignedVendorId: { not: null } },
    data: { assignedVendorId: null }
  })
  console.log(`✅ Cleared ${r4.count} main cake items that had wrong assignedVendorId`)

  // Remove duplicate VendorTask entries (keep only the most recent per orderId+vendorType)
  const allTasks = await db.vendorTask.findMany({ orderBy: { createdAt: 'desc' } })
  const seen = new Set<string>()
  const toDelete: string[] = []
  allTasks.forEach((t: any) => {
    const key = `${t.orderId}__${t.vendorType}`
    if (seen.has(key)) {
      toDelete.push(t.id)
    } else {
      seen.add(key)
    }
  })
  if (toDelete.length > 0) {
    await db.vendorTask.deleteMany({ where: { id: { in: toDelete } } })
    console.log(`✅ Deleted ${toDelete.length} duplicate VendorTasks`)
  }

  console.log('\n✅ Done! Vendor assignments are now clean.')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
