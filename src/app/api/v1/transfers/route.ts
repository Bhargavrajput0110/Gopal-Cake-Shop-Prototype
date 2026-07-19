import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BranchTransferService } from '@/services/BranchTransferService';
import { withApiHandler } from '@/lib/withApiHandler';
import { z } from 'zod';

const RequestTransferSchema = z.object({
  orderId: z.string().min(1),
  toBranchId: z.string().min(1),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// GET: List all incoming and outgoing transfers for the authenticated user's active branch
export const GET = withApiHandler(async ({ req, branchId }) => {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode'); // "incoming" or "outgoing"

  if (!branchId) throw new Error('Branch context required');

  const transfers = await prisma.branchTransfer.findMany({
    where: mode === 'incoming' 
      ? { toBranchId: branchId }
      : mode === 'outgoing'
        ? { fromBranchId: branchId }
        : { OR: [{ fromBranchId: branchId }, { toBranchId: branchId }] },
    include: {
      order: {
        select: { id: true, orderNumber: true, status: true, customerId: true, branchId: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(transfers);
}, false, 'view_orders');

// POST: Request a new branch transfer
export const POST = withApiHandler(async ({ req, user, branchId }) => {
  if (!branchId || !user?.id) throw new Error('Branch and user context required');
  
  const body = await req.json();
  const parsed = RequestTransferSchema.parse(body);

  const transfer = await BranchTransferService.requestTransfer({
    orderId: parsed.orderId,
    fromBranchId: branchId,
    toBranchId: parsed.toBranchId,
    requestedBy: user.id,
    reason: parsed.reason,
    notes: parsed.notes
  });

  return NextResponse.json(transfer, { status: 201 });
}, false, 'update_order_full');
