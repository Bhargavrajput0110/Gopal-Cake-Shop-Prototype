import { prisma } from '@/lib/prisma';
import { LoggerService } from '@/services/LoggerService';
import { NotificationMatrix } from './NotificationMatrix';
import { NotificationDispatcher } from './NotificationDispatcher';

export class NotificationService {
  /**
   * Main entry point for TIMELINE_CREATED events from the Outbox.
   */
  static async handleTimelineEvent(payload: any, eventId: string) {
    const { action, orderId, actorId, branchId } = payload;
    
    const rules = NotificationMatrix[action];
    if (!rules || rules.length === 0) {
      // No notifications configured for this action
      return;
    }

    // Resolve common metadata needed for dispatch
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) {
      LoggerService.warn(`[NotificationService] Order ${orderId} not found for event ${eventId}`);
      return;
    }

    // For independent retry isolation, we process each rule, catching errors locally.
    // However, if we want the Outbox to retry failed channels, we must throw if ANY channel fails.
    // Or we keep track of successful channels in a separate table, but idempotency handles duplicate sends.
    // So we can safely loop and throw at the end if any failed.
    const errors: Error[] = [];

    for (const rule of rules) {
      try {
        let recipientId: string | undefined;
        let recipientPhone: string | undefined;
        let message = `Order ${order.orderNumber}: ${rule.templateName}`;

        if (rule.recipientRole === 'CUSTOMER' && order.customer) {
          recipientPhone = order.customer.phone;
        }

        if (rule.recipientRole === 'DRIVER_ASSIGNEE') {
          // If action is assign-driver, actorId might be the driver, or actorId is admin and payload has notes with driver?
          // Actually, if driver is assigned, order.driverId is set!
          if (order.driverId) {
            recipientId = order.driverId;
          } else {
             continue; // No driver to notify
          }
        }

        await NotificationDispatcher.dispatch({
          eventId,
          orderId,
          channel: rule.channel,
          recipientRole: rule.recipientRole,
          recipientId,
          recipientPhone,
          templateName: rule.templateName,
          message,
          branchId: branchId || order.branchId // fallback to order branch if timeline doesn't have it
        });
      } catch (err: any) {
        errors.push(err);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Failed to dispatch some notifications for ${eventId}: ${errors.map(e => e.message).join(', ')}`);
    }
  }
}
