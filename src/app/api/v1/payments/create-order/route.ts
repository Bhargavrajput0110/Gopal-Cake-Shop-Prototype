import { NextResponse } from 'next/server';
import { PaymentService } from '../../../../../services/payment/PaymentService';
import { RazorpayProvider } from '../../../../../services/payment/providers/RazorpayProvider';
import { PaymentRepository } from '../../../../../services/payment/PaymentRepository';

export async function POST(req: Request) {
  try {
    const { orderId, amount, method } = await req.json();

    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!orderId || typeof parsedAmount !== 'number' || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Missing or invalid orderId or amount' }, { status: 400 });
    }

    const provider = new RazorpayProvider();
    const repo = new PaymentRepository();
    const paymentService = new PaymentService(provider, repo);

    const result = await paymentService.createPaymentOrder(orderId, amount, method || 'RAZORPAY');

    return NextResponse.json({
      success: true,
      data: result,
      key: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    });
  } catch (error: any) {
    console.error('Create Order Error:', error);
    const errorMessage = error?.message || error?.error?.description || JSON.stringify(error) || 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
