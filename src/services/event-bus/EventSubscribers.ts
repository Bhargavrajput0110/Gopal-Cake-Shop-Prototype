import { outboxProcessor } from './OutboxProcessor'
import { prisma } from '@/lib/prisma'
import { LoggerService } from '@/services/LoggerService'
import { NotificationService } from '@/services/notifications/NotificationService'

// Event Payload Interfaces (match what is published)
interface OrderStatusChangedPayload {
  orderId?: string
  previousState: string
  newState: string
  action: string
}

interface OrderDeliveredPayload {
  orderId: string
  driverId: string
}

/**
 * Register all event subscribers.
 * This function should be called exactly once during the initialization
 * of the background worker or cron route.
 */
export function registerSubscribers() {
  LoggerService.info('[EventSubscribers] Registering Domain Event handlers...')

  outboxProcessor.subscribe('TIMELINE_CREATED', async (payload: any, eventId) => {
    LoggerService.info(`[EventSubscribers] Handling TIMELINE_CREATED: ${payload.action}`)
    
    // 1. Unified Notification Matrix Processing
    await NotificationService.handleTimelineEvent(payload, eventId)

    // 2. Legacy Payment Hooks (Stubs)
    if (payload.nextState === 'DELIVERED') {
      LoggerService.info(`[EventSubscribers] Order delivered! Triggering payment capture...`)
      // PaymentService.capturePayment()
    }

    if (payload.nextState === 'CANCELLED') {
      LoggerService.info(`[EventSubscribers] Order cancelled! Processing refund...`)
      // Process Stripe refund
    }
  })

  // When a chef marks an OrderItem as READY_FOR_PICKUP,
  // check if ALL items in that order are ready and advance the parent Order status.
  outboxProcessor.subscribe('OrderItemStatusUpdated', async (payload: any) => {
    const { orderId, newStatus } = payload
    if (!orderId) return

    // Only trigger check when an item moves to a "done" state
    if (newStatus !== 'READY_FOR_PICKUP' && newStatus !== 'COMPLETED') return

    LoggerService.info(`[EventSubscribers] OrderItemStatusUpdated: checking if all items ready for order ${orderId}`)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { where: { parentItemId: null } } } // top-level items only
    })

    if (!order) return

    // Only advance if parent order is still in kitchen states
    const kitchenStates = ['WAITING_FOR_CHEF', 'CHEF_ACCEPTED', 'MAKING', 'DECORATING']
    if (!kitchenStates.includes(order.status)) return

    const allItemsDone = order.items.every(
      item => item.status === 'READY_FOR_PICKUP' || item.status === 'COMPLETED'
    )

    if (allItemsDone) {
      LoggerService.info(`[EventSubscribers] All items ready for order ${orderId} — advancing to READY_FOR_PICKUP`)
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'READY_FOR_PICKUP' }
        })
        await tx.timeline.create({
          data: {
            orderId,
            action: 'AUTO_READY',
            status: 'READY_FOR_PICKUP',
            nextState: 'READY_FOR_PICKUP',
            note: 'All kitchen items completed — order automatically marked Ready for Pickup/Delivery',
          }
        })
      })
    }
  })
}
