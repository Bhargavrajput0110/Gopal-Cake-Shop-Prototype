import Razorpay from 'razorpay';
import crypto from 'crypto';
import {
  PaymentProvider,
  CreateOrderParams,
  GatewayOrder,
  CapturePaymentParams,
  RefundParams,
  GatewayRefund,
  VerifySignatureParams
} from '../PaymentProvider';

export class RazorpayProvider implements PaymentProvider {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });
  }

  async createOrder(params: CreateOrderParams): Promise<GatewayOrder> {
    const order = await this.razorpay.orders.create({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
    });

    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt || '',
      status: order.status,
    };
  }

  verifySignature(params: VerifySignatureParams): boolean {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(text)
      .digest('hex');
      
    return expectedSignature === razorpaySignature;
  }

  async capture(params: CapturePaymentParams): Promise<boolean> {
    try {
      await this.razorpay.payments.capture(
        params.paymentId,
        params.amount,
        params.currency
      );
      return true;
    } catch (error) {
      console.error('Error capturing Razorpay payment:', error);
      return false;
    }
  }

  async refund(params: RefundParams): Promise<GatewayRefund> {
    const refundData: any = {};
    if (params.amount) {
      refundData.amount = params.amount;
    }
    if (params.receipt) {
      refundData.receipt = params.receipt;
    }
    if (params.notes) {
      refundData.notes = params.notes;
    }

    const refund = await this.razorpay.payments.refund(params.paymentId, refundData);
    
    return {
      id: refund.id,
      paymentId: refund.payment_id,
      amount: Number(refund.amount),
      status: refund.status,
    };
  }

  async fetchPayment(paymentId: string): Promise<any> {
    return await this.razorpay.payments.fetch(paymentId);
  }

  async fetchOrderPayments(orderId: string): Promise<any[]> {
    try {
      const response = await this.razorpay.orders.fetchPayments(orderId);
      return response.items || [];
    } catch (error) {
      console.error('Error fetching Razorpay order payments:', error);
      return [];
    }
  }
}
