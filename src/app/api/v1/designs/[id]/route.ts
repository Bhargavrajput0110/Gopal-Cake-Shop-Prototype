import { NextResponse } from 'next/server'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { DesignService } from '@/services/DesignService'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const UpdateDesignSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
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
  currentUpdatedAt: z.string().optional()
})

export const PUT = withApiHandler(async (ctx: HandlerContext) => {
  if (ctx.appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = ctx.params
  const body = await ctx.req.json()
  const data = UpdateDesignSchema.parse(body)

  const updatePayload: any = {
    code: data.code,
    name: data.name,
    description: data.description,
    imageUrl: data.imageUrl,
    occasions: data.occasions,
    themes: data.themes,
    characters: data.characters,
    colours: data.colours,
    shapes: data.shapes,
    styles: data.styles,
    recommendedWeight: data.recommendedWeight,
    recommendedTier: data.recommendedTier,
    difficulty: data.difficulty,
    age: data.age,
    isEggless: data.isEggless,
    tags: data.tags,
    labels: data.labels,
    status: data.status
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
