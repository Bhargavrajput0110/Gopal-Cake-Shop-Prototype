import { prisma } from '@/lib/prisma'
import { PaymentStatus, PaymentMethod, PaymentType } from '@prisma/client'
import { EventBus } from './event-bus/EventBus'
import { LoggerService } from './LoggerService'

export interface PaymentGatewayProvider {
  processPayment(amount: number, metadata: Record<string, any>): Promise<{ success: boolean; transactionId: string | null; error?: string }>
  refundPayment(transactionId: string, amount: number): Promise<{ success: boolean; error?: string }>
}

export class PaymentService {
  /**
   * Pure Business Logic: State transitions
   */
  static validateTransition(currentStatus: PaymentStatus, nextStatus: PaymentStatus): void {
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      PENDING: ['SUCCESS', 'FAILED'],
      SUCCESS: [],
      FAILED: ['PENDING'] // Retry scenario
    }

    if (!validTransitions[currentStatus].includes(nextStatus)) {
      throw new Error(`Invalid payment transition from ${currentStatus} to ${nextStatus}`)
    }
  }

  /**
   * Pure Business Logic: Select appropriate gateway provider
   */
  static selectProvider(method: PaymentMethod, providers: Record<string, PaymentGatewayProvider>): PaymentGatewayProvider {
    if (method === 'UPI' || method === 'CARD') {
      if (!providers['RAZORPAY']) throw new Error('Razorpay provider not configured')
      return providers['RAZORPAY']
    }
    // For CASH, we use a dummy synchronous provider
    return providers['CASH']
  }

  /**
   * Processes a new payment through the gateway and persists it
   */
  static async processPayment(params: {
    orderId: string
    amount: number
    method: PaymentMethod
    type: PaymentType
    providers: Record<string, PaymentGatewayProvider>
    eventBus: EventBus
    actorId?: string
    idempotencyKey?: string // For retry logic
  }): Promise<any> {
    const { orderId, amount, method, type, providers, eventBus, actorId, idempotencyKey } = params

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await prisma.payment.findFirst({
        where: { transactionId: idempotencyKey }
      })
      if (existing) {
        if (existing.status === 'SUCCESS') return existing
        if (existing.status === 'PENDING') throw new Error('Payment already processing')
      }
    }

    // 2. Select Provider
    const provider = this.selectProvider(method, providers)

    // 3. Create Pending Record
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount,
        method,
        type,
        status: 'PENDING',
        transactionId: idempotencyKey || null
      }
    })

    try {
      // 4. Process via Gateway
      const result = await provider.processPayment(amount, { orderId, paymentId: payment.id })

      if (result.success) {
        this.validateTransition(payment.status, 'SUCCESS')
        
        const updated = await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCESS', transactionId: result.transactionId || idempotencyKey }
        })

        await eventBus.publish({
          eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventType: 'PAYMENT_COMPLETED',
          eventVersion: '1.0',
          occurredAt: new Date(),
          correlationId: payment.id,
          actorId: actorId || 'SYSTEM',
          payload: { 
            aggregateId: orderId,
            causationId: 'processPayment',
            amount, 
            method, 
            type 
          }
        })

        return updated
      } else {
        this.validateTransition(payment.status, 'FAILED')
        
        const updated = await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        })

        await eventBus.publish({
          eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventType: 'PAYMENT_FAILED',
          eventVersion: '1.0',
          occurredAt: new Date(),
          correlationId: payment.id,
          actorId: actorId || 'SYSTEM',
          payload: { 
            aggregateId: orderId,
            causationId: 'processPayment',
            amount, 
            method, 
            type, 
            error: result.error 
          }
        })

        return updated
      }
    } catch (e: any) {
      LoggerService.error('Payment processing threw error', e, { paymentId: payment.id })
      
      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      })

      return updated
    }
  }

  /*
  static async refundPayment(params: {
    paymentId: string
    providers: Record<string, PaymentGatewayProvider>
    eventBus: EventBus
    actorId: string
  }): Promise<any> {
    // refund logic...
  }
  */
}
