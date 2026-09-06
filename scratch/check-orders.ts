import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

async function main() {
  const targetDate = new Date();
  const todayStart = startOfDay(targetDate);
  const todayEnd = endOfDay(targetDate);

  console.log(`Searching orders between ${todayStart.toISOString()} and ${todayEnd.toISOString()}`);
  
  const allOrders = await prisma.order.findMany({
    select: { id: true, status: true, targetDate: true, createdAt: true }
  });
  
  console.log(`Total orders in DB: ${allOrders.length}`);
  if (allOrders.length > 0) {
    console.log("Sample of first 5 orders:", allOrders.slice(0, 5));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
