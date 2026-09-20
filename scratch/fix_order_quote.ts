import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  // Find order by orderNumber '001-0007' or customer phone '7075849772'
  let order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: '001-0007' },
        { customer: { phone: '7075849772' } },
        { customer: { phone: '917075849772' } }
      ]
    },
    include: { customer: true, items: true }
  });

  if (!order) {
    // Search latest QUOTE_SENT or QUOTE_DRAFT order
    order = await prisma.order.findFirst({
      where: {
        status: { in: ['QUOTE_SENT', 'QUOTE_DRAFT'] }
      },
      orderBy: { createdAt: 'desc' },
      include: { customer: true, items: true }
    });
  }

  if (!order) {
    console.log('No order found for update.');
    return;
  }

  console.log('Found Order:', {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    currentTotalAmount: Number(order.totalAmount),
    status: order.status
  });

  // Update totalAmount to 2000 and status to QUOTE_SENT
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      subtotal: 2000,
      totalAmount: 2000,
      status: 'QUOTE_SENT',
      type: 'QUOTE' // ensure type is QUOTE so customer sees it in My Orders
    },
    include: { customer: true, items: true }
  });

  // Update order item price to 2000 if 0
  if (order.items.length > 0) {
    await prisma.orderItem.updateMany({
      where: { orderId: order.id },
      data: { price: 2000 }
    });
  }

  console.log('Successfully updated Order to ₹2000:', {
    id: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    newTotalAmount: Number(updatedOrder.totalAmount),
    status: updatedOrder.status
  });

  // Trigger the QUOTE_CREATED event so the Notification worker sends the WA message
  await prisma.timeline.create({
    data: {
      orderId: updatedOrder.id,
      action: 'QUOTE_CREATED',
      status: updatedOrder.status,
      nextState: updatedOrder.status,
      note: 'Quote amount manually corrected to 2000',
    }
  });
  console.log('Fired QUOTE_CREATED timeline event. WhatsApp will be dispatched by the worker.');

  const cleanPhone = updatedOrder.customer.phone.replace(/\D/g, '').replace(/^91/, '');
  const formattedPhone = `91${cleanPhone}`;
  const itemName = updatedOrder.items[0]?.productName || 'Custom Cake';
  const itemWeight = updatedOrder.items[0]?.weight ? ` (${updatedOrder.items[0].weight}kg)` : '';
  const quoteText = `Hi ${updatedOrder.customer.name.split(' ')[0]}, here is your price quote for *${itemName}${itemWeight}* from Gopal Cake Shop:\n\n*Total Amount:* ₹2000\n*Order ID:* ${updatedOrder.orderNumber || updatedOrder.id}\n\nPlease click the link below or reply to confirm your order:\nhttps://gopalcakeshop.com/orders 🎂`;
  
  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(quoteText)}`;

  console.log('\n--- WHATSAPP DIRECT LINK ---');
  console.log(waUrl);
}

main().catch(console.error).finally(() => prisma.$disconnect());
