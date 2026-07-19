import { NextResponse } from 'next/server';
import { PaymentService } from '../../../../../services/payment/PaymentService';
import { RazorpayProvider } from '../../../../../services/payment/providers/RazorpayProvider';
import { PaymentRepository } from '../../../../../services/payment/PaymentRepository';

export async function POST(req: Request) {
  try {
    const { orderId, amount, method } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Missing orderId or amount' }, { status: 400 });
    }

    const provider = new RazorpayProvider();
    const repo = new PaymentRepository();
    const paymentService = new PaymentService(provider, repo);

    const result = await paymentService.createPaymentOrder(orderId, amount, method || 'RAZORPAY');

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
