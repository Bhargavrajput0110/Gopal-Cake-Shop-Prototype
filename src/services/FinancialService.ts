import { prisma } from '@/lib/prisma';
import { TimelineService } from './TimelineService';
import { LedgerEntryType, PaymentMethod, PaymentStatus, Role } from '@prisma/client';

export class FinancialService {
  /**
   * Records a ledger entry and creates corresponding audit logs and timeline events.
   * This guarantees that finances and events are updated transactionally.
   */
  static async recordLedgerEntry(params: {
    orderId: string;
    type: LedgerEntryType;
    amount: number;
    method?: PaymentMethod;
    referenceId?: string; // Idempotency key (e.g. gateway txn ID)
    notes?: string;
    actorId: string;
    role: Role;
  }) {
    const { orderId, type, amount, method, referenceId, notes, actorId, role } = params;

    // INVARIANTS
    if (amount <= 0 && type !== 'WRITE_OFF') {
      throw new Error('Ledger entry amount must be greater than 0');
    }
    if (!actorId) {
      throw new Error('Manual financial actions require an actorId');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Check idempotency if referenceId is provided
      if (referenceId) {
        const existing = await tx.ledgerEntry.findUnique({
          where: { referenceId }
        });
        if (existing) {
          return existing; // Return existing successfully (idempotent skip)
        }
      }

      // 2. Create Ledger Entry
      const entry = await tx.ledgerEntry.create({
        data: {
          orderId,
          type,
          amount,
          method,
          status: 'SUCCESS', // Assuming synchronous success for now
          referenceId,
          notes,
          actorId,
          branchId: order.branchId
        }
      });

      // 3. Create Timeline (which emits TIMELINE_CREATED -> Notification Matrix)
      await TimelineService.create({
        orderId,
        actorId,
        role: role as any,
        action: 'PAYMENT_RECORDED',
        eventType: 'SYSTEM_ACTION',
        status: order.status,
        nextState: order.status,
        note: `Recorded ${type} of ₹${amount} via ${method || 'INTERNAL'}. ${notes || ''}`,
        reasonCode: referenceId || null
      }, tx as any);

      // 4. Create Audit Log for deep financial transparency
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'LEDGER_ENTRY_CREATED',
          tableName: 'LedgerEntry',
          recordId: entry.id,
          newValue: entry as any,
          reason: notes || `Created ${type} entry`
        }
      });

      return entry;
    });
  }
}
