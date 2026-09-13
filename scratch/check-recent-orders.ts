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
  const orderF4DB = await prisma.order.findFirst({
    where: { orderNumber: { contains: 'F4DB' } },
    include: {
      customer: true,
      branch: true,
      createdBy: true,
      items: true
    }
  });

  console.log("Order F4DB details:");
  console.log(JSON.stringify(orderF4DB, null, 2));
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
