import { NextResponse } from 'next/server'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { DesignService } from '@/services/DesignService'
import { z } from 'zod'

const DesignSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  categoryIds: z.array(z.string()).optional(),
  occasions: z.array(z.string()).optional(),
  themes: z.array(z.string()).optional(),
  characters: z.array(z.string()).optional(),
  colours: z.array(z.string()).optional(),
  shapes: z.array(z.string()).optional(),
  styles: z.array(z.string()).optional(),
  recommendedWeight: z.string().optional(),
  recommendedTier: z.number().optional(),
  difficulty: z.string().optional(),
  age: z.string().optional(),
  isEggless: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
  status: z.string().optional(),
  imageHash: z.string().optional()
})

export const GET = withApiHandler(async (ctx: HandlerContext) => {
  const { req } = ctx
  const { searchParams } = new URL(req.url)
  
  const search = searchParams.get('search') || undefined
  const categoryId = searchParams.get('categoryId') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  // Array parameters usually come as comma-separated or multiple keys
  const getArrayParam = (key: string) => {
    const val = searchParams.get(key)
    return val ? val.split(',').map(s => s.trim()) : undefined
  }

  const designs = await DesignService.listDesigns({
    search,
    categoryId,
    page,
    limit,
    status: getArrayParam('status') || ['ACTIVE'],
    labels: getArrayParam('labels'),
    occasions: getArrayParam('occasions'),
    themes: getArrayParam('themes'),
    characters: getArrayParam('characters'),
    colours: getArrayParam('colours'),
    shapes: getArrayParam('shapes'),
    styles: getArrayParam('styles')
  })
  
  return NextResponse.json({ success: true, data: designs })
})

export const POST = withApiHandler(async (ctx: HandlerContext) => {
  const { appRole, req } = ctx
  if (appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await req.json()
  const data = DesignSchema.parse(body)

  const createPayload: any = {
    code: data.code,
    name: data.name,
    description: data.description,
    imageUrl: data.imageUrl,
    occasions: data.occasions || [],
    themes: data.themes || [],
    characters: data.characters || [],
    colours: data.colours || [],
    shapes: data.shapes || [],
    styles: data.styles || [],
    recommendedWeight: data.recommendedWeight,
    recommendedTier: data.recommendedTier,
    difficulty: data.difficulty,
    age: data.age,
    isEggless: data.isEggless,
    tags: data.tags || [],
    labels: data.labels || [],
    status: data.status || 'ACTIVE',
    imageHash: data.imageHash
  }

  if (data.categoryIds && data.categoryIds.length > 0) {
    createPayload.categories = {
      create: data.categoryIds.map(id => ({ categoryId: id }))
    }
  }

  const design = await DesignService.createDesign(createPayload)
  return NextResponse.json({ success: true, data: design })
})
