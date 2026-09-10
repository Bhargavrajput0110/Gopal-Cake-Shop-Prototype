import { NextResponse } from 'next/server';
import { NotificationService } from '@/services/notifications/NotificationService';
import { NotificationDataAggregator } from '@/services/notifications/NotificationDataAggregator';
import { createWhatsAppProvider } from '@/services/notifications/providers/WhatsAppProvider';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber'); // e.g. ORD-1788792984138-027C
  const phone = searchParams.get('phone'); // override phone for testing

  // Resolve by orderNumber if orderId not given
  if (!orderId && orderNumber) {
    const found = await prisma.order.findFirst({
      where: { orderNumber: orderNumber.replace('#', '') },
      select: { id: true },
    });
    orderId = found?.id ?? null;
  }

  const results: Record<string, any> = {};

  // Step 1: Check credentials
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  results.credentials = {
    hasToken: !!token,
    tokenPreview: token ? `${token.slice(0, 10)}...${token.slice(-5)}` : null,
    hasPhoneNumberId: !!phoneNumberId,
    phoneNumberId: phoneNumberId || null,
  };

  const provider = createWhatsAppProvider();
  results.providerCreated = !!provider;

  // Step 2: If orderId provided, build DTO and try sending
  if (orderId) {
    try {
      const data = await NotificationDataAggregator.build(orderId);
      if (!data) {
        results.dataAggregator = 'FAILED — order or customer not found';
      } else {
        results.dataAggregator = {
          customerName: data.customer.name,
          customerPhone: data.customer.phone,
          orderNumber: data.order.displayId,
          items: data.order.items,
          paymentSummary: data.payment.paymentSummary,
          fulfillmentType: data.fulfillment.type,
        };

        // Override phone for test if provided
        const targetPhone = phone || data.customer.phone;
        results.targetPhone = targetPhone;

        if (!targetPhone) {
          results.whatsappSend = 'SKIPPED — no phone number on customer';
        } else if (!provider) {
          results.whatsappSend = 'SKIPPED — provider not created (missing credentials)';
        } else {
          // Try sending a real test message
          const sendResult = await provider.sendTemplate({
            phone: targetPhone,
            templateName: data.fulfillment.type === 'DELIVERY' ? 'order_approved_delivery' : 'order_approved_pickup',
            templateVersion: 'v1',
            language: 'en',
            variables: [
              data.customer.name,
              data.order.displayId,
              data.order.date,
              data.order.items,
              data.customization.specialInstructions,
              data.customization.referenceDescription,
              data.payment.total,
              data.payment.amountPaid,
              data.payment.paymentMethod,
              data.payment.paymentSummary,
              ...(data.fulfillment.type === 'DELIVERY'
                ? [data.fulfillment.deliveryAddress ?? 'TBD', data.fulfillment.deliveryDateTime ?? 'TBD']
                : [data.fulfillment.storeName ?? 'Store', data.fulfillment.storeAddress ?? 'TBD', data.fulfillment.pickupDateTime ?? 'TBD']
              ),
            ],
          });
          results.whatsappSend = sendResult;
        }
      }
    } catch (err: any) {
      results.error = err?.message;
    }
  }

  return NextResponse.json(results, { status: 200 });
}
