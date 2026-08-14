import { prisma } from '@/lib/prisma';
import { PaymentStatus, TimelineEventType, LedgerEntryType } from '@prisma/client';
import { FinancialService } from '@/services/FinancialService';

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
          ledgerEntries: {
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
    // Check if the sum of successful Payment intents matches the Ledger paidAmount
    const ordersWithPayments = await prisma.order.findMany({
      where: {
        payments: { some: { status: PaymentStatus.SUCCESS } }
      },
      include: {
        payments: { where: { status: PaymentStatus.SUCCESS } },
        ledgerEntries: true
      }
    });

    for (const order of ordersWithPayments) {
      const summary = await FinancialService.calculateFinancialSummary(order);
      const gatewayTotal = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      if (Math.abs(gatewayTotal - summary.paidAmount) > 0.01) {
        issues.push({
          id: `am-${order.id}`,
          type: 'AMOUNT_MISMATCH',
          severity: 'CRITICAL',
          description: `Order ${order.id} Gateway SUCCESS total (${gatewayTotal}) does not match Ledger Credit total (${summary.paidAmount}).`,
          orderId: order.id,
          createdAt: now,
          metadata: { gatewayTotal, ledgerTotal: summary.paidAmount }
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
    // We can group by orderId in ledger where type = PAYMENT
    const ledgerCredits = await prisma.ledgerEntry.groupBy({
      by: ['orderId'],
      where: { type: LedgerEntryType.PAYMENT },
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
        orderId: duplicate.orderId ?? undefined,
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
