import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: ['query'] });

async function main() {
  const orderNumber = 'ORD-1789044013498-5A1B';
  const order = await prisma.order.findFirst({
    where: { orderNumber },
    include: {
      payments: true,
      timeline: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  console.log(JSON.stringify(order, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
