import { prisma } from './src/lib/prisma';
async function run() {
  const u = await prisma.user.findUnique({ where: { email: 'baggi_global@gopalcake.internal' } });
  console.log(JSON.stringify(u, null, 2));
}
run().finally(() => prisma.$disconnect());
