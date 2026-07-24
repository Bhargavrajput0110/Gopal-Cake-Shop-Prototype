import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { ReconciliationService } from '@/services/payment/ReconciliationService';
import { Prisma, PaymentStatus, TimelineEventType, LedgerEntryType } from '@prisma/client';

describe('ReconciliationService Health Check', () => {
  const branchId = `b-test-${Date.now()}`;
  const customerId = `c-test-${Date.now()}`;

  beforeEach(async () => {
    // Setup test branch and customer
    await prisma.branch.create({ data: { id: branchId, name: 'Test Branch', code: `TB-${Date.now()}`, address: '123 Test St' } });
    await prisma.customer.create({ data: { id: customerId, name: 'Test Customer', phone: `+9199999${Math.floor(Math.random() * 10000)}` } });
  });

  afterEach(async () => {
    // Cleanup
    await prisma.ledgerEntry.deleteMany({ where: { order: { branchId } } });
    await prisma.timeline.deleteMany({ where: { order: { branchId } } });
    await prisma.payment.deleteMany({ where: { order: { branchId } } });
    await prisma.order.deleteMany({ where: { branchId } });
    await prisma.customer.deleteMany({ where: { id: customerId } });
    await prisma.branch.deleteMany({ where: { id: branchId } });
  });

  const createOrderWithPayment = async (status: PaymentStatus, amount: number) => {
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
        branchId,
        customerId,
        subtotal: new Prisma.Decimal(amount),
        totalAmount: new Prisma.Decimal(amount),
        deliveryType: 'PICKUP',
        targetDate: new Date(),
        status: 'NEW'
      }
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: new Prisma.Decimal(amount),
        provider: 'RAZORPAY',
        status,
        method: 'RAZORPAY',
        type: 'FULL',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return { order, payment };
  };

  it('should detect MISSING_LEDGER discrepancies', async () => {
    // Create successful payment without ledger
    await createOrderWithPayment('SUCCESS', 500);

    const report = await ReconciliationService.getHealthReport();
    
    const missingLedgerIssue = report.issues.find(i => i.type === 'MISSING_LEDGER');
    expect(missingLedgerIssue).toBeDefined();
    expect(missingLedgerIssue?.severity).toBe('CRITICAL');
    expect(report.overallStatus).toBe('CRITICAL');
  });

  it('should detect AMOUNT_MISMATCH discrepancies', async () => {
    const { order, payment } = await createOrderWithPayment('SUCCESS', 500);

    // Create a mismatched ledger entry
    await prisma.ledgerEntry.create({
      data: {
        orderId: order.id,
        type: 'PAYMENT',
        amount: new Prisma.Decimal(300), // Mismatch!
        status: 'SUCCESS',
        notes: 'Payment',
        referenceId: payment.id
      }
    });

    const report = await ReconciliationService.getHealthReport();
    
    const mismatchIssue = report.issues.find(i => i.type === 'AMOUNT_MISMATCH' && i.orderId === order.id);
    expect(mismatchIssue).toBeDefined();
    expect(mismatchIssue?.severity).toBe('CRITICAL');
  });

  it('should detect MISSING_TIMELINE discrepancies', async () => {
    const { order, payment } = await createOrderWithPayment('SUCCESS', 500);

    // Create matching ledger so it doesn't fail MISSING_LEDGER
    await prisma.ledgerEntry.create({
      data: {
        orderId: order.id,
        type: 'PAYMENT',
        amount: new Prisma.Decimal(500),
        status: 'SUCCESS',
        notes: 'Payment',
        referenceId: payment.id
      }
    });
    // Missing TimelineEvent

    const report = await ReconciliationService.getHealthReport();
    
    const missingTimelineIssue = report.issues.find(i => i.type === 'MISSING_TIMELINE' && i.orderId === order.id);
    expect(missingTimelineIssue).toBeDefined();
    expect(missingTimelineIssue?.severity).toBe('WARNING');
  });

  it('should detect DUPLICATE_LEDGER discrepancies', async () => {
    const { order, payment } = await createOrderWithPayment('SUCCESS', 500);

    // Create duplicate matching ledger
    await prisma.ledgerEntry.createMany({
      data: [
        { orderId: order.id, type: 'PAYMENT', status: 'SUCCESS', amount: new Prisma.Decimal(500), notes: 'P1', referenceId: payment.id },
        { orderId: order.id, type: 'PAYMENT', status: 'SUCCESS', amount: new Prisma.Decimal(500), notes: 'P2', referenceId: payment.id }
      ]
    });

    const report = await ReconciliationService.getHealthReport();
    
    // Amount mismatch might also trigger, but we definitely want DUPLICATE_LEDGER
    const duplicateIssue = report.issues.find(i => i.type === 'DUPLICATE_LEDGER' && i.orderId === order.id);
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.severity).toBe('CRITICAL');
  });

  it('should report HEALTHY when all is consistent', async () => {
    const { order, payment } = await createOrderWithPayment('SUCCESS', 500);

    await prisma.ledgerEntry.create({
      data: {
        orderId: order.id,
        type: 'PAYMENT',
        amount: new Prisma.Decimal(500),
        status: 'SUCCESS',
        notes: 'Payment',
        referenceId: payment.id
      }
    });

    await prisma.timeline.create({
      data: {
        orderId: order.id,
        eventType: 'PAYMENT_CAPTURED',
        note: 'Payment captured',
        actorId: 'system',
        status: 'NEW',
        nextState: 'NEW',
        action: 'PAYMENT'
      }
    });

    const report = await ReconciliationService.getHealthReport();
    
    // We only care about this specific order's issues in case DB has other dirty state, 
    // but ideally report.issues for this order is 0.
    const issuesForThisOrder = report.issues.filter(i => i.orderId === order.id);
    expect(issuesForThisOrder).toHaveLength(0);
  });
});
