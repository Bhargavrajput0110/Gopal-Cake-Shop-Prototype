import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { NotificationDispatcher } from '../src/services/notifications/NotificationDispatcher';
import { NotificationDataAggregator } from '../src/services/notifications/NotificationDataAggregator';

async function main() {
  const orderId = 'cmu9zyyl7000004l8qfox5z9b'; // Order 001-0007
  const orderData = await NotificationDataAggregator.build(orderId);
  
  if (!orderData) {
    console.log('Order Data not found');
    return;
  }

  console.log('Found order data. Subtotal:', orderData.payment.total);
  console.log('Order Meta (Image):', orderData._meta);

  try {
    await NotificationDispatcher.dispatch({
      eventId: `manual_trigger_${Date.now()}`,
      orderId: orderId,
      channel: 'WHATSAPP',
      recipientRole: 'CUSTOMER',
      recipientPhone: orderData.customer.phone,
      templateName: 'QUOTE_CREATED',
      orderData: orderData,
    });

    console.log('Dispatched successfully to', orderData.customer.phone);
  } catch (error) {
    console.error('Failed to dispatch:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
