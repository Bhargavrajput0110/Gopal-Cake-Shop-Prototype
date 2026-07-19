import { NextResponse } from 'next/server'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { CatalogService } from '@/services/CatalogService'
import { z } from 'zod'

const ProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  categoryId: z.string().optional(),
  availableForSale: z.boolean().default(true),
  isCustomizable: z.boolean().optional(),
  requiredVendors: z.array(z.string()).optional(),
  weightVariants: z.any().optional(), // Can be more strict array schema
  thumbnail: z.string().nullable().optional()
})

export const GET = withApiHandler(async (ctx: HandlerContext) => {
  const { req } = ctx
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || undefined
  const categoryId = searchParams.get('categoryId') || undefined
  const isArchived = searchParams.get('isArchived') === 'true'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  const products = await CatalogService.listProducts({
    search,
    categoryId,
    isArchived,
    page,
    limit
  })
  
  return NextResponse.json({ success: true, data: products })
})

export const POST = withApiHandler(async (ctx: HandlerContext) => {
  const { appRole, req } = ctx
  if (appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await req.json()
  const data = ProductSchema.parse(body)

  try {
    const createPayload: any = {
      ...data
    };
    if (data.isCustomizable !== undefined) {
      createPayload.isCustomizable = data.isCustomizable;
    }
    const product = await CatalogService.createProduct(createPayload)
    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    if (error.code === 'DUPLICATE_SKU') {
      return NextResponse.json({ error: error.message, code: 'DUPLICATE_SKU' }, { status: 409 })
    }
    throw error;
  }
})

// For Bulk Update Prices
export const PATCH = withApiHandler(async (ctx: HandlerContext) => {
  const { appRole, req } = ctx
  if (appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (body.action === 'bulk-price-update') {
    const updates = z.array(z.object({ id: z.string(), newPrice: z.number() })).parse(body.updates)
    await CatalogService.bulkUpdatePrices(updates)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
})
