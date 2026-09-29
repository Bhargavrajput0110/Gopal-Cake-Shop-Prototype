import { NextResponse } from 'next/server';
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { OrderItemStatus } from '@prisma/client';
import { TimelineService } from '@/services/TimelineService';

export const PATCH = withApiHandler(async (ctx: HandlerContext) => {
  const { appRole, user, params } = ctx;
  const isStaff = appRole ? ['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole) : false;
  if (!appRole || (!appRole.startsWith('VENDOR_') && !isStaff)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await ctx.req.json();
  const { action, mediaUrl } = body;

  let nextStatus = 'accepted';
  let orderItemStatus: OrderItemStatus = 'CHEF_ACCEPTED';
  let timelineAction = 'VENDOR_ACCEPTED';
  let timelineNote = 'Vendor accepted task.';

  if (action === 'ACCEPTED') {
    nextStatus = 'accepted';
    orderItemStatus = 'CHEF_ACCEPTED';
    timelineAction = 'VENDOR_ACCEPTED';
    timelineNote = 'Vendor accepted task.';
  } else if (action === 'MAKING') {
    nextStatus = 'in_production';
    orderItemStatus = 'MAKING';
    timelineAction = 'VENDOR_PREPARING';
    timelineNote = 'Vendor started production.';
  } else if (action === 'READY_FOR_PICKUP') {
    nextStatus = 'ready';
    orderItemStatus = 'READY_FOR_PICKUP';
    timelineAction = 'VENDOR_READY';
    timelineNote = mediaUrl 
      ? `Vendor marked item ready and uploaded deliverables. URL: ${mediaUrl}` 
      : `Vendor marked item ready for pickup.`;
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // 1. Try finding in OrderItem first
  const item = await prisma.orderItem.findUnique({
    where: { id: params.id },
    include: { order: { include: { branch: true } } }
  });

  if (item) {
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.orderItem.update({
        where: { id: params.id },
        data: { status: orderItemStatus }
      });

      await TimelineService.create({
        orderId: item.orderId,
        orderItemId: item.id,
        action: timelineAction,
        note: timelineNote,
        actorId: user.id,
        role: user.role,
        status: item.order.status,
        nextState: item.order.status
      }, tx as any);

      return u;
    });

    // When vendor marks READY_FOR_PICKUP, notify all delivery staff to come and pick up
    if (action === 'READY_FOR_PICKUP') {
      try {
        const deliveryUsers = await prisma.user.findMany({
          where: { role: 'DELIVERY', status: 'ACTIVE' }
        });
        if (deliveryUsers.length > 0) {
          const branchName = item.order.branch?.name || 'the branch';
          const productName = item.productName || 'vendor item';
          const { PushNotificationService } = await import('@/services/notifications/PushNotificationService');
          await PushNotificationService.sendToUsers(
            deliveryUsers.map(d => d.id),
            {
              title: `📦 Vendor Pickup Ready!`,
              body: `${user.name || 'A vendor'} has ${productName} ready for pickup → deliver to ${branchName}. Check Driver Dashboard.`,
              url: '/driver',
              tag: `vendor-pickup-${item.id}`,
            }
          );

          // Also create in-app notification for each driver
          for (const driver of deliveryUsers) {
            await prisma.inAppNotification.create({
              data: {
                eventId: `vendor-ready-${item.id}-${driver.id}`,
                userId: driver.id,
                title: `📦 Vendor Ready for Pickup`,
                message: `${user.name || 'Vendor'} has "${productName}" ready. Collect and deliver to ${branchName}.`,
                priority: 'HIGH',
                linkUrl: '/driver',
              }
            }).catch(() => {/* ignore duplicate */});
          }
        }
      } catch (notifErr) {
        console.warn('[vendor-task-ready] Push to drivers failed (non-fatal):', notifErr);
      }
    }

    return NextResponse.json({ success: true, data: updated });
  }

  // 2. If not found in OrderItem, try VendorTask table
  const vendorTask = await prisma.vendorTask.findUnique({
    where: { id: params.id },
    include: { order: { include: { branch: true } } }
  });

  if (vendorTask) {
    const updatedTask = await prisma.$transaction(async (tx) => {
      const vt = await tx.vendorTask.update({
        where: { id: params.id },
        data: {
          status: nextStatus,
          vendorId: vendorTask.vendorId || user.id
        }
      });

      await TimelineService.create({
        orderId: vendorTask.orderId,
        action: timelineAction,
        note: timelineNote,
        actorId: user.id,
        role: user.role,
        status: vendorTask.order.status,
        nextState: vendorTask.order.status
      }, tx as any);

      return vt;
    });

    // Same: notify drivers when VendorTask is marked ready
    if (action === 'READY_FOR_PICKUP') {
      try {
        const deliveryUsers = await prisma.user.findMany({
          where: { role: 'DELIVERY', status: 'ACTIVE' }
        });
        if (deliveryUsers.length > 0) {
          const branchName = vendorTask.order.branch?.name || 'the branch';
          const { PushNotificationService } = await import('@/services/notifications/PushNotificationService');
          await PushNotificationService.sendToUsers(
            deliveryUsers.map(d => d.id),
            {
              title: `📦 Vendor Pickup Ready!`,
              body: `${user.name || 'A vendor'} is ready. Collect from vendor → deliver to ${branchName}. Check Driver Dashboard.`,
              url: '/driver',
              tag: `vendor-pickup-vt-${vendorTask.id}`,
            }
          );
        }
      } catch (notifErr) {
        console.warn('[vendor-task-ready] Push to drivers failed (non-fatal):', notifErr);
      }
    }

    return NextResponse.json({ success: true, data: updatedTask });
  }

  return NextResponse.json({ error: 'Task not found' }, { status: 404 });
});
