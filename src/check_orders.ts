import { prisma } from './lib/prisma';

async function main() {
  const orders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { customer: true, items: true, ledgerEntries: true }
  });
  console.log(JSON.stringify(orders.map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    totalAmount: o.totalAmount,
    advancePaid: o.advancePaid,
    customer: o.customer?.name,
    phone: o.customer?.phone,
    items: o.items.map((i: any) => ({ name: i.productName, price: i.price, qty: i.quantity })),
    ledgerCount: o.ledgerEntries.length
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

