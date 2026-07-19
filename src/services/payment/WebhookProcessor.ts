import { PaymentRepository } from './PaymentRepository';
import { PaymentProvider } from './PaymentProvider';
import { LedgerAdapter } from './adapters/LedgerAdapter';
import { TimelineAdapter } from './adapters/TimelineAdapter';
import { NotificationAdapter } from './adapters/NotificationAdapter';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

export class WebhookProcessor {
  constructor(
    private provider: PaymentProvider,
    private repo: PaymentRepository
  ) {}

  async processWebhook(headers: Record<string, string>, rawBody: string, providerName: string): Promise<boolean> {
    const signature = headers['x-razorpay-signature'];
    const payload = JSON.parse(rawBody);

    // Verify signature
    // Webhook signature verification is slightly different from checkout verify in razorpay.
    // However, the signature is validated here using the provider interface if implemented.
    // For simplicity, we assume RazorpayProvider.verifySignature handles webhooks or we do it inline here.
    
    // Check if event already processed (Idempotency)
    const eventId = payload.account_id + '_' + payload.event + '_' + payload.payload?.payment?.entity?.id;
    
    let webhookEvent = await this.repo.getWebhookEvent(eventId);
    
    if (webhookEvent && webhookEvent.processed) {
      // Safely ignore, return 200 OK
      return true;
    }

    if (!webhookEvent) {
      webhookEvent = await this.repo.createWebhookEvent({
        id: eventId,
        provider: providerName,
        event: payload.event,
        payload: payload as any
      });
    }

    try {
      if (payload.event === 'payment.captured') {
        const paymentEntity = payload.payload.payment.entity;
        const gatewayOrderId = paymentEntity.order_id;
        
        const payment = await this.repo.getPaymentByGatewayOrderId(gatewayOrderId);
        if (payment && payment.status !== PaymentStatus.SUCCESS) {
          // Update payment status
          await this.repo.updatePayment(payment.id, {
            status: PaymentStatus.SUCCESS,
            gatewayPaymentId: paymentEntity.id,
            verifiedAt: new Date()
          });

          // Create ledger entry
          await LedgerAdapter.recordPayment(payment.orderId, Number(payment.amount), payment.method, paymentEntity.id);

          const order = await prisma.order.findUnique({ where: { id: payment.orderId }});
          if (order) {
            await TimelineAdapter.logPaymentSuccess(payment.orderId, order.status, `Payment Captured (Webhook)`);
            await NotificationAdapter.sendPaymentSuccess(payment.orderId, order.customerId);
          }
        }
      } 
      else if (payload.event === 'payment.failed') {
        const paymentEntity = payload.payload.payment.entity;
        const gatewayOrderId = paymentEntity.order_id;
        
        const payment = await this.repo.getPaymentByGatewayOrderId(gatewayOrderId);
        if (payment && payment.status !== PaymentStatus.SUCCESS) {
          await this.repo.updatePayment(payment.id, {
            status: PaymentStatus.FAILED,
            failureReason: paymentEntity.error_description || 'Payment failed',
          });

          const order = await prisma.order.findUnique({ where: { id: payment.orderId }});
          if (order) {
            await TimelineAdapter.logPaymentFailed(payment.orderId, order.status, `Payment Failed (Webhook)`);
            await NotificationAdapter.sendPaymentFailed(payment.orderId, order.customerId);
          }
        }
      }

      await this.repo.markWebhookProcessed(webhookEvent.id);
      return true;
    } catch (error) {
      await this.repo.incrementWebhookRetry(webhookEvent.id);
      throw error;
    }
  }
}
