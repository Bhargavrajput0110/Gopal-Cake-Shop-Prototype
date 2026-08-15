const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const d = await prisma.design.findMany({where: {name: {contains: 'Princess Cake'}}});
  console.log(JSON.stringify(d, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
