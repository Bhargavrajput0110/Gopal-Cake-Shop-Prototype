import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const VendorTaskSchema = z.object({
  vendorType: z.string(),
  instructions: z.string(),
  vendorId: z.string().optional(),
  status: z.string().default('PENDING')
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

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const body = await req.json();
  const payload = VendorTaskSchema.safeParse(body);
  if (!payload.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const task = await prisma.vendorTask.create({
    data: {
      orderId,
      vendorType: payload.data.vendorType,
      instructions: payload.data.instructions,
      vendorId: payload.data.vendorId,
      status: payload.data.status
    }
  });

  return NextResponse.json({ success: true, data: task });
}, true);

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
}, true);
