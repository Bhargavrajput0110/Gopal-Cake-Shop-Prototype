import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const IngredientRequestSchema = z.object({
  itemCode: z.string(),
  itemName: z.string(),
  qty: z.number().optional(),
  unit: z.string().optional()
});

const IngredientRequestUpdateSchema = z.object({
  requestId: z.string(),
  status: z.string()
});

export const GET = withApiHandler(async ({ req, params, appRole }) => {
  const { id: orderId } = params;

  if (!appRole || !['ADMIN', 'MANAGER', 'CHEF', 'KITCHEN', 'SALESPERSON'].includes(appRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requests = await prisma.ingredientRequest.findMany({
    where: { orderId },
    include: { requestedBy: { select: { name: true } } }
  });

  return NextResponse.json({ success: true, data: requests });
});

export const POST = withApiHandler(async ({ req, params, appRole, user }) => {
  const { id: orderId } = params;

  if (!appRole || !['ADMIN', 'MANAGER', 'CHEF', 'KITCHEN'].includes(appRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const body = await req.json();
  const payload = IngredientRequestSchema.safeParse(body);
  if (!payload.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const request = await prisma.ingredientRequest.create({
    data: {
      orderId,
      itemCode: payload.data.itemCode,
      itemName: payload.data.itemName,
      qty: payload.data.qty,
      unit: payload.data.unit,
      requestedById: user.id,
      status: 'PENDING'
    }
  });

  return NextResponse.json({ success: true, data: request });
}, true);

export const PATCH = withApiHandler(async ({ req, params, appRole }) => {
  const { id: orderId } = params;

  if (!appRole || !['ADMIN', 'MANAGER', 'CHEF', 'KITCHEN', 'SALESPERSON'].includes(appRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const payload = IngredientRequestUpdateSchema.safeParse(body);
  if (!payload.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const existingReq = await prisma.ingredientRequest.findUnique({ where: { id: payload.data.requestId } });
  if (!existingReq || existingReq.orderId !== orderId) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const request = await prisma.ingredientRequest.update({
    where: { id: payload.data.requestId },
    data: { status: payload.data.status }
  });

  return NextResponse.json({ success: true, data: request });
}, true);
