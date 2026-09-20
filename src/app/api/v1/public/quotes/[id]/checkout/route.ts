import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: any }
) {
  try {
    const { id: orderNumber } = await params;
    const body = await req.json();
    const { deliveryAddress, paymentMethod = 'RAZORPAY' } = body;

    // 1. Fetch the quote
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, branch: true, customer: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (order.status !== OrderStatus.QUOTE_DRAFT && order.status !== OrderStatus.QUOTE_SENT) {
      return NextResponse.json({ error: 'Quote has already been processed or expired' }, { status: 400 });
    }

    // 2. Update delivery address if provided
    if (deliveryAddress && deliveryAddress !== order.deliveryAddress) {
      await prisma.order.update({
        where: { id: order.id },
        data: { deliveryAddress }
      });
    }

    // 3. Generate Razorpay Payment Link
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay keys not configured.' }, { status: 500 });
    }

    const reqUrl = new URL(req.url);
    const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
    
    // We pass trackingId as quote order ID
    const callbackUrl = `${baseUrl}/api/v1/payments/payment-link-callback?trackingId=${order.orderNumber}&orderId=${order.id}`;
    
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(Number(order.totalAmount) * 100), // paise
        currency: 'INR',
        accept_partial: false,
        description: `Custom Quote #${order.orderNumber} - Gopal Cake Shop`,
        customer: {
          name: order.customer?.name || 'Customer',
          contact: order.customer?.phone ? `+91${order.customer.phone.replace(/^\+91/, '')}` : undefined,
          email: order.customer?.email || undefined,
        },
        notify: {
          sms: !!order.customer?.phone,
          email: !!order.customer?.email,
        },
        reminder_enable: false,
        callback_url: callbackUrl,
        callback_method: 'get',
        notes: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          trackingId: order.orderNumber,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('[QuoteCheckout] Razorpay error:', errData);
      return NextResponse.json(
        { error: errData?.error?.description || 'Failed to create payment link' },
        { status: 500 }
      );
    }

    const paymentLink = await response.json();

    // 4. Save Pending Payment Record
    const existingPending = await prisma.payment.findFirst({
      where: { orderId: order.id, status: 'PENDING' }
    });

    if (existingPending) {
      await prisma.payment.update({
        where: { id: existingPending.id },
        data: {
          amount: order.totalAmount,
          method: 'RAZORPAY',
          type: 'FULL',
          provider: 'RAZORPAY',
          gatewayOrderId: paymentLink.id,
          metadata: { paymentLinkId: paymentLink.id, paymentLinkUrl: paymentLink.short_url },
        }
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          method: 'RAZORPAY',
          type: 'FULL',
          status: 'PENDING',
          provider: 'RAZORPAY',
          gatewayOrderId: paymentLink.id,
          metadata: { paymentLinkId: paymentLink.id, paymentLinkUrl: paymentLink.short_url },
        },
      });
    }

    return NextResponse.json({ success: true, paymentUrl: paymentLink.short_url, orderNumber: order.orderNumber });
  } catch (err: any) {
    console.error('Quote Checkout Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
