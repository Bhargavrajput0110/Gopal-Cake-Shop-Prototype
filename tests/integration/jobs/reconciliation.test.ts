import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../../../src/lib/prisma';
import { PaymentService } from '../../../src/services/payment/PaymentService';
import { RazorpayProvider } from '../../../src/services/payment/providers/RazorpayProvider';
import { PaymentRepository } from '../../../src/services/payment/PaymentRepository';

describe('Real PostgreSQL Integration Suite - Reconciliation Job', () => {
  let paymentService: PaymentService;
  let mockProvider: any;

  beforeEach(async () => {
    // Clear relevant tables
    await prisma.notificationLog.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.timeline.deleteMany();
    await prisma.ledgerEntry.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.branch.deleteMany();

    await prisma.branch.create({
      data: {
        id: 'test-branch',
        name: 'Test Branch',
        code: 'TB-1',
        isActive: true,
        address: '123 Test St'
      }
    });

    // Mock Provider
    mockProvider = new RazorpayProvider();
    vi.spyOn(mockProvider, 'fetchOrderPayments').mockResolvedValue([]);
    const repo = new PaymentRepository();
    paymentService = new PaymentService(mockProvider, repo);
  }, 30000);

  const setupOrder = async (orderId: string, paymentId: string, createdAt: Date, gatewayOrderId: string) => {
    const customer = await prisma.customer.create({
      data: { id: `cust-${orderId}`, name: 'Test', phone: `999${orderId.slice(0, 7)}` }
    });

    await prisma.order.create({
      data: {
        id: orderId,
        orderNumber: `ORD-${orderId}`,
        customerId: customer.id,
        branchId: 'test-branch',
        subtotal: 1000,
        totalAmount: 1000,
        type: 'ORDER',
        deliveryType: 'DELIVERY',
        status: 'NEW',
        targetDate: new Date()
      }
    });

    await prisma.payment.create({
      data: {
        id: paymentId,
        orderId: orderId,
        amount: 1000,
        method: 'RAZORPAY',
        type: 'FULL',
        provider: 'RAZORPAY',
        status: 'PENDING',
        gatewayOrderId: gatewayOrderId,
        createdAt: createdAt
      }
    });
  };

  it('successfully recovers a payment if a captured attempt is found', async () => {
    // Create an order 30 minutes old
    const pastDate = new Date(Date.now() - 30 * 60 * 1000);
    await setupOrder('ord-rec-1', 'pay-rec-1', pastDate, 'gw-ord-1');

    mockProvider.fetchOrderPayments.mockResolvedValue([
      { id: 'gw-pay-1', status: 'captured' }
    ]);

    const result = await paymentService.reconcilePendingPayments();
    expect(result.scanned).toBe(1);
    expect(result.recovered).toBe(1);

    // Verify DB
    const payment = await prisma.payment.findUnique({ where: { id: 'pay-rec-1' }});
    expect(payment?.status).toBe('SUCCESS');
    expect(payment?.gatewayPaymentId).toBe('gw-pay-1');

    const ledger = await prisma.ledgerEntry.findFirst({ where: { orderId: 'ord-rec-1' }});
    expect(ledger).toBeDefined();
    expect(ledger?.amount.toNumber()).toBe(1000);

    const timeline = await prisma.timeline.findFirst({ where: { orderId: 'ord-rec-1', eventType: 'PAYMENT_CAPTURED' }});
    expect(timeline).toBeDefined();
  });

  it('selects the captured payment if multiple attempts exist (failed -> failed -> captured)', async () => {
    const pastDate = new Date(Date.now() - 30 * 60 * 1000);
    await setupOrder('ord-rec-2', 'pay-rec-2', pastDate, 'gw-ord-2');

    mockProvider.fetchOrderPayments.mockResolvedValue([
      { id: 'gw-pay-2a', status: 'failed' },
      { id: 'gw-pay-2b', status: 'failed' },
      { id: 'gw-pay-2c', status: 'captured' }
    ]);

    const result = await paymentService.reconcilePendingPayments();
    expect(result.recovered).toBe(1);

    const payment = await prisma.payment.findUnique({ where: { id: 'pay-rec-2' }});
    expect(payment?.status).toBe('SUCCESS');
    expect(payment?.gatewayPaymentId).toBe('gw-pay-2c');
  });

  it('fails payment if timeout window expired and all attempts failed', async () => {
    // 60 minutes old (past the 30 min timeout)
    const pastDate = new Date(Date.now() - 60 * 60 * 1000);
    await setupOrder('ord-rec-3', 'pay-rec-3', pastDate, 'gw-ord-3');

    mockProvider.fetchOrderPayments.mockResolvedValue([
      { id: 'gw-pay-3a', status: 'failed' }
    ]);

    const result = await paymentService.reconcilePendingPayments();
    expect(result.failed).toBe(1);

    const payment = await prisma.payment.findUnique({ where: { id: 'pay-rec-3' }});
    expect(payment?.status).toBe('FAILED');
    expect(payment?.failureReason).toContain('timeout expired');
  });

  it('keeps payment pending if inside timeout window (no successful attempts yet)', async () => {
    // Only 20 minutes old (inside the 30 min window, but > 15 mins for scanning)
    const pastDate = new Date(Date.now() - 20 * 60 * 1000);
    await setupOrder('ord-rec-4', 'pay-rec-4', pastDate, 'gw-ord-4');

    mockProvider.fetchOrderPayments.mockResolvedValue([
      { id: 'gw-pay-4a', status: 'failed' }
    ]);

    const result = await paymentService.reconcilePendingPayments();
    expect(result.skipped).toBe(1);

    const payment = await prisma.payment.findUnique({ where: { id: 'pay-rec-4' }});
    expect(payment?.status).toBe('PENDING'); // No change!
  });

  it('is idempotent and skips already processed payments safely', async () => {
    const pastDate = new Date(Date.now() - 30 * 60 * 1000);
    await setupOrder('ord-rec-5', 'pay-rec-5', pastDate, 'gw-ord-5');

    mockProvider.fetchOrderPayments.mockResolvedValue([
      { id: 'gw-pay-5a', status: 'captured' }
    ]);

    // Run First Time
    const result1 = await paymentService.reconcilePendingPayments();
    expect(result1.recovered).toBe(1);

    // Run Second Time
    const result2 = await paymentService.reconcilePendingPayments();
    expect(result2.scanned).toBe(0); // Query filters out SUCCESS payments!

    // Verify side effects weren't duplicated
    const ledgers = await prisma.ledgerEntry.findMany({ where: { orderId: 'ord-rec-5' }});
    expect(ledgers.length).toBe(1);

    const timelines = await prisma.timeline.findMany({ where: { orderId: 'ord-rec-5', eventType: 'PAYMENT_CAPTURED' }});
    expect(timelines.length).toBe(1);
  });
});
