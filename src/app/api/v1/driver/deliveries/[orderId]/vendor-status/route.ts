import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { withApiHandler } from '@/lib/withApiHandler'
import { TimelineService } from '@/services/TimelineService'

export const PATCH = withApiHandler(async (ctx) => {
  const { appRole, user, params } = ctx
  if (appRole !== 'DELIVERY' && appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action, notes } = await ctx.req.json()
  const itemId = params.orderId

  const item = await db.orderItem.findUnique({ where: { id: itemId }, include: { order: true } })
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  if (appRole === 'DELIVERY' && item.order.driverId && item.order.driverId !== user.id) {
    return NextResponse.json({ error: 'Order assigned to another driver' }, { status: 403 })
  }

  let newStatus = item.status

  switch (action) {
    case 'ACCEPTED':
    case 'START_TRIP':
      // Just keep as READY_FOR_PICKUP, timeline will reflect driver states
      newStatus = 'READY_FOR_PICKUP'
      break
    case 'PICKED_UP':
      newStatus = 'READY_FOR_PICKUP' // Still ready for pickup/delivery
      break
    case 'DELIVERED':
      // Delivered to branch! 
      newStatus = 'DELIVERED'
      break
    case 'FAILED_DELIVERY':
      // Failed to pick up or deliver
      // newStatus = 'CANCELLED'? No, let's just log it in timeline.
      break
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Idempotency check: We check if the action was already recorded as the latest timeline event for this item
  const latestTimeline = await db.timeline.findFirst({
    where: { orderItemId: item.id },
    orderBy: { createdAt: 'desc' }
  })
  
  const actionToEvent = {
    'ACCEPTED': 'DRIVER_ACCEPTED_VENDOR_ITEM',
    'START_TRIP': 'DRIVER_STARTED_TRIP_VENDOR_ITEM',
    'PICKED_UP': 'DRIVER_PICKED_UP_VENDOR_ITEM',
    'DELIVERED': 'DRIVER_DELIVERED_VENDOR_ITEM',
    'FAILED_DELIVERY': 'MARK_FAILED'
  }
  
  const mappedAction = actionToEvent[action as keyof typeof actionToEvent]
  if (latestTimeline && latestTimeline.action === mappedAction) {
    return NextResponse.json({ success: true, data: item, message: 'Already in this state' })
  }

  const updatedItem = await db.$transaction(async (tx) => {
    let u = item;
    if (newStatus !== item.status) {
      u = await tx.orderItem.update({
        where: { id: itemId },
        data: { status: newStatus as any },
        include: { order: true }
      });
    }

    await TimelineService.create({
      orderId: item.orderId,
      orderItemId: item.id,
      actorId: user.id,
      action: mappedAction,
      eventType: action === 'FAILED_DELIVERY' ? 'FAILED_DELIVERY' : 'STATE_TRANSITION',
      status: item.order.status as any,
      nextState: item.order.status as any,
      note: action === 'ACCEPTED' ? `Driver accepted vendor pickup.` :
            action === 'START_TRIP' ? `Driver started trip to vendor.` :
            action === 'PICKED_UP' ? `Driver picked up ${item.productName} from vendor.` :
            action === 'DELIVERED' ? `Driver delivered ${item.productName} to branch.` :
            `Driver failed to handle ${item.productName}.`,
      reasonCode: null
    }, tx as any);

    return u;
  });

  return NextResponse.json({ success: true, data: updatedItem })
})
