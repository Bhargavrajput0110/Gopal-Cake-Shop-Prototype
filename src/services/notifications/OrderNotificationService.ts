import { prisma } from '@/lib/prisma'
import { globalEventEmitter } from '@/lib/EventEmitter'
import { LoggerService } from '@/services/LoggerService'

type OrderAction =
  | 'accept'
  | 'assign-chef'
  | 'start-production'
  | 'mark-ready'
  | 'assign-driver'
  | 'start-delivery'
  | 'delivered'
  | 'cancel'
  | 'fail-delivery'
  | 'payment-received'
  | 'payment-failed'
  | 'transfer-request'

/**
 * Maps order lifecycle actions to the correct staff role(s) who should
 * receive an in-app notification, then dispatches via NotificationDispatcher.
 *
 * This is a fire-and-forget helper. It never throws — a notification failure
 * must not block the order state machine.
 */
export class OrderNotificationService {
  static async notify(params: {
    action: OrderAction | string
    orderId: string
    orderNumber: string
    branchId: string | null
    driverId?: string | null
  }) {
    const { action, orderId, orderNumber, branchId, driverId } = params

    try {
      await OrderNotificationService._dispatch(action, orderId, orderNumber, branchId, driverId)
    } catch (err) {
      // Non-fatal: log but never surface to callers
      LoggerService.error(`[OrderNotificationService] Failed for action=${action} order=${orderId}`, err)
    }
  }

  private static async _dispatch(
    action: string,
    orderId: string,
    orderNumber: string,
    branchId: string | null,
    driverId?: string | null
  ) {
    const eventId = `notif_${action}_${orderId}_${Date.now()}`
    const link = `/order/${orderId}`

    // Helper to find users by role and optional branch
    const getUsers = async (role: string, targetBranchId?: string | null) => {
      return prisma.user.findMany({
        where: {
          role: role as any,
          ...(targetBranchId ? { branchId: targetBranchId } : {}),
        },
        select: { id: true },
      })
    }

    // Helper to create in-app notification for a list of user IDs
    const notify = async (userIds: string[], title: string, message: string) => {
      for (const userId of userIds) {
        const userEventId = `${eventId}_${userId}`
        try {
          const notification = await prisma.inAppNotification.create({
            data: {
              eventId: userEventId,
              userId,
              title,
              message,
              priority: 'NORMAL',
              linkUrl: link,
            },
          })
          // Emit to SSE stream so connected clients receive it instantly
          globalEventEmitter.emit('notification', { userId, notification })
        } catch (err: any) {
          if (err.code !== 'P2002') throw err // Ignore duplicate (idempotency)
        }
      }
    }

    switch (action) {
      case 'accept': {
        // New order accepted → notify chefs at the branch
        const chefs = await getUsers('CHEF', branchId)
        await notify(
          chefs.map((u) => u.id),
          `New Order #${orderNumber}`,
          'A new order has been accepted and is ready for production.'
        )
        break
      }
      case 'mark-ready':
      case 'start-delivery': {
        // Cake ready → notify salesperson + manager + delivery
        const [sales, managers, drivers] = await Promise.all([
          getUsers('SALESPERSON', branchId),
          getUsers('MANAGER', branchId),
          getUsers('DELIVERY', branchId),
        ])
        const userIds = [...sales, ...managers, ...drivers].map((u) => u.id)
        await notify(userIds, `Cake Ready — #${orderNumber}`, 'The order is ready for pickup or delivery.')
        break
      }
      case 'assign-driver': {
        // Driver assigned → notify that specific driver
        if (driverId) {
          await notify([driverId], `Delivery Assigned — #${orderNumber}`, 'A delivery has been assigned to you.')
        }
        break
      }
      case 'delivered': {
        // Delivered → notify manager and admin
        const [managers, admins] = await Promise.all([
          getUsers('MANAGER', branchId),
          getUsers('ADMIN'),
        ])
        const userIds = [...managers, ...admins].map((u) => u.id)
        await notify(userIds, `Order Delivered — #${orderNumber}`, 'The order was successfully delivered.')
        break
      }
      case 'payment-received': {
        const [managers, admins] = await Promise.all([
          getUsers('MANAGER', branchId),
          getUsers('ADMIN'),
        ])
        const userIds = [...managers, ...admins].map((u) => u.id)
        await notify(userIds, `Payment Received — #${orderNumber}`, 'Payment has been confirmed for this order.')
        break
      }
      case 'payment-failed': {
        const [sales, managers] = await Promise.all([
          getUsers('SALESPERSON', branchId),
          getUsers('MANAGER', branchId),
        ])
        const userIds = [...sales, ...managers].map((u) => u.id)
        await notify(
          userIds,
          `Payment Failed — #${orderNumber}`,
          'Payment failed for this order. Customer follow-up may be required.',
        )
        break
      }
      case 'transfer-request': {
        // Branch transfer → notify managers of the target branch
        const managers = await getUsers('MANAGER', branchId)
        await notify(
          managers.map((u) => u.id),
          `Transfer Request — #${orderNumber}`,
          'A branch transfer request is awaiting your approval.'
        )
        break
      }
      case 'cancel': {
        const [sales, managers] = await Promise.all([
          getUsers('SALESPERSON', branchId),
          getUsers('MANAGER', branchId),
        ])
        const userIds = [...sales, ...managers].map((u) => u.id)
        await notify(userIds, `Order Cancelled — #${orderNumber}`, 'This order has been cancelled.')
        break
      }
      default:
        // Unknown actions are silently ignored — no notification needed
        break
    }
  }
}
