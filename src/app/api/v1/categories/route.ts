import { NextResponse } from 'next/server'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { CatalogService } from '@/services/CatalogService'
import { z } from 'zod'

const CategorySchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().default(0),
  status: z.string().default('active')
})

export const GET = withApiHandler(async () => {
  const categories = await CatalogService.listCategories()
  // Map to UI expectations
  const mapped = categories.map(c => ({
    ...c,
    categoryId: c.slug,
    status: c.isActive ? 'active' : 'archived'
  }))
  return NextResponse.json(mapped)
})

export const POST = withApiHandler(async (ctx: HandlerContext) => {
  const { appRole, req } = ctx
  if (appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await req.json()
  const data = CategorySchema.parse(body)

  const category = await CatalogService.createCategory({
    name: data.name,
    slug: data.slug || data.categoryId || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: data.description,
    displayOrder: data.displayOrder,
    isActive: data.status === 'active'
  })
  
  // Format to match UI expectations
  return NextResponse.json({ 
    success: true, 
    data: {
      ...category,
      categoryId: category.slug,
      status: category.isActive ? 'active' : 'archived'
    }
  })
})
