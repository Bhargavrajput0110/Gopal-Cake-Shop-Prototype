import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { InventoryService } from '@/services/InventoryService'
import { PERMISSIONS } from '@/lib/rbac/permissions'
import { z } from 'zod'

const UpdateAvailabilitySchema = z.object({
  isAvailable: z.boolean()
})

// Single Product Availability Override
export const PATCH = withApiHandler(async (ctx) => {
  const { id } = ctx.params
  const body = await ctx.req.json()
  const { isAvailable } = UpdateAvailabilitySchema.parse(body)

  // In V1, products are global to the catalog, but if branch-specific inventory existed,
  // we would pass ctx.branchId into the service. 
  const product = await InventoryService.setAvailability(id, isAvailable, ctx.user.id)
  
  return NextResponse.json({
    success: true,
    message: `Updated availability for ${product.name}`,
    data: product
  })
}, false, PERMISSIONS.MANAGE_INVENTORY)
