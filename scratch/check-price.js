const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst({ where: { name: { contains: "Venom" } } });
  console.log("Product:", p);
  const d = await prisma.design.findFirst({ where: { name: { contains: "Venom" } } });
  console.log("Design:", d);
}
main().finally(() => prisma.$disconnect());
