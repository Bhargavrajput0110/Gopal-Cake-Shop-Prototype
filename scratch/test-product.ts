import { prisma } from '../src/lib/prisma';

async function main() {
  const p = await prisma.product.findUnique({
    where: { id: 'cmsuqd4kh001zqgu37svhcvbd' }
  });
  console.log(JSON.stringify(p, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
