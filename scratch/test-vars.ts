import { NotificationDataAggregator } from '../src/services/notifications/NotificationDataAggregator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const orderId = 'cmtrd5o4q000004juvanxd3gi';
  const data = await NotificationDataAggregator.build(orderId);
  console.log('--- Aggregated Data ---');
  console.log(JSON.stringify(data, null, 2));

  // Let's mimic what WhatsAppTemplateService does for order_approved_pickup
  const { customer, order, customization, payment, fulfillment } = data!;
  
  const vars = [
    customer.name,                               // {{1}} customer_name
    order.displayId,                             // {{2}} order_id
    order.date,                                  // {{3}} order_date
    order.items,                                 // {{4}} order_details
    customization.messageOnCake || 'None',       // {{5}} message_on_cake
    customization.specialInstructions || 'None', // {{6}} special_instructions
    payment.total,                               // {{7}} order_total
    payment.amountPaid,                          // {{8}} amount_paid
    payment.paymentSummary,                      // {{9}} payment_summary
    fulfillment.storeName ?? 'Gopal Cake Shop',  // {{10}} store_name
    fulfillment.storeAddress ?? 'TBD',           // {{11}} store_address
    fulfillment.pickupDateTime ?? 'TBD',         // {{12}} pickup_datetime
  ];

  console.log('--- Variables for Meta ---');
  vars.forEach((v, i) => console.log(`${i+1}: "${v}"`));
}

run().catch(console.error).finally(() => prisma.$disconnect());
