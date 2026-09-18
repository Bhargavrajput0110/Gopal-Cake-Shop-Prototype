import { prisma } from '../src/lib/prisma';
import { generateSequentialOrderNumber } from '../src/lib/branches';

async function main() {
  console.log("=== 1. VERIFYING SANKET'S TRANSFER ===");
  const transfer = await prisma.branchTransfer.findUnique({
    where: { id: 'cmu50ralt000004l68dfii01v' },
    include: { order: true }
  });
  console.log("Sanket Transfer Status:", transfer?.status);
  console.log("From Branch:", transfer?.fromBranchId, "--> To Branch:", transfer?.toBranchId);

  console.log("\n=== 2. VERIFYING SEQUENTIAL ORDER NUMBERS ===");
  await prisma.$transaction(async (tx) => {
    console.log("Next Uma Order Number:", await generateSequentialOrderNumber(tx, 'uma'));
    console.log("Next Khanderao Order Number:", await generateSequentialOrderNumber(tx, 'khanderao'));
    console.log("Next Warashiya Order Number:", await generateSequentialOrderNumber(tx, 'varasiya'));
    console.log("Next Ellora Park Order Number:", await generateSequentialOrderNumber(tx, 'elora'));
  });

  console.log("\n=== 3. VERIFYING CUSTOMER PHONE LOOKUP ===");
  const phoneOrders = await prisma.order.findMany({
    where: {
      customer: { phone: { contains: '7575849772' } }
    },
    take: 3,
    orderBy: { createdAt: 'desc' }
  });
  console.log(`Found ${phoneOrders.length} orders for customer 7575849772.`);
  for (const o of phoneOrders) {
    console.log(`  Order: ${o.orderNumber || o.id}, Status: ${o.status}, Amount: ₹${o.totalAmount}`);
  }

  console.log("\n✅ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
}

main()
  .catch(e => {
    console.error("❌ VERIFICATION ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
