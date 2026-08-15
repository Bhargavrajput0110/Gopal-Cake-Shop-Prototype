import { NextResponse } from 'next/server'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { DesignService } from '@/services/DesignService'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const UpdateDesignSchema = z.object({
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
  currentUpdatedAt: z.any().nullish(),
  weightConfig: z.any().nullish(),
  basePrice: z.any().nullish(),
  isPhotoCake: z.boolean().nullish()
}).passthrough()

export const PUT = withApiHandler(async (ctx: HandlerContext) => {
  if (ctx.appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = ctx.params
  const body = await ctx.req.json()
  const data = UpdateDesignSchema.parse(body)

  const updatePayload: any = {
    code: data.code || undefined,
    name: data.name || undefined,
    description: data.description ?? undefined,
    imageUrl: data.imageUrl || undefined,
    occasions: data.occasions ?? undefined,
    themes: data.themes ?? undefined,
    characters: data.characters ?? undefined,
    colours: data.colours ?? undefined,
    shapes: data.shapes ?? undefined,
    styles: data.styles ?? undefined,
    recommendedWeight: typeof data.recommendedWeight === 'string' ? data.recommendedWeight : undefined,
    recommendedTier: typeof data.recommendedTier === 'number' ? data.recommendedTier : (Number(data.recommendedTier) || undefined),
    difficulty: typeof data.difficulty === 'string' ? data.difficulty : undefined,
    age: typeof data.age === 'string' ? data.age : undefined,
    isEggless: typeof data.isEggless === 'boolean' ? data.isEggless : undefined,
    tags: data.tags ?? undefined,
    labels: data.labels ?? undefined,
    status: data.status ?? undefined,
    basePrice: data.basePrice !== undefined ? Number(data.basePrice) : undefined,
    weightConfig: data.weightConfig || undefined,
    isPhotoCake: typeof data.isPhotoCake === 'boolean' ? data.isPhotoCake : undefined
  }

  // Remove undefined fields
  Object.keys(updatePayload).forEach(key => {
    if (updatePayload[key] === undefined) delete updatePayload[key]
  })

  // Handle category updates (reconnect)
  if (data.categoryIds) {
    // Delete existing links
    await prisma.designCategory.deleteMany({ where: { designId: id } })
    if (data.categoryIds.length > 0) {
      updatePayload.categories = {
        create: data.categoryIds.map((catId: string) => ({ categoryId: catId }))
      }
    }
  }

  try {
    const design = await DesignService.updateDesign(id, updatePayload, data.currentUpdatedAt)
    return NextResponse.json({ success: true, data: design })
  } catch (error: any) {
    if (error.message === 'CONCURRENCY_CONFLICT') {
      return NextResponse.json({ error: 'The design was modified by another user. Please refresh and try again.' }, { status: 409 })
    }
    throw error
  }
})

export const DELETE = withApiHandler(async (ctx: HandlerContext) => {
  if (ctx.appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = ctx.params

  await DesignService.archiveDesign(id)
  return NextResponse.json({ success: true })
})
