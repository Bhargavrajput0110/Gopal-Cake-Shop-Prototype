import { prisma } from './src/lib/prisma';
async function run() {
  const umaBranch = await prisma.branch.findFirst({ where: { id: 'uma' }});
  console.log('Uma Branch:', umaBranch);
  
  const flamingoOrder = await prisma.order.findFirst({ where: { orderNumber: { contains: 'BD36' } } });
  console.log('Flamingo Order:', flamingoOrder);
}
run().finally(() => prisma.$disconnect());
