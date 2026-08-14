import { prisma } from '@/lib/prisma';
import { TimelineService } from './TimelineService';
import { LedgerEntryType, PaymentMethod, PaymentStatus, Role, LedgerEntry } from '@prisma/client';

export interface FinancialSummary {
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  refundedAmount: number;
  waivedAmount: number;
  writeOffAmount: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
}

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

    const summary = await FinancialService.calculateFinancialSummary(orderId);
    
    // Prevent overpayment
    if (type === 'PAYMENT' && amount > summary.outstandingAmount) {
      throw new Error(`Amount ₹${amount} exceeds the outstanding balance of ₹${summary.outstandingAmount}`);
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

  /**
   * Centralized source of truth for all order financial states.
   * Calculates net payments, refunds, and determines the current status from the Ledger.
   */
  static async calculateFinancialSummary(orderOrId: string | (any & { ledgerEntries: LedgerEntry[] })): Promise<FinancialSummary> {
    let order;
    if (typeof orderOrId === 'string') {
      order = await prisma.order.findUnique({
        where: { id: orderOrId },
        include: { ledgerEntries: true }
      });
      if (!order) {
        throw new Error(`Order ${orderOrId} not found`);
      }
    } else {
      order = orderOrId;
      if (!order.ledgerEntries) {
        throw new Error('calculateFinancialSummary requires ledgerEntries to be included on the order object');
      }
    }

    const totalAmount = Number(order.totalAmount);
    
    let paidAmount = 0;
    let refundedAmount = 0;
    let waivedAmount = 0;
    let writeOffAmount = 0;

    order.ledgerEntries.forEach((entry: LedgerEntry) => {
      if (entry.status === 'SUCCESS') {
        const amount = Number(entry.amount);
        switch (entry.type) {
          case 'PAYMENT':
            paidAmount += amount;
            break;
          case 'REFUND':
            refundedAmount += amount;
            // A refund conceptually lowers the net paid amount, 
            // so we subtract it from paidAmount to represent "net cash currently held"
            paidAmount -= amount; 
            break;
          case 'WAIVER':
            waivedAmount += amount;
            break;
          case 'WRITE_OFF':
            writeOffAmount += amount;
            break;
        }
      }
    });

    // Ensure we don't have a negative paid amount theoretically
    if (paidAmount < 0) paidAmount = 0;

    // The amount actually owed left to pay
    // Adjust total to account for waivers and write-offs
    const effectiveTotal = Math.max(0, totalAmount - waivedAmount - writeOffAmount);
    let outstandingAmount = effectiveTotal - paidAmount;
    if (outstandingAmount < 0) outstandingAmount = 0; // Overpayments shouldn't show as negative due in normal flow, though they are prevented.

    let paymentStatus: FinancialSummary['paymentStatus'] = 'UNPAID';
    if (paidAmount >= effectiveTotal && effectiveTotal > 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0 && paidAmount < effectiveTotal) {
      paymentStatus = 'PARTIALLY_PAID';
    } else if (effectiveTotal === 0 && (waivedAmount > 0 || writeOffAmount > 0)) {
      paymentStatus = 'PAID';
    }

    return {
      totalAmount,
      paidAmount,
      outstandingAmount,
      refundedAmount,
      waivedAmount,
      writeOffAmount,
      paymentStatus
    };
  }
}
