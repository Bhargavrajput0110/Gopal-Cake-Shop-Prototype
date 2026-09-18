import { prisma } from '../src/lib/prisma';

async function main() {
  const updated = await prisma.branchTransfer.update({
    where: { id: 'cmu50ralt000004l68dfii01v' },
    data: { toBranchId: 'cmswuiiu000021su3kv1mr41f' }
  });
  console.log("SUCCESS! Updated Sanket's transfer to Warashiya branch:", JSON.stringify(updated, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
