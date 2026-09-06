import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const count = await prisma.order.updateMany({
    where: {
      status: 'NEW',
    },
    data: {
      status: 'WAITING_FOR_CHEF'
    }
  });
  console.log(`Updated ${count.count} old orders from NEW to WAITING_FOR_CHEF so they show in KDS`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
