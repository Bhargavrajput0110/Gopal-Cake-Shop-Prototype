import { prisma } from '../src/lib/prisma';
import { toBranchId, BRANCHES } from '../src/lib/branches';

async function main() {
  const userBranchId = "cmswuiiu000021su3kv1mr41f"; // Naresh at Factory Warasiya
  const canonical = toBranchId(userBranchId);
  const branchObj = BRANCHES.find(b => b.id === canonical);
  const possibleBranchIds = branchObj ? [canonical, userBranchId, ...branchObj.aliases] : [canonical, userBranchId];

  console.log("Possible branch IDs for Naresh:", possibleBranchIds);

  const incomingTransfers = await prisma.branchTransfer.findMany({
    where: { toBranchId: { in: possibleBranchIds } },
    include: {
      order: true
    }
  });

  console.log(`\nIncoming transfers found for Naresh (${incomingTransfers.length}):`);
  console.log(JSON.stringify(incomingTransfers, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
