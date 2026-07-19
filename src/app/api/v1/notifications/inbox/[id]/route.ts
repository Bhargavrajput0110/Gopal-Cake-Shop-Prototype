import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateNotificationSchema = z.object({
  action: z.enum(['read', 'dismiss'])
})

export const PATCH = withApiHandler(async (ctx) => {
  const { id } = ctx.params
  const body = await ctx.req.json()
  const { action } = UpdateNotificationSchema.parse(body)

  // Verify ownership
  const existing = await prisma.inAppNotification.findUnique({ where: { id } })
  if (!existing || existing.userId !== ctx.user.id) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
  }

  const updateData: any = {}
  if (action === 'read') updateData.isRead = true
  if (action === 'dismiss') updateData.isDismissed = true

  const updated = await prisma.inAppNotification.update({
    where: { id },
    data: updateData
  })

  return NextResponse.json({
    success: true,
    data: updated
  })
})
