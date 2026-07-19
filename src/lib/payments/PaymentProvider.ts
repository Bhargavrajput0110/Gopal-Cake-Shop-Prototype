import { PaymentMethod, PaymentType, PaymentStatus, PrismaClient } from '@prisma/client'

export interface PaymentInitiationParams {
  orderId: string
  amount: number
  method: PaymentMethod
  type: PaymentType
  currency?: string
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  error?: string
  paymentId?: string // Our DB ID
}

export interface PaymentProvider {
  /**
   * Initiates a payment.
   * For Cash/Manual, it simply records the pending payment in the DB.
   * For Razorpay, it creates a Razorpay Order and returns the order ID for the client.
   */
  initiatePayment(params: PaymentInitiationParams, prismaTx: any): Promise<PaymentResult>

  /**
   * Verifies the payment callback/webhook from the provider.
   */
  verifyPayment(payload: any, signature: string): Promise<PaymentResult>

  /**
   * Initiates a refund.
   */
  refund(transactionId: string, amount?: number): Promise<boolean>
}

// -----------------------------------------------------------------------------
// Base Implementations
// -----------------------------------------------------------------------------

export class CashPaymentProvider implements PaymentProvider {
  async initiatePayment(params: PaymentInitiationParams, prismaTx: any): Promise<PaymentResult> {
    const payment = await prismaTx.payment.create({
      data: {
        orderId: params.orderId,
        amount: params.amount,
        method: PaymentMethod.CASH,
        type: params.type,
        status: PaymentStatus.PENDING, // Remains pending until collected by delivery or POS
      }
    })

    return { success: true, paymentId: payment.id }
  }

  async verifyPayment(payload: any, signature: string): Promise<PaymentResult> {
    return { success: true } // Handled manually by staff
  }

  async refund(transactionId: string, amount?: number): Promise<boolean> {
    return true // Manual handover
  }
}

export class ManualPaymentProvider implements PaymentProvider {
  async initiatePayment(params: PaymentInitiationParams, prismaTx: any): Promise<PaymentResult> {
    const payment = await prismaTx.payment.create({
      data: {
        orderId: params.orderId,
        amount: params.amount,
        method: PaymentMethod.MANUAL,
        type: params.type,
        status: PaymentStatus.SUCCESS, // Trusted internal manual override
      }
    })

    return { success: true, paymentId: payment.id }
  }

  async verifyPayment(payload: any, signature: string): Promise<PaymentResult> {
    return { success: true }
  }

  async refund(transactionId: string, amount?: number): Promise<boolean> {
    return true
  }
}
