import { prisma } from '../src/lib/prisma';

async function main() {
  console.log("=== ALL ORDERS IN DB ===");
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      transfers: true,
      customer: true
    }
  });

  console.log(`Total orders in DB: ${orders.length}`);
  for (const o of orders) {
    console.log(`Order ID: ${o.id}, OrderNum: ${o.orderNumber}, Branch: ${o.branchId}, CreatedBy: ${o.createdById}, Customer: ${o.customer?.name} (${o.customer?.phone}), Notes: ${o.customerNotes}`);
    if (o.transfers.length > 0) {
      console.log(`  Transfers:`, JSON.stringify(o.transfers, null, 2));
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
