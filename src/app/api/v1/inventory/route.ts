import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { InventoryService } from '@/services/InventoryService'
import { PERMISSIONS } from '@/lib/rbac/permissions'
import { z } from 'zod'

const BulkUpdateSchema = z.object({
  productIds: z.array(z.string()),
  isAvailable: z.boolean()
})

// Bulk Availability Update
export const POST = withApiHandler(async (ctx) => {
  const body = await ctx.req.json()
  const { productIds, isAvailable } = BulkUpdateSchema.parse(body)

  const result = await InventoryService.bulkSetAvailability(productIds, isAvailable, ctx.user.id)
  
  return NextResponse.json({
    success: true,
    message: `Updated availability for ${result.count} products`,
    count: result.count
  })
}, false, PERMISSIONS.MANAGE_INVENTORY)
