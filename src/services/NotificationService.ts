import { prisma } from '@/lib/prisma';
import { LoggerService } from './LoggerService';

export class NotificationService {
  /**
   * Subscribes to the Event Bus (invoked by the Outbox Publisher)
   * This service is NEVER called directly by the OrderService.
   */
  static async handleDomainEvent(eventType: string, payload: any) {
    try {
      switch (eventType) {
        case 'ORDER_CREATED':
          await this.sendCustomerWhatsApp(payload.orderId, 'order_confirmed');
          break;
        case 'ORDER_READY_FOR_PICKUP':
          await this.sendCustomerWhatsApp(payload.orderId, 'order_ready');
          await this.notifyDrivers(payload.branchId, payload.orderId);
          break;
        case 'DRIVER_ASSIGNED':
          await this.sendCustomerWhatsApp(payload.orderId, 'driver_assigned');
          break;
        case 'ORDER_DELIVERED':
          await this.sendCustomerWhatsApp(payload.orderId, 'order_delivered');
          break;
        // Add other event types as needed
      }
    } catch (e: any) {
      LoggerService.error(`Notification failed for event ${eventType}`, e, { payload });
      // Depending on delivery guarantees, we might throw here to trigger DLQ logic in the outbox
    }
  }

  private static async sendCustomerWhatsApp(orderId: string, template: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (order && order.customer) {
      // Mock 3rd party SMS/WA provider
      LoggerService.info(`Sending ${template} via WhatsApp`, { phone: order.customer.phone });
      
      await prisma.notificationLog.create({
        data: {
          orderId,
          recipient: order.customer.phone,
          channel: 'WHATSAPP',
          templateName: template,
          status: 'SENT'
        }
      });
    }
  }

  private static async notifyDrivers(branchId: string, orderId: string) {
    // Mock push notification to active drivers in branch
    LoggerService.info(`Broadcasting push notification to branch drivers`, { branchId, orderId });
  }
}
