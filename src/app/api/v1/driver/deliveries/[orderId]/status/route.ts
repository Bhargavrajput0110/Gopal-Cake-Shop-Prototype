import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { withApiHandler } from '@/lib/withApiHandler'
import { TimelineService } from '@/services/TimelineService'

export const PATCH = withApiHandler(async (ctx) => {
  const { appRole, user, params } = ctx
  if (appRole !== 'DELIVERY' && appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action, failureReason, cashCollected, notes } = await ctx.req.json()
  const orderId = params.orderId

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  
  if (appRole === 'DELIVERY' && order.driverId !== user.id) {
    return NextResponse.json({ error: 'Order assigned to another driver' }, { status: 403 })
  }

  let newStatus = order.status
  let extraData: any = {}
  let newDriverId = order.driverId

  switch (action) {
    case 'ACCEPTED':
      newStatus = 'ASSIGNED_TO_DRIVER'
      if (!newDriverId) newDriverId = user.id
      break
    case 'START_TRIP':
      newStatus = 'ON_THE_WAY'
      break
    case 'PICKED_UP':
      newStatus = 'OUT_FOR_DELIVERY'
      break
    case 'DELIVERED':
      newStatus = 'DELIVERED'
      if (cashCollected !== undefined) extraData.cashCollectedAmount = cashCollected
      break
    case 'FAILED_DELIVERY':
      newStatus = 'FAILED_DELIVERY'
      if (!failureReason) return NextResponse.json({ error: 'failureReason required for FAILED status' }, { status: 400 })
      extraData.deliveryFailureReason = failureReason
      break
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Idempotency check: if status hasn't changed and no other state changes, return success early
  if (order.status === newStatus && order.driverId === newDriverId) {
    return NextResponse.json({ success: true, status: newStatus, message: 'Already in this state' })
  }

  const updatedOrder = await db.$transaction(async (tx) => {
    const u = await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus as any,
        driverId: newDriverId,
        ...extraData
      }
    })

    await TimelineService.create({
      orderId,
      actorId: user.id,
      action: action === 'FAILED_DELIVERY' ? 'MARK_FAILED' : 'DRIVER_UPDATE',
      eventType: action === 'FAILED_DELIVERY' ? 'FAILED_DELIVERY' : 'STATE_TRANSITION',
      status: newStatus as any,
      nextState: newStatus as any,
      note: [notes, cashCollected ? `Collected: ₹${cashCollected}` : ''].filter(Boolean).join(' | '),
      reasonCode: failureReason || null
    }, tx as any)

    return u
  })

  return NextResponse.json({ success: true, status: newStatus })
})
