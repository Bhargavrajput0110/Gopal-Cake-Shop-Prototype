/**
 * NotificationService — V4 Architecture
 *
 * Entry point called by EventSubscribers when a TIMELINE_CREATED outbox event fires.
 * Reads the NotificationMatrix for the triggering action, then dispatches each rule.
 *
 * For WHATSAPP channel: builds the canonical OrderNotificationData DTO via
 * NotificationDataAggregator before calling NotificationDispatcher.
 *
 * The existing EventSubscribers → NotificationService.handleTimelineEvent() call
 * chain is preserved — only the internals of this service have changed.
 */

import { LoggerService } from '@/services/LoggerService';
import { NotificationMatrix } from './NotificationMatrix';
import { NotificationDispatcher } from './NotificationDispatcher';
import { NotificationDataAggregator } from './NotificationDataAggregator';

export class NotificationService {
  /**
   * Main entry point for TIMELINE_CREATED events from the Outbox.
   * Called by EventSubscribers with the full timeline payload.
   *
   * The `eventId` comes from the Outbox row — it is the Timeline.id,
   * guaranteeing deterministic idempotency keys.
   */
  static async handleTimelineEvent(payload: any, eventId: string) {
    const { action, orderId, actorId, branchId, nextState } = payload;

    const rules = NotificationMatrix[action];
    if (!rules || rules.length === 0) {
      LoggerService.info(`[NotificationService] No rules for action: ${action}`);
      return;
    }

    // Determine if any rule needs WhatsApp (requires full DTO build)
    const hasWhatsAppRule = rules.some((r) => r.channel === 'WHATSAPP');

    // Build canonical DTO once — only if WhatsApp is needed
    let orderData: import('./NotificationDataAggregator').OrderNotificationData | undefined;
    if (hasWhatsAppRule && orderId) {
      const built = await NotificationDataAggregator.build(orderId);
      orderData = built ?? undefined;
      if (!orderData) {
        LoggerService.warn(`[NotificationService] Could not build notification data for order ${orderId}. Skipping WhatsApp.`);
        // Still proceed with IN_APP rules
      }
    }

    // Guard: skip WhatsApp entirely if DTO build failed
    const effectiveRules = orderData
      ? rules
      : rules.filter((r) => r.channel !== 'WHATSAPP');

    const errors: Error[] = [];

    for (const rule of effectiveRules) {
      try {
        let recipientId: string | undefined;
        let recipientPhone: string | undefined;
        const msg = `Order ${payload.orderNumber || orderId}: ${rule.templateName}`;

        if (rule.recipientRole === 'CUSTOMER' && orderData) {
          recipientPhone = orderData.customer.phone;
        }

        if (rule.recipientRole === 'DRIVER_ASSIGNEE') {
          // Driver ID is stored on the order after assignment
          if (payload.driverId) {
            recipientId = payload.driverId;
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
          message: msg,
          branchId: branchId || payload.branchId,
          orderData: rule.channel === 'WHATSAPP' ? orderData : undefined,
          eventTimestamp: payload.createdAt ? new Date(payload.createdAt) : new Date(),
        });
      } catch (err: any) {
        errors.push(err);
      }
    }

    if (errors.length > 0) {
      // Throw so OutboxProcessor marks this event as FAILED and retries
      throw new Error(
        `[NotificationService] Failed to dispatch some rules for event ${eventId}: ${errors.map((e) => e.message).join(', ')}`
      );
    }
  }
}
