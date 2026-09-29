import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { withApiHandler } from '@/lib/withApiHandler'

/**
 * One-time DB repair endpoint.
 * PATCH /api/v1/admin/fix-vendor-assignments
 * Fixes corrupted assignedVendorId on OrderItem child rows.
 */
export const PATCH = withApiHandler(async (ctx) => {
  const { appRole } = ctx
  if (appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
    results['FLORIST_fixed'] = r.count
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
    results['ACRYLIC_fixed'] = r.count
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
    results['PHOTO_fixed'] = r.count
  }

  // Clear vendor IDs from main cake items (they shouldn't have them)
  const r4 = await db.orderItem.updateMany({
    where: { parentItemId: null, assignedVendorId: { not: null } },
    data: { assignedVendorId: null }
  })
  results['main_items_cleared'] = r4.count

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
    results['duplicate_vendor_tasks_deleted'] = toDelete.length
  }

  return NextResponse.json({ success: true, fixed: results })
})
