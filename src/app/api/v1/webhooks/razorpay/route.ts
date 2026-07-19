import { NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment/PaymentService';
import { RazorpayProvider } from '@/services/payment/providers/RazorpayProvider';
import { PaymentRepository } from '@/services/payment/PaymentRepository';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature (using the webhook secret from dashboard, not the api secret)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret')
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // Pass headers safely
    const headersRecord: Record<string, string> = {
      'x-razorpay-signature': signature
    };

    const provider = new RazorpayProvider();
    const repo = new PaymentRepository();
    const paymentService = new PaymentService(provider, repo);

    // This will idempotently process the event and return true if handled correctly
    await paymentService.processWebhook(headersRecord, rawBody, 'RAZORPAY');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    // Return 500 so Razorpay retries
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
