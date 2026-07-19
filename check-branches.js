const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const branches = await prisma.branch.findMany();
  console.log(branches);
}
run().finally(() => prisma.$disconnect());
