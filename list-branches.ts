import { prisma } from './src/lib/prisma';
async function run() {
  const branches = await prisma.branch.findMany({ select: { id: true, name: true, code: true, deliveryEnabled: true }, orderBy: { name: 'asc' } });
  branches.forEach(b => console.log(`${b.id.padEnd(35)} code=${b.code?.padEnd(15) ?? 'NULL'.padEnd(15)} name="${b.name}" deliveryEnabled=${b.deliveryEnabled}`));
  console.log(`\nTotal: ${branches.length}`);
}
run().finally(() => prisma.$disconnect());
