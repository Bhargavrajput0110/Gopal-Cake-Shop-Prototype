import { prisma } from '../src/lib/prisma';

async function main() {
  console.log("=== RECENT ORDERS ===");
  const orders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      transfers: true
    }
  });
  console.log("Orders:", JSON.stringify(orders, null, 2));

  console.log("\n=== ALL BRANCH TRANSFERS ===");
  const transfers = await prisma.branchTransfer.findMany({
    include: { order: true }
  });
  console.log("Transfers:", JSON.stringify(transfers, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
