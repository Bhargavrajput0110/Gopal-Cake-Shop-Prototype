/**
 * One-time cleanup script:
 * Fixes corrupted assignedVendorId on OrderItem child rows caused by the 
 * old `updateMany({ where: { orderId } })` bug that assigned ALL items to 
 * every vendor, including wrong types.
 * 
 * Run: node -e "require('./scripts/fix-vendor-assignments.mjs')"
 * OR: npx tsx scripts/fix-vendor-assignments.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing corrupted vendor assignments...\n')

  // Find vendors by role
  const florist = await prisma.user.findFirst({ where: { role: 'VENDOR_FLORIST', status: { not: 'SUSPENDED' } } })
  const acrylic = await prisma.user.findFirst({ where: { role: 'VENDOR_ACRYLIC', status: { not: 'SUSPENDED' } } })
  const photo   = await prisma.user.findFirst({ where: { role: 'VENDOR_PHOTO',   status: { not: 'SUSPENDED' } } })

  console.log(`Found vendors: FLORIST=${florist?.name}, ACRYLIC=${acrylic?.name}, PHOTO=${photo?.name}`)

  // Rule: FLORIST Component items should ONLY have florist's ID
  if (florist) {
    const r1 = await prisma.orderItem.updateMany({
      where: {
        productName: 'FLORIST Component',
        parentItemId: { not: null },
        NOT: { assignedVendorId: florist.id }
      },
      data: { assignedVendorId: florist.id }
    })
    console.log(`✅ Fixed ${r1.count} FLORIST Component rows → assigned to ${florist.name}`)
  }

  // Rule: ACRYLIC Component items should ONLY have acrylic vendor's ID
  if (acrylic) {
    const r2 = await prisma.orderItem.updateMany({
      where: {
        productName: 'ACRYLIC Component',
        parentItemId: { not: null },
        NOT: { assignedVendorId: acrylic.id }
      },
      data: { assignedVendorId: acrylic.id }
    })
    console.log(`✅ Fixed ${r2.count} ACRYLIC Component rows → assigned to ${acrylic.name}`)
  }

  // Rule: PHOTO Component items should ONLY have photo vendor's ID
  if (photo) {
    const r3 = await prisma.orderItem.updateMany({
      where: {
        productName: 'PHOTO Component',
        parentItemId: { not: null },
        NOT: { assignedVendorId: photo.id }
      },
      data: { assignedVendorId: photo.id }
    })
    console.log(`✅ Fixed ${r3.count} PHOTO Component rows → assigned to ${photo.name}`)
  }

  // Also fix: main cake items (parentItemId IS null) should NOT have any assignedVendorId
  const r4 = await prisma.orderItem.updateMany({
    where: {
      parentItemId: null,
      assignedVendorId: { not: null }
    },
    data: { assignedVendorId: null }
  })
  console.log(`✅ Cleared ${r4.count} main cake items that had wrong assignedVendorId`)

  console.log('\n✅ Done! Vendor assignments are now clean.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
