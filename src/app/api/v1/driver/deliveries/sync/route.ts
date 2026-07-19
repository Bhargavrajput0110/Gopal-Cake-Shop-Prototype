import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { withApiHandler } from '@/lib/withApiHandler'

export const POST = withApiHandler(async (ctx) => {
  const { appRole, user } = ctx
  if (appRole !== 'DELIVERY' && appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { actions } = await ctx.req.json()
  if (!Array.isArray(actions)) {
    return NextResponse.json({ error: 'actions must be an array' }, { status: 400 })
  }

  const results = []

  for (const actionData of actions) {
    const { orderId, action, failureReason, cashCollected, notes, timestamp } = actionData
    try {
      const order = await db.order.findUnique({ where: { id: orderId } })
      if (!order) throw new Error('Order not found')
      
      if (appRole === 'DELIVERY' && order.driverId !== user.id) {
        throw new Error('Assigned to another driver')
      }

      let newStatus = order.status
      let extraData: any = {}

      switch (action) {
        case 'PICKED_UP':
          newStatus = 'OUT_FOR_DELIVERY' as any
          break
        case 'DELIVERED':
          newStatus = 'DELIVERED' as any
          if (cashCollected !== undefined) extraData.cashCollectedAmount = cashCollected
          break
        case 'FAILED_DELIVERY':
          newStatus = 'CANCELLED' as any
          if (failureReason) extraData.deliveryFailureReason = failureReason
          break
        default:
          throw new Error('Invalid action')
      }

      await db.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...extraData
        }
      })

      await db.timeline.create({
        data: {
          orderId,
          actorId: user.id,
          action: action === 'FAILED_DELIVERY' ? 'MARK_FAILED' : 'DRIVER_UPDATE',
          eventType: action === 'FAILED_DELIVERY' ? 'FAILED_DELIVERY' : 'STATE_TRANSITION',
          status: newStatus as any,
          nextState: newStatus as any,
          note: [notes, cashCollected ? `Collected: ₹${cashCollected}` : '', `Synced: ${timestamp}`].filter(Boolean).join(' | '),
          reasonCode: failureReason || null
        }
      })

      results.push({ orderId, success: true })
    } catch (err: any) {
      results.push({ orderId, success: false, error: err.message })
    }
  }

  return NextResponse.json({ synced: results })
})
