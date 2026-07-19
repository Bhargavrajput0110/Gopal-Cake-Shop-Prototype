import { prisma } from '@/lib/prisma';
import { TimelineEventType, OrderStatus } from '@prisma/client';

export class TimelineAdapter {
  static async recordEvent(orderId: string, eventType: TimelineEventType, currentState: OrderStatus, nextState: OrderStatus, action: string, note?: string) {
    return prisma.timeline.create({
      data: {
        orderId,
        eventType,
        status: currentState,
        nextState,
        previousState: currentState,
        action,
        note,
        systemGenerated: true
      }
    });
  }

  static async logPaymentSuccess(orderId: string, currentState: OrderStatus, note?: string) {
    return this.recordEvent(
      orderId, 
      TimelineEventType.PAYMENT_CAPTURED, 
      currentState, 
      currentState, // Doesn't change order fulfillment state
      'Payment Captured', 
      note
    );
  }

  static async logPaymentFailed(orderId: string, currentState: OrderStatus, note?: string) {
    return this.recordEvent(
      orderId, 
      TimelineEventType.PAYMENT_FAILED, 
      currentState, 
      currentState,
      'Payment Failed', 
      note
    );
  }

  static async logPaymentRefunded(orderId: string, currentState: OrderStatus, note?: string) {
    return this.recordEvent(
      orderId, 
      TimelineEventType.PAYMENT_REFUNDED, 
      currentState, 
      currentState,
      'Payment Refunded', 
      note
    );
  }
}
