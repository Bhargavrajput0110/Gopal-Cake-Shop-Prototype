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

  const item = await prisma.orderItem.findUnique({
    where: { id: params.id },
    include: { order: true }
  });

  if (!item || (!isStaff && item.assignedVendorId !== user.id)) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }

  const body = await ctx.req.json();
  const { action } = body; // ACCEPTED, PREPARING, READY_FOR_PICKUP

  let newStatus: OrderItemStatus;
  let timelineAction = '';
  let timelineNote = '';

  if (action === 'ACCEPTED') {
    newStatus = 'CHEF_ACCEPTED';
    timelineAction = 'VENDOR_ACCEPTED';
    timelineNote = `Vendor accepted the task.`;
  } else if (action === 'MAKING') {
    newStatus = 'MAKING';
    timelineAction = 'VENDOR_PREPARING';
    timelineNote = `Vendor started preparing.`;
  } else if (action === 'READY_FOR_PICKUP') {
    newStatus = 'READY_FOR_PICKUP';
    timelineAction = 'VENDOR_READY';
    timelineNote = `Vendor marked item ready for pickup.`;
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.orderItem.update({
      where: { id: params.id },
      data: { status: newStatus }
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
});
