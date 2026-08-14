import { NextResponse } from 'next/server'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { DesignService } from '@/services/DesignService'
import { z } from 'zod'

const DesignSchema = z.object({
  code: z.string().nullish(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  imageUrl: z.string().nullish(),
  categoryIds: z.array(z.string()).nullish(),
  occasions: z.array(z.string()).nullish(),
  themes: z.array(z.string()).nullish(),
  characters: z.array(z.string()).nullish(),
  colours: z.array(z.string()).nullish(),
  shapes: z.array(z.string()).nullish(),
  styles: z.array(z.string()).nullish(),
  recommendedWeight: z.any().nullish(),
  recommendedTier: z.any().nullish(),
  difficulty: z.any().nullish(),
  age: z.any().nullish(),
  isEggless: z.boolean().nullish(),
  tags: z.array(z.string()).nullish(),
  labels: z.array(z.string()).nullish(),
  status: z.string().nullish(),
  imageHash: z.string().nullish(),
  weightConfig: z.any().nullish()
}).passthrough()

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
}, true)

export const POST = withApiHandler(async (ctx: HandlerContext) => {
  const { appRole, req } = ctx
  if (appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await req.json()
  const data = DesignSchema.parse(body)

  const createPayload: any = {
    code: data.code || undefined,
    name: data.name || "Untitled Cake Design",
    description: data.description || "",
    imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80",
    occasions: data.occasions || [],
    themes: data.themes || [],
    characters: data.characters || [],
    colours: data.colours || [],
    shapes: data.shapes || [],
    styles: data.styles || [],
    recommendedWeight: typeof data.recommendedWeight === 'string' ? data.recommendedWeight : undefined,
    recommendedTier: typeof data.recommendedTier === 'number' ? data.recommendedTier : (Number(data.recommendedTier) || undefined),
    difficulty: typeof data.difficulty === 'string' ? data.difficulty : undefined,
    age: typeof data.age === 'string' ? data.age : undefined,
    isEggless: Boolean(data.isEggless),
    tags: data.tags || [],
    labels: data.labels || [],
    status: data.status || 'ACTIVE',
    imageHash: data.imageHash || undefined
  }

  if (data.categoryIds && data.categoryIds.length > 0) {
    createPayload.categories = {
      create: data.categoryIds.map(id => ({ categoryId: id }))
    }
  }

  const design = await DesignService.createDesign(createPayload)
  return NextResponse.json({ success: true, data: design })
})
