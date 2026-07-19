import { PaymentProvider } from './PaymentProvider';
import { PaymentRepository } from './PaymentRepository';
import { LedgerAdapter } from './adapters/LedgerAdapter';
import { TimelineAdapter } from './adapters/TimelineAdapter';
import { NotificationAdapter } from './adapters/NotificationAdapter';
import { AuditAdapter } from './adapters/AuditAdapter';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

export class RefundService {
  constructor(
    private provider: PaymentProvider,
    private repo: PaymentRepository
  ) {}

  async processRefund(paymentId: string, amount?: number, reason?: string) {
    const payment = await this.repo.getPaymentById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (!payment.gatewayPaymentId) throw new Error('Cannot refund payment without gateway payment ID');
    
    // Call provider to process refund
    const refund = await this.provider.refund({
      paymentId: payment.gatewayPaymentId,
      amount,
      notes: { reason: reason || 'Customer requested' }
    });

    // Update Payment record
    const updatedPayment = await this.repo.updatePayment(paymentId, {
      status: PaymentStatus.SUCCESS, // The payment itself is still success, but we log the refund
      gatewayRefundId: refund.id,
      refundedAt: new Date()
    });

    const order = await prisma.order.findUnique({ where: { id: payment.orderId }});
    if (!order) return updatedPayment;

    // Record Ledger Debit
    await LedgerAdapter.recordRefund(payment.orderId, Number(amount || payment.amount), payment.method, refund.id);

    // Record Timeline
    await TimelineAdapter.logPaymentRefunded(payment.orderId, order.status, `Refund ${refund.id} processed for amount ${amount || payment.amount}`);

    // Trigger Notification
    await NotificationAdapter.sendRefundProcessed(payment.orderId, order.customerId);

    // Audit Log
    await AuditAdapter.log('PAYMENT_REFUNDED', paymentId, { refundId: refund.id, amount: amount || payment.amount }, reason);

    return updatedPayment;
  }
}
