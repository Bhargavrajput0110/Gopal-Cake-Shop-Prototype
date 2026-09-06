import { prisma } from './src/lib/prisma';
async function run() {
  const users = await prisma.user.findMany({ where: { role: 'SALESPERSON' }});
  console.log('Salespeople:', users);
}
run().finally(() => prisma.$disconnect());
