import { NextResponse } from 'next/server';
import { PaymentService } from '../../../../../services/payment/PaymentService';
import { RazorpayProvider } from '../../../../../services/payment/providers/RazorpayProvider';
import { PaymentRepository } from '../../../../../services/payment/PaymentRepository';

export async function POST(req: Request) {
  try {
    const { paymentId, gatewayOrderId, gatewayPaymentId, signature } = await req.json();

    if (!paymentId || !gatewayOrderId || !gatewayPaymentId || !signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const provider = new RazorpayProvider();
    const repo = new PaymentRepository();
    const paymentService = new PaymentService(provider, repo);

    const result = await paymentService.verifyPayment(
      paymentId,
      gatewayOrderId,
      gatewayPaymentId,
      signature
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Verify Payment Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
