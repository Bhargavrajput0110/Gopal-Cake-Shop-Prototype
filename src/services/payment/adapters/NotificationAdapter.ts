import { prisma } from '@/lib/prisma';
import { NotificationType, NotificationStatus } from '@prisma/client';

export class NotificationAdapter {
  static async sendPaymentSuccess(orderId: string, customerId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer?.phone) return;

    await prisma.notificationLog.create({
      data: {
        orderId,
        recipient: customer.phone,
        channel: NotificationType.WHATSAPP,
        templateName: 'payment_success',
        status: NotificationStatus.PENDING
      }
    });
  }

  static async sendPaymentFailed(orderId: string, customerId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer?.phone) return;

    await prisma.notificationLog.create({
      data: {
        orderId,
        recipient: customer.phone,
        channel: NotificationType.WHATSAPP,
        templateName: 'payment_failed',
        status: NotificationStatus.PENDING
      }
    });
  }

  static async sendRefundProcessed(orderId: string, customerId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer?.phone) return;

    await prisma.notificationLog.create({
      data: {
        orderId,
        recipient: customer.phone,
        channel: NotificationType.WHATSAPP,
        templateName: 'refund_processed',
        status: NotificationStatus.PENDING
      }
    });
  }

  static async notifyBranchManagers(branchId: string, templateName: string, payload: any) {
    // Stub for notifying branch managers. 
    // Usually this would query users for the branch and send them a system notification or email.
    // For now, we will just log it.
    await prisma.notificationLog.create({
      data: {
        orderId: payload.orderId || 'system',
        recipient: `branch-${branchId}-managers`,
        channel: NotificationType.PUSH,
        templateName: templateName,
        status: NotificationStatus.PENDING
      }
    });
  }
}
