/**
 * NotificationDispatcher — V4 Architecture
 *
 * Dispatches a single notification rule to the appropriate channel.
 *
 * For WHATSAPP channel:
 *  1. Idempotency check via NotificationLog.eventId (unique constraint)
 *  2. SENDING lock (advisory)
 *  3. Image upload if _img template selected
 *  4. Meta Cloud API call via WhatsAppProvider
 *  5. Granular status recording (SENT / FAILED_RETRYABLE / FAILED_FINAL / UNKNOWN)
 *
 * For IN_APP channel: existing in-app notification + web push logic is preserved.
 * For PUSH channel: existing web push logic is preserved.
 *
 * The OutboxProcessor controls retry. This dispatcher does NOT retry itself.
 * UNKNOWN outcomes are flagged but not auto-retried.
 */

import { prisma } from '@/lib/prisma';
import { LoggerService } from '@/services/LoggerService';
import webpush from 'web-push';
import type { OrderNotificationData } from './NotificationDataAggregator';
import { WhatsAppTemplateService, type NotificationType } from './WhatsAppTemplateService';
import { createWhatsAppProvider } from './providers/WhatsAppProvider';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@bakeryos.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export class NotificationDispatcher {
  /**
   * Dispatch a single notification rule.
   * Throws on unrecoverable errors so the OutboxProcessor can handle retry/DLQ.
   */
  static async dispatch(params: {
    eventId: string;
    orderId?: string;
    channel: 'WHATSAPP' | 'SMS' | 'PUSH' | 'IN_APP';
    recipientRole: string;
    recipientId?: string;
    recipientPhone?: string;
    templateName: string;   // NotificationType for WHATSAPP; label for IN_APP
    message?: string;
    branchId?: string;
    /** Canonical DTO — required for WHATSAPP channel */
    orderData?: OrderNotificationData;
    /** Timestamp of the triggering event — used in templates that display completion time */
    eventTimestamp?: Date;
  }) {
    const {
      eventId,
      orderId,
      channel,
      recipientRole,
      recipientId,
      recipientPhone,
      templateName,
      message,
      branchId,
      orderData,
      eventTimestamp,
    } = params;

    // Build unique key per channel + role combination for idempotency
    const uniqueEventId = `${eventId}_${channel}_${recipientRole}_${recipientId || 'broadcast'}`;

    try {
      // ── IN_APP ──────────────────────────────────────────────────────────────
      if (channel === 'IN_APP') {
        await this.dispatchInApp({
          uniqueEventId,
          recipientId,
          recipientRole,
          branchId,
          orderId,
          templateName,
          message,
        });
        return;
      }

      // ── WHATSAPP ───────────────────────────────────────────────────────────
      if (channel === 'WHATSAPP') {
        const phone = recipientPhone;
        if (!phone) {
          LoggerService.warn(`[NotificationDispatcher] WHATSAPP skipped — no phone for role ${recipientRole}, event ${eventId}`);
          return;
        }

        if (!orderData) {
          LoggerService.warn(`[NotificationDispatcher] WHATSAPP skipped — no orderData for event ${eventId}`);
          return;
        }

        await this.dispatchWhatsApp({
          uniqueEventId,
          orderId,
          phone,
          notificationType: templateName as NotificationType,
          orderData,
          eventTimestamp,
        });
        return;
      }

      // ── PUSH (existing behaviour) ──────────────────────────────────────────
      if (channel === 'PUSH' && recipientId) {
        const subs = await prisma.pushSubscription.findMany({ where: { userId: recipientId } });
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
              JSON.stringify({ title: templateName, body: message || templateName, url: orderId ? `/order/${orderId}` : '/' })
            );
          } catch (pushErr: any) {
            if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            } else {
              LoggerService.warn(`[NotificationDispatcher] WebPush failed for sub ${sub.id}: ${pushErr.message}`);
            }
          }
        }
      }
    } catch (error) {
      LoggerService.error(`[NotificationDispatcher] Failed to dispatch ${channel} for event ${eventId}`, error);
      throw error; // Let OutboxProcessor handle retry
    }
  }

  // ─── Private: WhatsApp dispatch ─────────────────────────────────────────────

  private static async dispatchWhatsApp(params: {
    uniqueEventId: string;
    orderId?: string;
    phone: string;
    notificationType: NotificationType;
    orderData: OrderNotificationData;
    eventTimestamp?: Date;
  }) {
    const { uniqueEventId, orderId, phone, notificationType, orderData, eventTimestamp } = params;

    // 1. Resolve template selection
    const selection = WhatsAppTemplateService.resolve(notificationType, orderData, eventTimestamp);

    // 2. Idempotency check — attempt to insert with PENDING status
    let logId: string;
    try {
      const log = await prisma.notificationLog.create({
        data: {
          eventId: uniqueEventId,
          orderId,
          recipient: phone,
          channel: 'WHATSAPP',
          templateName: selection.templateName,
          templateVersion: selection.templateVersion,
          status: 'PENDING',
        },
      });
      logId = log.id;
    } catch (err: any) {
      if (err.code === 'P2002') {
        // Unique constraint — already processed or in progress
        LoggerService.info(`[NotificationDispatcher] Idempotent skip — already logged: ${uniqueEventId}`);
        return;
      }
      throw err;
    }

    // 3. Set SENDING lock to prevent concurrent duplicate dispatches
    await prisma.notificationLog.update({
      where: { id: logId },
      data: { status: 'SENDING' },
    });

    // 4. Obtain WhatsApp provider
    const provider = createWhatsAppProvider();
    if (!provider) {
      LoggerService.info(`[NotificationDispatcher] WHATSAPP skipped — credentials not configured. Template: ${selection.templateName}`);
      await prisma.notificationLog.update({
        where: { id: logId },
        data: { status: 'FAILED_FINAL', errorMessage: 'WHATSAPP_ACCESS_TOKEN not configured' },
      });
      return;
    }

    // 5. Upload image if this is an _img template variant
    let mediaId: string | undefined;
    let providerMediaId: string | undefined;

    if (selection.imageUrl) {
      try {
        const uploadResult = await provider.uploadMedia(selection.imageUrl);
        mediaId = uploadResult.providerMediaId;
        providerMediaId = uploadResult.providerMediaId;

        // Record the media info immediately
        await prisma.notificationLog.update({
          where: { id: logId },
          data: {
            mediaType: selection.imageType === 'REFERENCE' ? 'REFERENCE_IMAGE' : 'PRODUCT_IMAGE',
            mediaSourceUrl: selection.imageUrl,
            providerMediaId,
          },
        });
      } catch (uploadErr: any) {
        LoggerService.error(`[NotificationDispatcher] Media upload failed. Notification will likely fail if Meta template requires an image header.`, uploadErr);
        mediaId = undefined;
      }
    }

    // 6. Send the template
    const result = await provider.sendTemplate({
      phone,
      templateName: selection.templateName,
      templateVersion: selection.templateVersion,
      language: selection.language,
      variables: selection.variables,
      mediaId,
    });

    // 7. Record outcome
    if (result.success) {
      await prisma.notificationLog.update({
        where: { id: logId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          providerMessageId: result.providerMessageId,
        },
      });
      LoggerService.info(`[NotificationDispatcher] SENT ${selection.templateName} to ${phone}. wamid=${result.providerMessageId}`);
    } else if (result.retryable === true) {
      await prisma.notificationLog.update({
        where: { id: logId },
        data: { status: 'FAILED_RETRYABLE', errorMessage: result.error, retryCount: { increment: 1 } },
      });
      // Throw so OutboxProcessor can retry this event (up to MAX_RETRIES)
      throw new Error(`[WhatsApp] Retryable failure for ${selection.templateName}: ${result.error}`);
    } else if (result.retryable === false) {
      await prisma.notificationLog.update({
        where: { id: logId },
        data: { status: 'FAILED_FINAL', errorMessage: result.error },
      });
      LoggerService.error(`[NotificationDispatcher] FAILED_FINAL ${selection.templateName}: ${result.error}`);
      // Do not throw — permanent failure should not cause infinite OutboxProcessor retries
    } else {
      // retryable === undefined → UNKNOWN (timeout / no response)
      await prisma.notificationLog.update({
        where: { id: logId },
        data: { status: 'UNKNOWN', errorMessage: result.error || 'Provider timeout — outcome unknown' },
      });
      LoggerService.warn(`[NotificationDispatcher] UNKNOWN outcome for ${selection.templateName} to ${phone}. Manual review required.`);
      // Do NOT throw — do not auto-retry UNKNOWN outcomes
    }
  }

  // ─── Private: In-App dispatch ────────────────────────────────────────────────

  /**
   * Maps virtual/shorthand role names from NotificationMatrix to actual Prisma Role enum values.
   * The matrix uses short names for readability; Prisma requires exact enum values.
   */
  private static resolveRoleToPrismaEnum(role: string): string[] {
    const map: Record<string, string[]> = {
      'SALES': ['SALESPERSON'],
      'SALESPERSON': ['SALESPERSON'],
      'MANAGER': ['MANAGER'],
      'ADMIN': ['ADMIN'],
      'CHEF': ['CHEF'],
      'DELIVERY': ['DELIVERY'],
      'BRANCH_STAFF': ['SALESPERSON', 'MANAGER', 'CHEF', 'DELIVERY'],
    };
    return map[role] ?? [role];
  }

  private static async dispatchInApp(params: {
    uniqueEventId: string;
    recipientId?: string;
    recipientRole: string;
    branchId?: string;
    orderId?: string;
    templateName: string;
    message?: string;
  }) {
    const { uniqueEventId, recipientId, recipientRole, branchId, orderId, templateName, message } = params;

    let targetUserIds: string[] = [];

    if (recipientId) {
      // DRIVER_ASSIGNEE — already a specific user ID passed as recipientId
      targetUserIds = [recipientId];
    } else {
      const roles = this.resolveRoleToPrismaEnum(recipientRole);
      if (branchId) {
        const users = await prisma.user.findMany({
          where: { branchId, role: { in: roles as any[] } },
        });
        targetUserIds = users.map((u) => u.id);
      } else {
        const users = await prisma.user.findMany({
          where: { role: { in: roles as any[] } },
        });
        targetUserIds = users.map((u) => u.id);
      }
    }

    const linkUrl = orderId ? `/order/${orderId}` : undefined;

    for (const uid of targetUserIds) {
      const userEventId = `${uniqueEventId}_${uid}`;

      const pref = await prisma.notificationPreference.findUnique({ where: { userId: uid } });
      if (pref && !pref.inAppEnabled) continue;

      try {
        const inApp = await prisma.inAppNotification.create({
          data: {
            eventId: userEventId,
            userId: uid,
            title: templateName,
            message: message || `Update for order ${orderId}`,
            priority: 'NORMAL',
            linkUrl,
          },
        });

        // Web push if enabled
        if (!pref || pref.pushEnabled) {
          const subs = await prisma.pushSubscription.findMany({ where: { userId: uid } });
          for (const sub of subs) {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
                JSON.stringify({ title: inApp.title, body: inApp.message, url: linkUrl || '/' })
              );
            } catch (pushErr: any) {
              if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
                await prisma.pushSubscription.delete({ where: { id: sub.id } });
              }
            }
          }
        }
      } catch (err: any) {
        if (err.code !== 'P2002') throw err; // Ignore duplicate — idempotency
      }
    }
  }
}
