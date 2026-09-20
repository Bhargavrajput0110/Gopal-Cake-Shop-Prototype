import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const orderNumber = '001-0007';
  console.log(`Resetting order ${orderNumber}...`);
  
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) throw new Error('Order not found');
  
  // Delete fake ledger entries
  await prisma.ledgerEntry.deleteMany({
    where: { orderId: order.id }
  });
  console.log('Deleted ledger entries');
  
  // Delete fake payment records
  await prisma.payment.deleteMany({
    where: { orderId: order.id }
  });
  console.log('Deleted payment records');
  
  // Delete timeline events for the bogus checkout
  await prisma.timeline.deleteMany({
    where: { orderId: order.id, action: 'QUOTE_CONVERTED' }
  });
  console.log('Deleted timeline events');
  
  // Update order back to QUOTE_SENT
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'QUOTE_SENT'
    }
  });
  console.log('Reset order status to QUOTE_SENT');
  
  // Reset order item status
  await prisma.orderItem.updateMany({
    where: { orderId: order.id },
    data: {
      status: 'PENDING'
    }
  });
  console.log('Reset order item statuses to PENDING');
}

main().catch(console.error).finally(() => prisma.$disconnect());
