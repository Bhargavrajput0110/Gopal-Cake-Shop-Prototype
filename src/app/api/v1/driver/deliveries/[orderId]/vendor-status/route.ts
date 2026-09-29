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

  const item = await db.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { include: { branch: true, items: true } } }
  })
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  if (appRole === 'DELIVERY' && item.order.driverId && item.order.driverId !== user.id) {
    return NextResponse.json({ error: 'Order assigned to another driver' }, { status: 403 })
  }

  let newStatus = item.status

  switch (action) {
    case 'ACCEPTED':
    case 'START_TRIP':
      newStatus = 'READY_FOR_PICKUP'
      break
    case 'PICKED_UP':
      newStatus = 'READY_FOR_PICKUP'
      break
    case 'DELIVERED':
      newStatus = 'DELIVERED'
      break
    case 'FAILED_DELIVERY':
      break
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Idempotency check
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
        include: { order: { include: { branch: true, items: true } } }
      }) as any;
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

  // When driver delivers vendor items to branch, notify the chef that they can now assemble
  if (action === 'DELIVERED') {
    try {
      const order = item.order;
      const branchName = order.branch?.name || 'the branch';

      // Check if ALL vendor child items for this order are now DELIVERED
      const allChildItems = (order.items || []).filter((i: any) => i.parentItemId !== null && i.assignedVendorId !== null);
      const allDelivered = allChildItems.length > 0 && allChildItems.every((i: any) => 
        i.id === itemId ? true : i.status === 'DELIVERED'
      );

      // Notify the assigned chef (or all chefs at that branch)
      const chefs = await db.user.findMany({
        where: {
          OR: [
            { id: (order as any).assignedChefId ?? 'none' },
            { role: 'CHEF', branchId: order.branchId, status: 'ACTIVE' }
          ]
        }
      });

      const itemName = item.productName || 'Vendor Component';
      const notifTitle = allDelivered
        ? `✅ All vendor items delivered to ${branchName} — Ready to assemble!`
        : `📦 ${itemName} delivered to ${branchName}`;
      const notifMsg = allDelivered
        ? `All acrylic/floral components have arrived. Order #${order.orderNumber} is ready for final assembly.`
        : `${user.name || 'The driver'} has delivered "${itemName}" for Order #${order.orderNumber}. Please check the counter.`;

      for (const chef of chefs) {
        await db.inAppNotification.create({
          data: {
            eventId: `vendor-delivered-${itemId}-${chef.id}`,
            userId: chef.id,
            title: notifTitle,
            message: notifMsg,
            priority: allDelivered ? 'HIGH' : 'NORMAL',
            linkUrl: `/sales/orders/${order.id}`,
          }
        }).catch(() => {/* ignore duplicate */});
      }

      // Also SSE push
      const { globalEventEmitter } = await import('@/lib/EventEmitter');
      chefs.forEach(chef => globalEventEmitter.emit('notification', { userId: chef.id }));

      // Push notification to chef's phone
      if (chefs.length > 0) {
        try {
          const { PushNotificationService } = await import('@/services/notifications/PushNotificationService');
          await PushNotificationService.sendToUsers(
            chefs.map(c => c.id),
            {
              title: notifTitle,
              body: notifMsg,
              url: `/sales/orders/${order.id}`,
              tag: `vendor-delivered-${itemId}`,
            }
          );
        } catch (pushErr) {
          console.warn('[vendor-status] Push to chef failed (non-fatal):', pushErr);
        }
      }
    } catch (notifErr) {
      console.warn('[vendor-status] Chef notification failed (non-fatal):', notifErr);
    }
  }

  return NextResponse.json({ success: true, data: updatedItem })
})
