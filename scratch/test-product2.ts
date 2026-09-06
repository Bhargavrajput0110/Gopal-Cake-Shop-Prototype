import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const p = await prisma.product.findUnique({
    where: { id: 'cmsuqd4kh001zqgu37svhcvbd' }
  });
  console.log('Result:', p);
}

main().catch(console.error).finally(() => prisma.$disconnect());
