import { PrismaClient, Prisma, TransferStatus, TimelineEventType, OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TimelineService } from './TimelineService';

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
      // Validate order ownership
      const order = await tx.order.findUnique({
        where: { id: params.orderId },
        select: { branchId: true, status: true, orderNumber: true, targetDate: true }
      });
      if (!order) throw new Error('Order not found');
      if (order.branchId !== params.fromBranchId) {
        throw new Error('Order does not belong to the source branch.');
      }

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

      const transfer = await tx.branchTransfer.create({
        data: {
          orderId: params.orderId,
          fromBranchId: params.fromBranchId,
          toBranchId: params.toBranchId,
          status: 'PENDING',
          requestedBy: params.requestedBy,
          transferReason: params.reason,
          notes: params.notes,
        }
      });

      // Update Order Target Date if requested and valid
      if (params.newTargetDate) {
        const newDate = new Date(params.newTargetDate);
        if (newDate > order.targetDate) {
          throw new Error('New target date cannot be later than the original target date given by the customer.');
        }
        
        await tx.order.update({
          where: { id: params.orderId },
          data: { targetDate: newDate }
        });
        
        await tx.auditLog.create({
          data: {
            actorId: params.requestedBy,
            action: 'ORDER_TARGET_DATE_UPDATED',
            tableName: 'Order',
            recordId: params.orderId,
            oldValue: { targetDate: order.targetDate },
            newValue: { targetDate: newDate }
          }
        });
      }

      await TimelineService.create({
        orderId: params.orderId,
        actorId: params.requestedBy,
        action: `Transfer requested to branch ${params.toBranchId}`,
        status: order.status,
        nextState: order.status,
        eventType: 'TRANSFER_REQUESTED',
        branchId: params.fromBranchId,
        reasonCode: params.reason,
        note: params.notes
      }, tx);

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          actorId: params.requestedBy,
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
  }) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.branchTransfer.findUnique({ where: { id: params.transferId }, include: { order: true } });
      if (!transfer) throw new Error('Transfer not found');
      if (transfer.toBranchId !== params.branchId) throw new Error('Only the target branch can accept a transfer.');
      if (transfer.status !== 'PENDING') throw new Error(`Cannot accept transfer in status ${transfer.status}`);

      const updated = await tx.branchTransfer.update({
        where: { id: params.transferId },
        data: {
          status: 'ACCEPTED',
          respondedBy: params.respondedBy,
          notes: params.notes ? `${transfer.notes || ''}\n[Accept]: ${params.notes}` : transfer.notes
        }
      });

      await TimelineService.create({
        orderId: transfer.orderId,
        actorId: params.respondedBy,
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
  }) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.branchTransfer.findUnique({ where: { id: params.transferId }, include: { order: true } });
      if (!transfer) throw new Error('Transfer not found');
      if (transfer.toBranchId !== params.branchId) throw new Error('Only the target branch can reject a transfer.');
      if (transfer.status !== 'PENDING') throw new Error(`Cannot reject transfer in status ${transfer.status}`);

      const updated = await tx.branchTransfer.update({
        where: { id: params.transferId },
        data: {
          status: 'REJECTED',
          respondedBy: params.respondedBy,
          notes: params.notes ? `${transfer.notes || ''}\n[Reject]: ${params.notes}` : transfer.notes
        }
      });

      await TimelineService.create({
        orderId: transfer.orderId,
        actorId: params.respondedBy,
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
  }) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.branchTransfer.findUnique({ where: { id: params.transferId }, include: { order: true } });
      if (!transfer) throw new Error('Transfer not found');
      if (transfer.fromBranchId !== params.branchId) throw new Error('Only the source branch can dispatch a transfer.');
      if (transfer.status !== 'ACCEPTED') throw new Error(`Cannot dispatch transfer in status ${transfer.status}. Must be ACCEPTED first.`);

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
        actorId: params.dispatchedBy,
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
  }) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.branchTransfer.findUnique({ where: { id: params.transferId }, include: { order: true } });
      if (!transfer) throw new Error('Transfer not found');
      if (transfer.toBranchId !== params.branchId) throw new Error('Only the target branch can receive a transfer.');
      if (transfer.status !== 'IN_TRANSIT') throw new Error(`Cannot receive transfer in status ${transfer.status}. Must be IN_TRANSIT first.`);

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
        actorId: params.receivedBy,
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
          actorId: params.receivedBy,
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
