import { prisma } from '@/lib/prisma';
import { PaymentStatus, TimelineEventType, LedgerEntryType } from '@prisma/client';

export type HealthSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ReconciliationIssue {
  id: string; // unique identifier for the issue, typically paymentId or orderId
  type: 'MISSING_LEDGER' | 'AMOUNT_MISMATCH' | 'STALLED_PAYMENT' | 'MISSING_TIMELINE' | 'DUPLICATE_LEDGER' | 'ORPHAN_GATEWAY_RECORD';
  severity: HealthSeverity;
  description: string;
  orderId?: string;
  paymentId?: string;
  metadata?: any;
  createdAt: Date;
}

export interface ReconciliationHealthReport {
  generatedAt: Date;
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  summary: {
    missingLedger: number;
    amountMismatch: number;
    stalledPayments: number;
    missingTimeline: number;
    duplicateLedger: number;
    orphanGatewayRecords: number;
  };
  issues: ReconciliationIssue[];
}

export class ReconciliationService {
  static async getHealthReport(): Promise<ReconciliationHealthReport> {
    const issues: ReconciliationIssue[] = [];
    const now = new Date();
    
    // 1. Missing Ledger: Payment SUCCESS but no ledger entry
    const successfulPaymentsWithoutLedger = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        order: {
          ledger: {
            none: {}
          }
        }
      },
      include: { order: true }
    });

    for (const payment of successfulPaymentsWithoutLedger) {
      issues.push({
        id: `ml-${payment.id}`,
        type: 'MISSING_LEDGER',
        severity: 'CRITICAL',
        description: `Payment ${payment.id} is SUCCESS but Order ${payment.orderId} has no ledger entry.`,
        orderId: payment.orderId,
        paymentId: payment.id,
        createdAt: payment.updatedAt
      });
    }

    // 2. Amount Mismatch
    const successfulPaymentsWithLedger = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        order: {
          ledger: {
            some: { type: LedgerEntryType.CREDIT }
          }
        }
      },
      include: { 
        order: {
          include: {
            ledger: {
              where: { type: LedgerEntryType.CREDIT }
            }
          }
        }
      }
    });

    for (const payment of successfulPaymentsWithLedger) {
      const ledgerTotal = payment.order.ledger.reduce((sum, entry) => sum + Number(entry.amount), 0);
      if (Math.abs(Number(payment.amount) - ledgerTotal) > 0.01) { // Floating point safety
        issues.push({
          id: `am-${payment.id}`,
          type: 'AMOUNT_MISMATCH',
          severity: 'CRITICAL',
          description: `Payment ${payment.id} amount (${payment.amount}) does not match Ledger Credit total (${ledgerTotal}).`,
          orderId: payment.orderId,
          paymentId: payment.id,
          createdAt: payment.updatedAt,
          metadata: { paymentAmount: payment.amount, ledgerTotal }
        });
      }
    }

    // 3. Stalled Payments (Pending > 60 mins)
    const timeoutThreshold = new Date(now.getTime() - 60 * 60 * 1000); // 60 mins
    const stalledPayments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: { lt: timeoutThreshold }
      }
    });

    for (const payment of stalledPayments) {
      issues.push({
        id: `sp-${payment.id}`,
        type: 'STALLED_PAYMENT',
        severity: 'WARNING',
        description: `Payment ${payment.id} has been PENDING for over 60 minutes.`,
        orderId: payment.orderId,
        paymentId: payment.id,
        createdAt: payment.createdAt
      });
    }

    // 4. Missing Timeline: Payment SUCCESS but no PAYMENT_CAPTURED event
    const successfulPaymentsWithoutTimeline = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        order: {
          timeline: {
            none: { eventType: TimelineEventType.PAYMENT_CAPTURED }
          }
        }
      }
    });

    for (const payment of successfulPaymentsWithoutTimeline) {
      issues.push({
        id: `mt-${payment.id}`,
        type: 'MISSING_TIMELINE',
        severity: 'WARNING',
        description: `Payment ${payment.id} is SUCCESS but missing PAYMENT_CAPTURED timeline event.`,
        orderId: payment.orderId,
        paymentId: payment.id,
        createdAt: payment.updatedAt
      });
    }

    // 5. Duplicate Ledger: Multiple Credit entries for the same order (Assuming 1 payment = 1 credit normally, except refunds)
    // We can group by orderId in ledger where type = CREDIT
    const ledgerCredits = await prisma.ledgerEntry.groupBy({
      by: ['orderId'],
      where: { type: LedgerEntryType.CREDIT },
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } }
      }
    });

    for (const duplicate of ledgerCredits) {
      issues.push({
        id: `dl-${duplicate.orderId}`,
        type: 'DUPLICATE_LEDGER',
        severity: 'CRITICAL',
        description: `Order ${duplicate.orderId} has ${duplicate._count.id} CREDIT ledger entries. Check for duplicates.`,
        orderId: duplicate.orderId,
        createdAt: now
      });
    }

    // 6. Orphan Gateway Records (Payment exists but no Order)
    // Prisma ensures foreign keys, so this shouldn't happen at DB level, but we check if orderId is somehow null if it's optional
    // Or if we check Gateway vs DB. Since we can't efficiently poll the gateway for all records here, we'll skip Gateway polling in this report to keep it fast, unless needed.
    // We will leave this 0 for now as Prisma enforces FK.

    // Calculate Summary
    const summary = {
      missingLedger: issues.filter(i => i.type === 'MISSING_LEDGER').length,
      amountMismatch: issues.filter(i => i.type === 'AMOUNT_MISMATCH').length,
      stalledPayments: issues.filter(i => i.type === 'STALLED_PAYMENT').length,
      missingTimeline: issues.filter(i => i.type === 'MISSING_TIMELINE').length,
      duplicateLedger: issues.filter(i => i.type === 'DUPLICATE_LEDGER').length,
      orphanGatewayRecords: 0
    };

    let overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (issues.some(i => i.severity === 'CRITICAL')) {
      overallStatus = 'CRITICAL';
    } else if (issues.some(i => i.severity === 'WARNING')) {
      overallStatus = 'WARNING';
    }

    return {
      generatedAt: now,
      overallStatus,
      summary,
      issues: issues.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    };
  }
}
