const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrisma() {
  const o = await prisma.order.findUnique({
    where: { orderNumber: 'ORD-1788460860633-C867' },
    include: { items: { include: { media: true } } }
  });
  console.log("Order ITEMS:", JSON.stringify(o.items, null, 2));
  
  const cakeImage = o.items[0]?.media?.find(m => m.type === 'REFERENCE')?.url || o.items[0]?.image || undefined;
  console.log("cakeImage evaluates to:", cakeImage);
}

testPrisma().catch(e => console.error(e)).finally(() => prisma.$disconnect());
