import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

// Configure web-push with VAPID details
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:test@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export class PushNotificationService {
  /**
   * Sends a push notification to specific users
   */
  static async sendToUsers(userIds: string[], payload: { title: string; body: string; url?: string; tag?: string }) {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.warn("VAPID keys not configured, skipping push notification.");
      return;
    }

    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId: { in: userIds }
        }
      });

      if (subscriptions.length === 0) return;

      const payloadString = JSON.stringify(payload);

      const sendPromises = subscriptions.map(async (sub: any) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            }
          };

          await webpush.sendNotification(pushSubscription, payloadString);
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription has expired or is no longer valid
            console.log(`Subscription ${sub.id} expired, deleting`);
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          } else {
            console.error(`Error sending push to subscription ${sub.id}:`, err);
          }
        }
      });

      await Promise.allSettled(sendPromises);
    } catch (err) {
      console.error('Failed to send push notifications:', err);
    }
  }

  /**
   * Sends a push notification to all users with a specific role
   */
  static async sendToRole(roles: string[], payload: { title: string; body: string; url?: string; tag?: string }) {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: { in: roles as any[] } // Assuming roles match Prisma Enum
        },
        select: { id: true }
      });
      
      if (users.length > 0) {
        await this.sendToUsers(users.map((u: any) => u.id), payload);
      }
    } catch (err) {
      console.error('Failed to get users by role for push:', err);
    }
  }
}
