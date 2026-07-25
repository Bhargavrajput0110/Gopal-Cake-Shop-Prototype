import { prisma } from '../src/lib/prisma';

async function main() {
  const total = await prisma.order.count();
  const byBranch = await prisma.order.groupBy({ by: ['branchId'], _count: { _all: true } });
  console.log('Total orders:', total);
  console.log('By branch:', JSON.stringify(byBranch, null, 2));

  // Check a sample order's branchId
  const sample = await prisma.order.findFirst({ select: { id: true, branchId: true, orderNumber: true } });
  console.log('Sample order:', sample);

  await prisma.$disconnect();
}
main().catch(console.error);
