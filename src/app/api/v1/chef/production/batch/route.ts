import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { OrderTransitionService } from '@/services/OrderTransitionService'
import { OrderStatus } from '@prisma/client'

const handler = async (ctx: HandlerContext) => {
  const { user, appRole, branchId } = ctx

  if (!user || !['CHEF', 'ADMIN', 'MANAGER'].includes(appRole as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await ctx.req.json()
  const { itemIds, action, chefId, pauseReason } = body

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return NextResponse.json({ error: 'No items selected' }, { status: 400 })
  }

  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const itemId of itemIds) {
    try {
      const item = await prisma.orderItem.findUnique({ where: { id: itemId } })
      if (!item) throw new Error('Item not found')

      if (action === 'ASSIGN_CHEF') {
        await prisma.orderItem.update({
          where: { id: itemId },
          data: { assignedChefId: chefId || user.id, status: 'CHEF_ACCEPTED' }
        })
        await prisma.timeline.create({
          data: {
            orderId: item.orderId,
            orderItemId: itemId,
            action: 'CHEF_ASSIGNED',
            status: item.status as unknown as OrderStatus,
            nextState: item.status as unknown as OrderStatus,
            actorId: user.id
          }
        })
      } else if (action === 'PAUSE_PRODUCTION') {
        await prisma.orderItem.update({
          where: { id: itemId },
          data: { pauseReason: pauseReason || 'Batch Paused', pausedAt: new Date() }
        })
      } else if (action === 'RESUME_PRODUCTION') {
        await prisma.orderItem.update({
          where: { id: itemId },
          data: { pauseReason: null, pausedAt: null }
        })
      } else if (action === 'QC_PASSED') {
        await prisma.orderItem.update({
          where: { id: itemId },
          data: { status: 'QC_PASSED', qcAt: new Date() }
        })
      } else if (action === 'PACKED') {
        await prisma.orderItem.update({
          where: { id: itemId },
          data: { status: 'PACKED', packedAt: new Date() }
        })
      } else {
        throw new Error('Unsupported batch action')
      }
      results.success++
    } catch (e: any) {
      results.failed++
      results.errors.push(`Item ${itemId}: ${e.message}`)
    }
  }

  return NextResponse.json(results)
}

export const POST = withApiHandler(handler, true)
