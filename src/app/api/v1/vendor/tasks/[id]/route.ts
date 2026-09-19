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
    include: { order: true }
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

    return NextResponse.json({ success: true, data: updated });
  }

  // 2. If not found in OrderItem, try VendorTask table
  const vendorTask = await prisma.vendorTask.findUnique({
    where: { id: params.id },
    include: { order: true }
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

    return NextResponse.json({ success: true, data: updatedTask });
  }

  return NextResponse.json({ error: 'Task not found' }, { status: 404 });
});
