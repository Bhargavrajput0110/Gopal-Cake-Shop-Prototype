import { prisma } from '../src/lib/prisma';
import { toBranchId, BRANCHES } from '../src/lib/branches';

async function testBranchFilter(rawBranchParam: string) {
  let branchCondition: any = null;
  if (rawBranchParam && rawBranchParam.toLowerCase() !== 'all') {
    const canonical = toBranchId(rawBranchParam);
    const targetBranchObj = BRANCHES.find(b => b.id === canonical || b.shortName.toLowerCase() === rawBranchParam.toLowerCase());
    const allAliases = targetBranchObj ? [targetBranchObj.id, targetBranchObj.displayName, ...targetBranchObj.aliases] : [rawBranchParam, canonical];
    
    branchCondition = {
      OR: [
        { branchId: { in: allAliases } },
        { branchId: { contains: rawBranchParam, mode: 'insensitive' } },
        { branch: { name: { contains: rawBranchParam, mode: 'insensitive' } } }
      ]
    };
  }

  const where = branchCondition ? { AND: [{ status: { notIn: ['CANCELLED', 'DRAFT'] } }, branchCondition] } : { status: { notIn: ['CANCELLED', 'DRAFT'] } };

  const orders = await prisma.order.findMany({
    where: where as any,
    select: { id: true, orderNumber: true, branchId: true, totalAmount: true, status: true }
  });

  console.log(`Branch [${rawBranchParam}]: ${orders.length} orders found.`);
  orders.forEach(o => console.log(`  - #${o.orderNumber || o.id.slice(0, 8)} | branchId: ${o.branchId} | status: ${o.status}`));
}

async function run() {
  await testBranchFilter('All');
  await testBranchFilter('uma');
  await testBranchFilter('khanderao');
  await testBranchFilter('varasiya');
  await testBranchFilter('elora');
}

run().catch(console.error).finally(() => prisma.$disconnect());
