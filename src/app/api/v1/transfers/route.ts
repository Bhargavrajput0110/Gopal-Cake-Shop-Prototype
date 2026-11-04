import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BranchTransferService } from '@/services/BranchTransferService';
import { withApiHandler } from '@/lib/withApiHandler';
import { z } from 'zod';

const RequestTransferSchema = z.object({
  orderId: z.string().min(1),
  fromBranchId: z.string().optional(),
  toBranchId: z.string().min(1),
  reason: z.string().optional(),
  notes: z.string().optional(),
  newTargetDate: z.string().optional(),
});

import { toBranchId, BRANCHES } from '@/lib/branches';

// GET: List all incoming and outgoing transfers for the authenticated user's active branch
export const GET = withApiHandler(async ({ req, appRole, branchId }) => {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode'); // "incoming" or "outgoing"

  let possibleBranchIds: string[] = [];
  if (branchId) {
    const canonical = toBranchId(branchId);
    const branchObj = BRANCHES.find(b => b.id === canonical);
    possibleBranchIds = branchObj ? [canonical, branchId, ...branchObj.aliases] : [canonical, branchId];
  }

  let whereClause: any = {};
  if (appRole === 'ADMIN' && possibleBranchIds.length === 0) {
    whereClause = {};
  } else if (mode === 'incoming') {
    whereClause = { toBranchId: { in: possibleBranchIds } };
  } else if (mode === 'outgoing') {
    whereClause = { fromBranchId: { in: possibleBranchIds } };
  } else if (possibleBranchIds.length > 0) {
    whereClause = { OR: [{ fromBranchId: { in: possibleBranchIds } }, { toBranchId: { in: possibleBranchIds } }] };
  }

  const transfers = await prisma.branchTransfer.findMany({
    where: whereClause,
    include: {
      order: {
        select: { id: true, orderNumber: true, status: true, customerId: true, branchId: true, targetDate: true, customer: { select: { name: true, phone: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(transfers);
}, false, 'view_orders');

// POST: Request a new branch transfer
export const POST = withApiHandler(async ({ req, user, branchId }) => {
  if (!user?.id) throw new Error('User context required');
  
  const body = await req.json();
  const parsed = RequestTransferSchema.parse(body);

  // If branchId is null in user context (e.g. ADMIN), determine from request body or look up order's current branch
  let effectiveFromBranchId: string | undefined = branchId || parsed.fromBranchId || undefined;
  if (!effectiveFromBranchId) {
    const targetOrder = await prisma.order.findUnique({
      where: { id: parsed.orderId },
      select: { branchId: true }
    });
    effectiveFromBranchId = targetOrder?.branchId || undefined;
  }

  if (!effectiveFromBranchId) {
    throw new Error('Source branch (fromBranchId) could not be determined for transfer');
  }

  const transfer = await BranchTransferService.requestTransfer({
    orderId: parsed.orderId,
    fromBranchId: effectiveFromBranchId,
    toBranchId: parsed.toBranchId,
    requestedBy: user.id,
    reason: parsed.reason,
    notes: parsed.notes,
    newTargetDate: parsed.newTargetDate
  });

  return NextResponse.json(transfer, { status: 201 });
}, false, 'update_order_full');
