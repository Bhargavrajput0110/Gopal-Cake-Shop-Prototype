import { NextResponse } from 'next/server';
import { BranchTransferService } from '@/services/BranchTransferService';
import { withApiHandler } from '@/lib/withApiHandler';
import { z } from 'zod';

const ActionSchema = z.object({
  notes: z.string().optional(),
  transportedBy: z.string().optional(),
});

// PATCH: Execute a state machine action on a transfer
export const PATCH = withApiHandler(async ({ req, user, branchId, params }) => {
  const { id, action } = await params;
  if (!branchId || !user?.id) throw new Error('Branch and user context required');
  
  let body = {};
  try {
    body = await req.json();
  } catch(e) {}
  
  const parsed = ActionSchema.parse(body);

  let result;

  switch (action) {
    case 'accept':
      result = await BranchTransferService.acceptTransfer({
        transferId: id,
        branchId: branchId,
        respondedBy: user.id,
        notes: parsed.notes
      });
      break;

    case 'reject':
      if (!parsed.notes) {
        return NextResponse.json({ error: 'Rejection requires notes' }, { status: 400 });
      }
      result = await BranchTransferService.rejectTransfer({
        transferId: id,
        branchId: branchId,
        respondedBy: user.id,
        notes: parsed.notes
      });
      break;

    case 'dispatch':
      result = await BranchTransferService.dispatchTransfer({
        transferId: id,
        branchId: branchId,
        dispatchedBy: user.id,
        transportedBy: parsed.transportedBy,
        notes: parsed.notes
      });
      break;

    case 'receive':
      result = await BranchTransferService.receiveTransfer({
        transferId: id,
        branchId: branchId,
        receivedBy: user.id,
        notes: parsed.notes
      });
      break;

    default:
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  }

  return NextResponse.json(result);
}, false, 'update_order_full');
