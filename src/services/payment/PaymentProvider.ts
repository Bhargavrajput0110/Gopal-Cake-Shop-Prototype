import { Payment, PaymentMethod } from '@prisma/client';

export interface CreateOrderParams {
  amount: number; // In smallest currency unit (e.g. paise)
  currency: string;
  receipt: string;
}

export interface GatewayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface CapturePaymentParams {
  paymentId: string;
  amount: number;
  currency: string;
}

export interface RefundParams {
  paymentId: string;
  amount?: number; // If undefined, full refund
  receipt?: string;
  notes?: Record<string, string>;
}

export interface GatewayRefund {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
}

export interface VerifySignatureParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentProvider {
  /**
   * Creates a payment order with the gateway.
   */
  createOrder(params: CreateOrderParams): Promise<GatewayOrder>;

  /**
   * Verifies the cryptographic signature of a payment.
   */
  verifySignature(params: VerifySignatureParams): boolean;

  /**
   * Captures a payment (if the gateway uses a two-step authorization/capture).
   */
  capture(params: CapturePaymentParams): Promise<boolean>;

  /**
   * Refunds a payment fully or partially.
   */
  refund(params: RefundParams): Promise<GatewayRefund>;

  /**
   * Fetches all payment attempts associated with a specific gateway order ID.
   * Useful for reconciliation and auditing.
   */
  fetchOrderPayments(orderId: string): Promise<any[]>;

  /**
   * Fetches the latest payment details from the gateway.
   */
  fetchPayment(paymentId: string): Promise<any>;
}
