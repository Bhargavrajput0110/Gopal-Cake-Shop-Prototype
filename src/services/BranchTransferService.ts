import { PrismaClient, Prisma, TransferStatus, TimelineEventType, OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { toBranchId, BRANCHES } from '@/lib/branches';
import { TimelineService } from './TimelineService';

async function resolveDbBranchId(rawBranch: string, tx: any): Promise<string> {
  const canonical = toBranchId(rawBranch);
  const branchObj = BRANCHES.find((b: any) => b.id === canonical);
  const aliases = branchObj
    ? Array.from(new Set([canonical, rawBranch, branchObj.shortName, branchObj.displayName, ...branchObj.aliases]))
    : Array.from(new Set([canonical, rawBranch]));

  const found = await tx.branch.findFirst({
    where: {
      OR: [
        { id: { in: aliases } },
        { code: { in: aliases.map(a => a.toUpperCase()) } },
        { name: { in: aliases } },
        { name: { contains: 'Warasiya', mode: 'insensitive' } },
        { name: { contains: 'Varasiya', mode: 'insensitive' } },
        { name: { contains: 'Warashiya', mode: 'insensitive' } },
        { name: { contains: canonical, mode: 'insensitive' } }
      ]
    }
  });
  if (found) return found.id;

  const byId = await tx.branch.findUnique({ where: { id: rawBranch } });
  if (byId) return byId.id;

  const first = await tx.branch.findFirst();
  return first ? first.id : canonical;
}

async function resolveValidUserId(userId: string | undefined | null, tx: any): Promise<string> {
  if (userId) {
    const userExists = await tx.user.findUnique({ where: { id: userId } });
    if (userExists) return userExists.id;
  }
  const staffUser = await tx.user.findFirst({ where: { role: { in: ['ADMIN', 'MANAGER', 'SALESPERSON'] } } });
  if (staffUser) return staffUser.id;
  const anyUser = await tx.user.findFirst();
  return anyUser ? anyUser.id : 'system-user';
}

export class BranchTransferService {
  /**
   * Request a transfer from one branch to another.
   * Can only be performed by the source branch.
   */
  static async requestTransfer(params: {
    orderId: string;
    fromBranchId: string;
    toBranchId: string;
    requestedBy: string;
    reason?: string;
    notes?: string;
    newTargetDate?: Date | string;
  }) {
    return prisma.$transaction(async (tx) => {
      // Validate order existence
      const order = await tx.order.findUnique({
        where: { id: params.orderId },
        select: { branchId: true, status: true, orderNumber: true, targetDate: true }
      });
      if (!order) throw new Error('Order not found');

      // Check if there are any active transfers
      const activeTransfer = await tx.branchTransfer.findFirst({
        where: {
          orderId: params.orderId,
          status: { in: ['PENDING', 'ACCEPTED', 'IN_TRANSIT'] }
        }
      });
      if (activeTransfer) {
        throw new Error('An active transfer already exists for this order.');
      }

      // Resolve valid foreign keys for Branch and User tables in DB
      const canonicalFromBranch = await resolveDbBranchId(params.fromBranchId || order.branchId, tx);
      const canonicalToBranch = await resolveDbBranchId(params.toBranchId, tx);

      const validUserId = await resolveValidUserId(params.requestedBy, tx);

      const transfer = await tx.branchTransfer.create({
        data: {
          orderId: params.orderId,
          fromBranchId: canonicalFromBranch,
          toBranchId: canonicalToBranch,
          status: 'PENDING',
          requestedBy: validUserId,
          transferReason: params.reason,
          notes: params.notes,
        }
      });

      // Update Order Target Date if requested and valid
      if (params.newTargetDate) {
        const newDate = new Date(params.newTargetDate);
        if (isNaN(newDate.getTime())) {
          throw new Error('Invalid target date provided.');
        }
        
        // Only update database if date actually changed (difference > 60 seconds)
        if (!order.targetDate || Math.abs(newDate.getTime() - new Date(order.targetDate).getTime()) > 60000) {
          await tx.order.update({
            where: { id: params.orderId },
            data: { targetDate: newDate }
          });
          
          await tx.auditLog.create({
            data: {
              actorId: validUserId,
              action: 'ORDER_TARGET_DATE_UPDATED',
              tableName: 'Order',
              recordId: params.orderId,
              oldValue: { targetDate: order.targetDate },
              newValue: { targetDate: newDate }
            }
          });
        }
      }

      await TimelineService.create({
        orderId: params.orderId,
        actorId: validUserId,
        action: `Transfer requested to branch ${canonicalToBranch}`,
        status: order.status,
        nextState: order.status,
        eventType: 'TRANSFER_REQUESTED',
        branchId: canonicalFromBranch,
        reasonCode: params.reason,
        note: params.notes
      }, tx);

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          actorId: validUserId,
          action: 'TRANSFER_REQUESTED',
          tableName: 'BranchTransfer',
          recordId: transfer.id,
          newValue: transfer as any
        }
      });

      return transfer;
    });
  }

  /**
   * Accept an incoming transfer request.
   * Can only be performed by the target branch.
   */
  static async acceptTransfer(params: {
    transferId: string;
    branchId: string; // The branch accepting it (target)
    respondedBy: string;
    notes?: string;
    role?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.branchTransfer.findUnique({ where: { id: params.transferId }, include: { order: true } });
      if (!transfer) throw new Error('Transfer not found');
      const isAdmin = params.role?.toUpperCase() === 'ADMIN';
      if (!isAdmin && toBranchId(transfer.toBranchId) !== toBranchId(params.branchId)) {
        throw new Error('Only the target branch can accept a transfer.');
      }
      if (transfer.status !== 'PENDING') throw new Error(`Cannot accept transfer in status ${transfer.status}`);

      const validUserId = await resolveValidUserId(params.respondedBy, tx);

      const updated = await tx.branchTransfer.update({
        where: { id: params.transferId },
        data: {
          status: 'ACCEPTED',
          respondedBy: validUserId,
          notes: params.notes ? `${transfer.notes || ''}\n[Accept]: ${params.notes}` : transfer.notes
        }
      });

      await TimelineService.create({
        orderId: transfer.orderId,
        actorId: validUserId,
        action: `Transfer request accepted`,
        status: transfer.order.status,
        nextState: transfer.order.status,
        eventType: 'TRANSFER_ACCEPTED',
        branchId: params.branchId,
        note: params.notes
      }, tx);

      return updated;
    });
  }

  /**
   * Reject an incoming transfer request.
   * Can only be performed by the target branch.
   */
  static async rejectTransfer(params: {
    transferId: string;
    branchId: string; // The branch rejecting it (target)
    respondedBy: string;
    notes: string; // Mandatory for rejection
    role?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.branchTransfer.findUnique({ where: { id: params.transferId }, include: { order: true } });
      if (!transfer) throw new Error('Transfer not found');
      const isAdmin = params.role?.toUpperCase() === 'ADMIN';
      if (!isAdmin && toBranchId(transfer.toBranchId) !== toBranchId(params.branchId)) {
        throw new Error('Only the target branch can reject a transfer.');
      }
      if (transfer.status !== 'PENDING') throw new Error(`Cannot reject transfer in status ${transfer.status}`);

      const validUserId = await resolveValidUserId(params.respondedBy, tx);

      const updated = await tx.branchTransfer.update({
        where: { id: params.transferId },
        data: {
          status: 'REJECTED',
          respondedBy: validUserId,
          notes: params.notes ? `${transfer.notes || ''}\n[Reject]: ${params.notes}` : transfer.notes
        }
      });

      await TimelineService.create({
        orderId: transfer.orderId,
        actorId: validUserId,
        action: `Transfer request rejected`,
        status: transfer.order.status,
        nextState: transfer.order.status,
        eventType: 'TRANSFER_REJECTED',
        branchId: params.branchId,
        note: params.notes
      }, tx);

      return updated;
    });
  }

  /**
   * Dispatch the transfer (mark as IN_TRANSIT).
   * Can only be performed by the source branch.
   */
  static async dispatchTransfer(params: {
    transferId: string;
    branchId: string; // Source branch
    dispatchedBy: string;
    transportedBy?: string;
    notes?: string;
    newTargetDate?: Date | string;
    role?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.branchTransfer.findUnique({ where: { id: params.transferId }, include: { order: true } });
      if (!transfer) throw new Error('Transfer not found');
      const isAdmin = params.role?.toUpperCase() === 'ADMIN';
      if (!isAdmin && toBranchId(transfer.fromBranchId) !== toBranchId(params.branchId)) {
        throw new Error('Only the source branch can dispatch a transfer.');
      }
      if (transfer.status !== 'ACCEPTED') throw new Error(`Cannot dispatch transfer in status ${transfer.status}. Must be ACCEPTED first.`);

      const validUserId = await resolveValidUserId(params.dispatchedBy, tx);

      const updated = await tx.branchTransfer.update({
        where: { id: params.transferId },
        data: {
          status: 'IN_TRANSIT',
          transportedBy: params.transportedBy,
          notes: params.notes ? `${transfer.notes || ''}\n[Dispatch]: ${params.notes}` : transfer.notes
        }
      });

      await TimelineService.create({
        orderId: transfer.orderId,
        actorId: validUserId,
        action: `Transfer dispatched (In Transit)`,
        status: transfer.order.status,
        nextState: transfer.order.status,
        eventType: 'TRANSFER_DISPATCHED',
        branchId: params.branchId,
        note: params.notes
      }, tx);

      return updated;
    });
  }

  /**
   * Receive the transfer (mark as RECEIVED).
   * Can only be performed by the target branch.
   * This is the moment Operational Ownership transfers.
   */
  static async receiveTransfer(params: {
    transferId: string;
    branchId: string; // Target branch
    receivedBy: string;
    notes?: string;
    role?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.branchTransfer.findUnique({ where: { id: params.transferId }, include: { order: true } });
      if (!transfer) throw new Error('Transfer not found');
      const isAdmin = params.role?.toUpperCase() === 'ADMIN';
      if (!isAdmin && toBranchId(transfer.toBranchId) !== toBranchId(params.branchId)) {
        throw new Error('Only the target branch can receive a transfer.');
      }
      if (transfer.status !== 'IN_TRANSIT') throw new Error(`Cannot receive transfer in status ${transfer.status}. Must be IN_TRANSIT first.`);

      const validUserId = await resolveValidUserId(params.receivedBy, tx);

      // 1. Update transfer status
      const updated = await tx.branchTransfer.update({
        where: { id: params.transferId },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
          notes: params.notes ? `${transfer.notes || ''}\n[Receive]: ${params.notes}` : transfer.notes
        }
      });

      // 2. Transfer Operational Ownership
      const updatedOrder = await tx.order.update({
        where: { id: transfer.orderId },
        data: {
          branchId: transfer.toBranchId
        }
      });

      // 3. Timeline event (which triggers outbox notification)
      await TimelineService.create({
        orderId: transfer.orderId,
        actorId: validUserId,
        action: `Transfer physically received. Ownership updated to ${transfer.toBranchId}`,
        status: updatedOrder.status,
        nextState: updatedOrder.status,
        eventType: 'TRANSFER_RECEIVED',
        branchId: params.branchId,
        note: params.notes
      }, tx);

      // 4. Audit ownership change
      await tx.auditLog.create({
        data: {
          actorId: validUserId,
          action: 'OWNERSHIP_TRANSFERRED',
          tableName: 'Order',
          recordId: transfer.orderId,
          oldValue: { branchId: transfer.fromBranchId },
          newValue: { branchId: transfer.toBranchId }
        }
      });

      return updated;
    });
  }
}
