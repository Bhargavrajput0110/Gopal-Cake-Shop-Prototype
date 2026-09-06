import { prisma } from './src/lib/prisma';
async function run() {
  const o = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log('Latest Order:', o);
}
run().finally(() => prisma.$disconnect());
