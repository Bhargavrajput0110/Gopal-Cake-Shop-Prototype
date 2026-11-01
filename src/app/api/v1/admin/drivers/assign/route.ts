import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { withApiHandler } from '@/lib/withApiHandler'
import { TimelineService } from '@/services/TimelineService'
import { NotificationDispatcher } from '@/services/notifications/NotificationDispatcher'

export const POST = withApiHandler(async (ctx) => {
  const { appRole, user } = ctx
  if (appRole !== 'ADMIN' && appRole !== 'MANAGER' && appRole !== 'SALESPERSON') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { orderId, driverId } = await ctx.req.json()
  if (!orderId || !driverId) {
    return NextResponse.json({ error: 'orderId and driverId required' }, { status: 400 })
  }

  // Validate the assignee: must be a DELIVERY user OR the calling admin assigning themselves
  const assignee = await db.user.findUnique({
    where: { id: driverId },
    select: { id: true, role: true, name: true }
  })
  if (!assignee) return NextResponse.json({ error: 'Driver not found' }, { status: 404 })

  const isSelfAssign = appRole === 'ADMIN' && assignee.id === user?.id
  const isDeliveryRole = assignee.role === 'DELIVERY'

  // Sales/Manager cannot assign the admin — only ADMIN can self-assign
  if (!isDeliveryRole && !isSelfAssign) {
    return NextResponse.json({ error: 'You cannot assign this person as a driver' }, { status: 403 })
  }

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const updatedOrder = await db.$transaction(async (tx) => {
    const isPickup = order.deliveryType === 'PICKUP'
    const nextStatus = isPickup ? order.status : 'ASSIGNED_TO_DRIVER'

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        driverId,
        deliveryAssignedAt: new Date(),
        ...(isPickup ? {} : { status: nextStatus })
      }
    })

    // Create delivery assignment tracking record
    await tx.deliveryAssignment.create({
      data: {
        orderId,
        deliveryPersonId: driverId,
        assignedByUserId: user.id,
        status: 'ACTIVE'
      }
    })

    // Update active branch transfers for this order
    await tx.branchTransfer.updateMany({
      where: {
        orderId,
        status: { in: ['PENDING', 'ACCEPTED', 'IN_TRANSIT'] }
      },
      data: { transportedBy: driverId }
    })

    const assignerLabel = user?.name || (appRole === 'ADMIN' ? 'Admin' : 'Sales Staff')
    const assigneeLabel = assignee.name || driverId

    await TimelineService.create({
      orderId,
      actorId: user.id,
      action: 'ADMIN_OVERRIDE',
      eventType: 'STATE_TRANSITION',
      status: order.status,
      nextState: nextStatus,
      note: isSelfAssign
        ? `Delivery self-assigned by ${assignerLabel}`
        : `Delivery assigned to ${assigneeLabel} by ${assignerLabel}`
    }, tx as any)

    return updated
  })

  // Notify the assigned driver — skip if admin self-assigned (no point pinging yourself)
  if (!isSelfAssign) {
    try {
      const assignerName = user.name || 'Sales Staff'
      await NotificationDispatcher.dispatch({
        eventId: `driver-assign-${orderId}-${Date.now()}`,
        orderId,
        channel: 'IN_APP',
        recipientRole: 'DELIVERY',
        recipientId: driverId,
        templateName: 'New Delivery Task',
        message: `${assignerName} has assigned you a delivery task for order ${order.orderNumber || order.id}.`,
        branchId: order.branchId,
      })
    } catch (err) {
      console.error('Failed to send driver notification:', err)
    }
  }

  return NextResponse.json({ success: true, order: updatedOrder })
})
