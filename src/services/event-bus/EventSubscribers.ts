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
}
