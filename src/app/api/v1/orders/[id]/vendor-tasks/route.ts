import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const VendorTaskSchema = z.object({
  vendorType: z.string(),
  instructions: z.string(),
  vendorId: z.string().optional(),
  status: z.string().default('PENDING'),
  designImageUrl: z.string().optional(),
  photoUrl: z.string().optional()
});

const VendorTaskUpdateSchema = z.object({
  taskId: z.string(),
  status: z.string().optional(),
  vendorId: z.string().optional(),
  note: z.string().optional()
});

export const GET = withApiHandler(async ({ req, params, appRole }) => {
  const { id: orderId } = params;

  if (!appRole || !['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tasks = await prisma.vendorTask.findMany({
    where: { orderId },
    include: { vendor: { select: { name: true } } }
  });

  return NextResponse.json({ success: true, data: tasks });
});

export const POST = withApiHandler(async ({ req, params, appRole }) => {
  const { id: orderId } = params;

  if (!appRole || !['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const body = await req.json();
  const payload = VendorTaskSchema.safeParse(body);
  if (!payload.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  // Map vendorType ('photo' | 'flower' | 'acrylic') to Prisma role ('VENDOR_PHOTO' | 'VENDOR_FLORIST' | 'VENDOR_ACRYLIC')
  let targetRole = 'VENDOR_FLORIST';
  if (payload.data.vendorType === 'photo' || payload.data.vendorType === 'VENDOR_PHOTO') targetRole = 'VENDOR_PHOTO';
  if (payload.data.vendorType === 'acrylic' || payload.data.vendorType === 'VENDOR_ACRYLIC') targetRole = 'VENDOR_ACRYLIC';

  // Find vendor user (e.g. Vikas Bhai for VENDOR_FLORIST, Amit for VENDOR_PHOTO, Samir for VENDOR_ACRYLIC)
  const vendorUser = await prisma.user.findFirst({
    where: { role: targetRole as any, status: { not: 'SUSPENDED' } }
  });

  const vendorId = payload.data.vendorId || vendorUser?.id;

  const firstItem = order.items?.[0];
  const cakeDesignImage = payload.data.designImageUrl || firstItem?.designImageUrl || firstItem?.image || "";
  const customerPhotoToPrint = payload.data.photoUrl || firstItem?.designImageUrl || firstItem?.image || "";

  const task = await prisma.vendorTask.create({
    data: {
      orderId,
      vendorType: payload.data.vendorType,
      instructions: payload.data.instructions,
      vendorId: vendorId,
      status: payload.data.status || 'accepted',
      notes: {
        designImageUrl: cakeDesignImage,
        photoUrl: customerPhotoToPrint
      }
    }
  });

  // Also update OrderItems with assignedVendorId so vendor dashboard queries find them
  if (vendorId) {
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: { assignedVendorId: vendorId }
    });
  }

  return NextResponse.json({ success: true, data: task });
});

export const PATCH = withApiHandler(async ({ req, params, appRole }) => {
  const { id: orderId } = params;

  if (!appRole || !['ADMIN', 'MANAGER', 'CHEF', 'KITCHEN', 'SALESPERSON'].includes(appRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const payload = VendorTaskUpdateSchema.safeParse(body);
  if (!payload.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const existingTask = await prisma.vendorTask.findUnique({ where: { id: payload.data.taskId } });
  if (!existingTask || existingTask.orderId !== orderId) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const dataToUpdate: any = {};
  if (payload.data.status) dataToUpdate.status = payload.data.status;
  if (payload.data.vendorId) dataToUpdate.vendorId = payload.data.vendorId;
  
  if (payload.data.note) {
    const existingNotes = Array.isArray(existingTask.notes) ? existingTask.notes : [];
    const newNote = { text: payload.data.note, timestamp: new Date().toISOString(), read: false };
    dataToUpdate.notes = [...existingNotes, newNote];
  }

  const task = await prisma.vendorTask.update({
    where: { id: payload.data.taskId },
    data: dataToUpdate
  });

  return NextResponse.json({ success: true, data: task });
});
