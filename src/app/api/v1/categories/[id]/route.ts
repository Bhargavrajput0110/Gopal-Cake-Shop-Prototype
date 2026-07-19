import { NextResponse } from 'next/server'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { CatalogService } from '@/services/CatalogService'
import { z } from 'zod'

const UpdateCategorySchema = z.object({
  name: z.string().optional(),
  categoryId: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
  status: z.string().optional(),
  currentUpdatedAt: z.string().datetime().optional()
})

export const PUT = withApiHandler(async (ctx: HandlerContext) => {
  if (ctx.appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = ctx.params
  const body = await ctx.req.json()
  const data = UpdateCategorySchema.parse(body)

  const updatePayload: any = {
    name: data.name,
    description: data.description,
  }
  if (data.slug || data.categoryId) updatePayload.slug = data.slug || data.categoryId
  if (data.displayOrder !== undefined) updatePayload.displayOrder = data.displayOrder
  if (data.status !== undefined) updatePayload.isActive = data.status === 'active'
  if (data.currentUpdatedAt) updatePayload.currentUpdatedAt = new Date(data.currentUpdatedAt)

  try {
    const category = await CatalogService.updateCategory(id, updatePayload)
    return NextResponse.json({ 
      success: true, 
      data: {
        ...category,
        categoryId: category.slug,
        status: category.isActive ? 'active' : 'archived'
      }
    })
  } catch (error: any) {
    if (error.code === 'CONCURRENCY_CONFLICT') {
      return NextResponse.json({ error: 'This category was modified by another user. Please refresh and try again.', code: 'CONCURRENCY_CONFLICT' }, { status: 409 })
    }
    throw error
  }
})

export const DELETE = withApiHandler(async (ctx: HandlerContext) => {
  if (ctx.appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = ctx.params

  try {
    await CatalogService.deleteCategory(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'CATEGORY_HAS_PRODUCTS') {
      return NextResponse.json({ error: 'Cannot delete category because it contains active or archived products. Reassign or delete them first.', code: 'CATEGORY_HAS_PRODUCTS' }, { status: 409 })
    }
    throw error
  }
})
