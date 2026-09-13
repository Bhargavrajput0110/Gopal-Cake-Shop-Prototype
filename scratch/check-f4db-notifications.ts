import dotenv from 'dotenv';
dotenv.config({ path: '.env', override: true });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const order = await prisma.order.findFirst({
    where: { orderNumber: { contains: 'F4DB' } },
    include: {
      customer: true,
      notifications: true
    }
  });

  console.log("Order F4DB Status & Details:");
  console.log({
    id: order?.id,
    orderNumber: order?.orderNumber,
    status: order?.status,
    customerName: order?.customer?.name,
    customerPhone: order?.customer?.phone,
    deliveryAddress: order?.deliveryAddress
  });

  const outbox = await prisma.outbox.findMany({
    where: { aggregateId: order?.id },
    orderBy: { occurredAt: 'desc' }
  });

  console.log(`Outbox events for F4DB (${outbox.length}):`);
  console.log(JSON.stringify(outbox, null, 2));

  console.log(`Notification logs for F4DB (${order?.notifications?.length}):`);
  console.log(JSON.stringify(order?.notifications, null, 2));
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
