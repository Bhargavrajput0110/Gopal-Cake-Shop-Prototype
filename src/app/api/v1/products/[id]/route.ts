import { NextResponse } from 'next/server'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { CatalogService } from '@/services/CatalogService'
import { z } from 'zod'

const UpdateProductSchema = z.object({
  name: z.string().optional(),
  sku: z.string().optional().nullable(),
  description: z.string().optional(),
  basePrice: z.number().optional(),
  categoryId: z.string().optional(),
  availableForSale: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isCustomizable: z.boolean().optional(),
  requiredVendors: z.array(z.string()).optional(),
  weightVariants: z.any().optional(),
  thumbnail: z.string().nullable().optional(),
  currentUpdatedAt: z.string().optional()
})

export const PUT = withApiHandler(async (ctx: HandlerContext) => {
  if (ctx.appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = ctx.params
  const body = await ctx.req.json()
  const data = UpdateProductSchema.parse(body)

  try {
    const product = await CatalogService.updateProduct(id, data as any)
    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    if (error.code === 'CONCURRENCY_CONFLICT') {
      return NextResponse.json({ error: error.message, code: 'CONCURRENCY_CONFLICT' }, { status: 409 })
    }
    if (error.code === 'DUPLICATE_SKU') {
      return NextResponse.json({ error: error.message, code: 'DUPLICATE_SKU' }, { status: 409 })
    }
    throw error;
  }
})

export const POST = withApiHandler(async (ctx: HandlerContext) => {
  if (ctx.appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = ctx.params
  const body = await ctx.req.json()

  if (body.action === 'clone') {
    const cloned = await CatalogService.cloneProduct(id)
    return NextResponse.json({ success: true, data: cloned })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
})

export const DELETE = withApiHandler(async (ctx: HandlerContext) => {
  if (ctx.appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = ctx.params

  await CatalogService.updateProduct(id, { isArchived: true })
  // We do soft delete (archive) for products, or hard delete? The user says "Archive Product, Restore Product" in the requirements.
  // Actually, we should just delete or archive. Let's do a hard delete for DELETE, and PUT for archive.
  // Wait, if it has order items, hard delete fails. So soft delete is safer.
  return NextResponse.json({ success: true })
})
