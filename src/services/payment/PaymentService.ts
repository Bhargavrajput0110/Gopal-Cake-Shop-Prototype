import { PaymentProvider } from './PaymentProvider';
import { PaymentRepository } from './PaymentRepository';
import { RefundService } from './RefundService';
import { WebhookProcessor } from './WebhookProcessor';
import { LedgerAdapter } from './adapters/LedgerAdapter';
import { TimelineAdapter } from './adapters/TimelineAdapter';
import { NotificationAdapter } from './adapters/NotificationAdapter';
import { prisma } from '../../lib/prisma';
import { PaymentStatus } from '@prisma/client';

export interface ReconciliationSummary {
  scanned: number;
  recovered: number;
  failed: number;
  skipped: number;
  alreadyProcessed: number;
  durationMs: number;
}

export class PaymentService {
  private refundService: RefundService;
  private webhookProcessor: WebhookProcessor;

  constructor(
    private provider: PaymentProvider,
    private repo: PaymentRepository
  ) {
    this.refundService = new RefundService(provider, repo);
    this.webhookProcessor = new WebhookProcessor(provider, repo);
  }

  async createPaymentOrder(orderId: string, amount: number, method: any) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    const gatewayOrder = await this.provider.createOrder({
      amount: amount * 100, // Converting to paise
      currency: 'INR',
      receipt: order.orderNumber
    });

    const payment = await this.repo.createPayment({
      orderId,
      amount,
      method,
      type: 'FULL',
      status: PaymentStatus.PENDING,
      provider: 'RAZORPAY',
      gatewayOrderId: gatewayOrder.id
    });

    await TimelineAdapter.recordEvent(orderId, 'PAYMENT_PENDING', order.status, order.status, 'Payment Link Created');

    return { payment, gatewayOrder };
  }

  async verifyPayment(paymentId: string, gatewayOrderId: string, gatewayPaymentId: string, signature: string) {
    const payment = await this.repo.getPaymentById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status === PaymentStatus.SUCCESS) return payment; // Already verified by webhook

    const isValid = this.provider.verifySignature({
      razorpayOrderId: gatewayOrderId,
      razorpayPaymentId: gatewayPaymentId,
      razorpaySignature: signature
    });

    if (!isValid) {
      await this.repo.updatePayment(paymentId, {
        status: PaymentStatus.FAILED,
        failureReason: 'Signature mismatch on client verification'
      });
      throw new Error('Invalid signature');
    }

    // Only update if it wasn't already updated by webhook in a race condition
    const updatedPayment = await this.repo.updatePayment(paymentId, {
      status: PaymentStatus.SUCCESS,
      gatewayPaymentId: gatewayPaymentId,
      verifiedAt: new Date()
    });

    // We let the webhook handle the Ledger and Notification, or we can handle it here conditionally.
    // For safety, we check if the webhook already did it by checking the payment status above.
    await LedgerAdapter.recordPayment(payment.orderId, Number(payment.amount), payment.method, gatewayPaymentId);
    
    const order = await prisma.order.findUnique({ where: { id: payment.orderId }});
    if (order) {
      await TimelineAdapter.logPaymentSuccess(payment.orderId, order.status, `Payment Verified by Client`);
      await NotificationAdapter.sendPaymentSuccess(payment.orderId, order.customerId);
    }

    return updatedPayment;
  }

  async processRefund(paymentId: string, amount?: number, reason?: string) {
    return this.refundService.processRefund(paymentId, amount, reason);
  }

  async processWebhook(headers: Record<string, string>, rawBody: string, providerName: string) {
    return this.webhookProcessor.processWebhook(headers, rawBody, providerName);
  }

  async reconcilePendingPayments(): Promise<ReconciliationSummary> {
    const lockKey = 94827361; // Arbitrary 32-bit int for advisory lock
    const lockResult = await prisma.$queryRaw<Array<{ pg_try_advisory_lock: boolean }>>`SELECT pg_try_advisory_lock(${lockKey})`;
    const lockAcquired = lockResult[0]?.pg_try_advisory_lock;

    if (!lockAcquired) {
      console.log('Reconciliation job is already running (lock not acquired).');
      return { scanned: 0, recovered: 0, failed: 0, skipped: 0, alreadyProcessed: 0, durationMs: 0 };
    }

    const startTime = Date.now();
    const summary: ReconciliationSummary = {
      scanned: 0,
      recovered: 0,
      failed: 0,
      skipped: 0,
      alreadyProcessed: 0,
      durationMs: 0
    };

    try {
      // Find payments PENDING and older than 15 minutes
      const pendingPayments = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          provider: 'RAZORPAY',
          gatewayOrderId: { not: null },
          createdAt: {
            lt: new Date(Date.now() - 15 * 60 * 1000) // Older than 15 mins
          }
        },
        include: { order: true }
      });

      summary.scanned = pendingPayments.length;
      
      const timeoutMinutes = Number(process.env.PAYMENT_PENDING_TIMEOUT_MINUTES) || 30;
      const timeoutThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      for (const payment of pendingPayments) {
        // Double check status to ensure no race conditions occurred between query and processing
        const currentPayment = await prisma.payment.findUnique({ where: { id: payment.id }});
        if (currentPayment?.status !== PaymentStatus.PENDING) {
          summary.alreadyProcessed++;
          continue;
        }

        const gatewayOrderId = payment.gatewayOrderId as string;
        const attempts = await this.provider.fetchOrderPayments(gatewayOrderId);

        const successfulAttempt = attempts.find((a: any) => a.status === 'captured' || a.status === 'authorized');
        
        if (successfulAttempt) {
          // Recover the payment
          await this.repo.updatePayment(payment.id, {
            status: PaymentStatus.SUCCESS,
            gatewayPaymentId: successfulAttempt.id,
            verifiedAt: new Date()
          });

          await LedgerAdapter.recordPayment(payment.orderId, Number(payment.amount), payment.method, successfulAttempt.id);
          
          await TimelineAdapter.recordEvent(
            payment.orderId,
            'PAYMENT_CAPTURED',
            payment.order.status,
            payment.order.status,
            `Payment automatically recovered by reconciliation job`
          );

          await prisma.auditLog.create({
            data: {
              action: 'AUTO_RECONCILE',
              tableName: 'Payment',
              recordId: payment.id,
              newValue: { gatewayPaymentId: successfulAttempt.id },
              createdAt: new Date()
            }
          });

          if (payment.order.branchId) {
            await NotificationAdapter.notifyBranchManagers(
              payment.order.branchId,
              'PAYMENT_RECOVERED',
              { paymentId: payment.id, orderId: payment.orderId }
            );
          }

          summary.recovered++;
        } else {
          // If no successful attempt, check if timeout expired
          const allFailed = attempts.every((a: any) => a.status === 'failed');
          const hasExpired = payment.createdAt < timeoutThreshold;

          if (hasExpired && (attempts.length === 0 || allFailed)) {
            await this.repo.updatePayment(payment.id, {
              status: PaymentStatus.FAILED,
              failureReason: 'Reconciliation timeout expired with no successful payments'
            });

            // Also cancel the order since the online payment failed and timed out
            await prisma.order.update({
              where: { id: payment.orderId },
              data: {
                status: 'CANCELLED',
                internalNotes: 'Auto-cancelled due to payment timeout'
              }
            });

            await TimelineAdapter.recordEvent(
              payment.orderId,
              'PAYMENT_FAILED',
              payment.order.status,
              'CANCELLED',
              `Payment failed after retry window expired. Order auto-cancelled.`
            );
            
            summary.failed++;
          } else {
            summary.skipped++; // Still in retry window
          }
        }
      }
    } finally {
      await prisma.$executeRaw`SELECT pg_advisory_unlock(${lockKey})`;
      summary.durationMs = Date.now() - startTime;
    }

    return summary;
  }
}
