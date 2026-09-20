import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { createWhatsAppProvider } from '../src/services/notifications/providers/WhatsAppProvider';
import { NotificationService } from '../src/services/notifications/NotificationService';
import { NotificationDataAggregator } from '../src/services/notifications/NotificationDataAggregator';
import { WhatsAppTemplateService } from '../src/services/notifications/WhatsAppTemplateService';

async function main() {
  console.log('--- META WHATSAPP CONFIGURATION CHECK ---');
  console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? 'EXISTS (length: ' + process.env.WHATSAPP_ACCESS_TOKEN.length + ')' : 'MISSING');
  console.log('WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID || 'MISSING');

  const provider = createWhatsAppProvider();
  if (!provider) {
    console.error('❌ WhatsApp Provider could not be created because WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing in environment!');
    return;
  }

  // Find order 001-0007
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: '001-0007' },
        { customer: { phone: '7575849772' } },
        { customer: { phone: '7075849772' } }
      ]
    }
  });

  if (!order) {
    console.error('Order not found!');
    return;
  }

  console.log('\n--- TESTING NOTIFICATION DATA AGGREGATOR ---');
  const orderData = await NotificationDataAggregator.build(order.id);
  console.log('Built OrderNotificationData:', {
    orderId: orderData?.order.displayId,
    customerName: orderData?.customer.name,
    customerPhone: orderData?.customer.phone,
    total: orderData?.payment.total,
    deliveryType: orderData?.fulfillment.type
  });

  if (!orderData) {
    console.error('Failed to build notification data');
    return;
  }

  console.log('\n--- TESTING TEMPLATE RESOLUTION ---');
  const selection = WhatsAppTemplateService.resolve('QUOTE_CREATED', orderData);
  console.log('Resolved Template Selection:', {
    templateName: selection.templateName,
    variables: selection.variables,
    imageUrl: selection.imageUrl
  });

  console.log('\n--- SENDING AUTOMATED META WHATSAPP MESSAGE ---');
  const eventId = `test_quote_${Date.now()}`;
  try {
    await NotificationService.handleTimelineEvent({
      action: 'send-quote',
      orderId: order.id,
      actorId: order.createdById || 'system',
      branchId: order.branchId,
      nextState: 'QUOTE_SENT',
      orderNumber: order.orderNumber,
      createdAt: new Date().toISOString(),
    }, eventId);
    console.log('✅ NotificationService.handleTimelineEvent executed successfully!');
  } catch (err: any) {
    console.error('❌ NotificationService error:', err?.message || err);
  }

  // Check NotificationLog table for logs
  const logs = await prisma.notificationLog.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log('\n--- RECENT NOTIFICATION LOGS FOR THIS ORDER ---');
  console.dir(logs, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
