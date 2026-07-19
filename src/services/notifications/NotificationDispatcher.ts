import { prisma } from '@/lib/prisma';
import { LoggerService } from '@/services/LoggerService';
import webpush from 'web-push';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@bakeryos.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export class NotificationDispatcher {
  /**
   * Dispatches a notification via the specified channel.
   * Note: We log the intention in NotificationLog or InAppNotification.
   * If this function throws, the OutboxProcessor will mark it as FAILED and retry.
   */
  static async dispatch(params: {
    eventId: string;
    orderId?: string;
    channel: 'WHATSAPP' | 'SMS' | 'PUSH' | 'IN_APP';
    recipientRole: string;
    recipientId?: string; // Optional specific user ID
    recipientPhone?: string; // Optional specific phone number
    templateName: string;
    message?: string;
    branchId?: string; // Used to broadcast to roles in a branch
  }) {
    const { eventId, orderId, channel, recipientRole, recipientId, recipientPhone, templateName, message, branchId } = params;

    // Build unique event ID per channel + role combination to guarantee channel isolation idempotency
    const uniqueEventId = `${eventId}_${channel}_${recipientRole}_${recipientId || 'broadcast'}`;

    try {
      if (channel === 'IN_APP') {
        // Resolve users to receive in-app notification
        let targetUserIds: string[] = [];

        if (recipientId) {
          targetUserIds = [recipientId];
        } else if (branchId) {
          // Broadcast to everyone in branch with that role
          const users = await prisma.user.findMany({
            where: { branchId, role: recipientRole as any }
          });
          targetUserIds = users.map(u => u.id);
        } else {
          // Broadcast globally to role
          const users = await prisma.user.findMany({
            where: { role: recipientRole as any }
          });
          targetUserIds = users.map(u => u.id);
        }

        if (targetUserIds.length > 0) {
          // Because createMany doesn't return created records and we want idempotency, 
          // we should ideally loop or handle constraints. But InAppNotification has eventId now.
          // Since it's a 1-to-many relationship (1 event -> N users), we should append userId to eventId
          for (const uid of targetUserIds) {
            const userEventId = `${uniqueEventId}_${uid}`;
            
            // Check preferences
            const pref = await prisma.notificationPreference.findUnique({ where: { userId: uid }});
            if (pref && !pref.inAppEnabled) {
               continue; // User opted out of all app notifications
            }

            // Determine linkUrl
            let linkUrl = undefined;
            if (orderId) {
              linkUrl = `/order/${orderId}`;
            }

            try {
              const inApp = await prisma.inAppNotification.create({
                data: {
                  eventId: userEventId,
                  userId: uid,
                  title: templateName,
                  message: message || `Update for order ${orderId}`,
                  priority: 'NORMAL',
                  linkUrl
                }
              });

              // Also trigger Web Push if enabled
              if (!pref || pref.pushEnabled) {
                 const subs = await prisma.pushSubscription.findMany({ where: { userId: uid } });
                 for (const sub of subs) {
                   try {
                     await webpush.sendNotification({
                       endpoint: sub.endpoint,
                       keys: { auth: sub.auth, p256dh: sub.p256dh }
                     }, JSON.stringify({ 
                       title: inApp.title, 
                       body: inApp.message,
                       url: linkUrl || '/'
                     }));
                   } catch (pushErr: any) {
                     if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
                        // Subscription expired or unsubscribed, clean it up
                        await prisma.pushSubscription.delete({ where: { id: sub.id }});
                     } else {
                        LoggerService.warn(`[WebPush] Failed for sub ${sub.id}: ${pushErr.message}`);
                     }
                   }
                 }
              }

            } catch (err: any) {
              if (err.code !== 'P2002') throw err; // Ignore unique constraint violations (idempotency)
            }
          }
        }
      } else {
        // PUSH, WHATSAPP, SMS -> Log into NotificationLog
        let targetRecipient = recipientId || recipientRole;
        if (channel === 'WHATSAPP' && recipientPhone) {
          targetRecipient = recipientPhone;
        }

        try {
          await prisma.notificationLog.create({
            data: {
              eventId: uniqueEventId,
              orderId,
              recipient: targetRecipient,
              channel: channel,
              templateName: templateName,
              status: 'SENT'
            }
          });
          LoggerService.info(`[NotificationDispatcher] Dispatched ${channel} to ${targetRecipient}: ${templateName}`);
        } catch (err: any) {
          if (err.code !== 'P2002') throw err; // Ignore unique constraint violations (idempotency)
          LoggerService.info(`[NotificationDispatcher] Idempotent skip for ${channel} to ${targetRecipient}: ${templateName}`);
        }
      }
    } catch (error) {
      LoggerService.error(`[NotificationDispatcher] Failed to dispatch ${channel} for event ${eventId}`, error);
      throw error; // Let the Outbox processor retry
    }
  }
}
