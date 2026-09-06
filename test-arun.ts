import { prisma } from './src/lib/prisma';
async function run() {
  const users = await prisma.user.findMany({ where: { name: { contains: 'arun', mode: 'insensitive' } }});
  console.log('Arun:', users);
}
run().finally(() => prisma.$disconnect());
