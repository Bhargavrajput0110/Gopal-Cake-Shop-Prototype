import { prisma } from '@/lib/prisma';
import { Payment, WebhookEvent, Prisma } from '@prisma/client';

export class PaymentRepository {
  async getPaymentById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id }
    });
  }

  async getPaymentByGatewayOrderId(gatewayOrderId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { gatewayOrderId }
    });
  }

  async createPayment(data: Prisma.PaymentUncheckedCreateInput): Promise<Payment> {
    return prisma.payment.create({
      data
    });
  }

  async updatePayment(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data
    });
  }

  async getWebhookEvent(id: string): Promise<WebhookEvent | null> {
    return prisma.webhookEvent.findUnique({
      where: { id }
    });
  }

  async createWebhookEvent(data: Prisma.WebhookEventUncheckedCreateInput): Promise<WebhookEvent> {
    return prisma.webhookEvent.create({
      data
    });
  }

  async markWebhookProcessed(id: string): Promise<WebhookEvent> {
    return prisma.webhookEvent.update({
      where: { id },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });
  }

  async incrementWebhookRetry(id: string): Promise<WebhookEvent> {
    return prisma.webhookEvent.update({
      where: { id },
      data: {
        retryCount: {
          increment: 1
        }
      }
    });
  }
}
