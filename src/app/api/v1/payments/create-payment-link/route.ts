import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { orderId, amount, trackingId, customerName, customerPhone, customerEmail } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Missing orderId or amount' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay keys not configured on server.' }, { status: 500 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Build the base URL from the actual incoming request — this is ALWAYS correct
    // regardless of NEXTAUTH_URL value. Ensures Razorpay sends customer back to this server.
    const reqUrl = new URL(req.url);
    const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
    const callbackUrl = `${baseUrl}/api/v1/payments/payment-link-callback?trackingId=${trackingId}&orderId=${orderId}`;

    // Create Razorpay Payment Link via REST API (no SDK script needed in browser)
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // paise
        currency: 'INR',
        accept_partial: false,
        description: `Order #${order.orderNumber} - Gopal Cake Shop`,
        customer: {
          name: customerName || 'Customer',
          contact: customerPhone ? `+91${customerPhone.replace(/^\+91/, '')}` : undefined,
          email: customerEmail || undefined,
        },
        notify: {
          sms: !!customerPhone,
          email: !!customerEmail,
        },
        reminder_enable: false,
        callback_url: callbackUrl,
        callback_method: 'get',
        notes: {
          orderId,
          orderNumber: order.orderNumber,
          trackingId,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('[PaymentLink] Razorpay error:', errData);
      return NextResponse.json(
        { error: errData?.error?.description || 'Failed to create payment link' },
        { status: 500 }
      );
    }

    const paymentLink = await response.json();

    // Create a pending payment record
    await prisma.payment.create({
      data: {
        orderId,
        amount,
        method: 'RAZORPAY',
        type: 'FULL',
        status: 'PENDING',
        provider: 'RAZORPAY',
        gatewayOrderId: paymentLink.id,
        metadata: { paymentLinkId: paymentLink.id, paymentLinkUrl: paymentLink.short_url },
      },
    });

    return NextResponse.json({
      success: true,
      paymentUrl: paymentLink.short_url,
    });
  } catch (error: any) {
    console.error('[PaymentLink] Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
