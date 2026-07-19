import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { withApiHandler } from '@/lib/withApiHandler'
import { TimelineService } from '@/services/TimelineService'

export const POST = withApiHandler(async (ctx) => {
  const { appRole, user } = ctx
  if (appRole !== 'ADMIN' && appRole !== 'MANAGER' && appRole !== 'SALESPERSON') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { orderId, driverId } = await ctx.req.json()
  if (!orderId || !driverId) {
    return NextResponse.json({ error: 'orderId and driverId required' }, { status: 400 })
  }

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const updatedOrder = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { driverId, status: 'ASSIGNED_TO_DRIVER' }
    })

    await TimelineService.create({
      orderId,
      actorId: user.id,
      action: 'ADMIN_OVERRIDE',
      eventType: 'STATE_TRANSITION',
      status: order.status,
      nextState: 'ASSIGNED_TO_DRIVER',
      note: `Assigned Driver: ${driverId}`
    }, tx as any)

    return updated
  })

  return NextResponse.json({ success: true, order: updatedOrder })
})
