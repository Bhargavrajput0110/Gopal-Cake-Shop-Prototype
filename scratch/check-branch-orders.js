require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log('DB URL present:', !!connectionString);

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool, { schema: 'public' });
  const prisma = new PrismaClient({ adapter });

  const total = await prisma.order.count();
  const byBranch = await prisma.order.groupBy({ by: ['branchId'], _count: { _all: true } });
  console.log('Total orders:', total);
  console.log('By branch:', JSON.stringify(byBranch, null, 2));

  const sample = await prisma.order.findFirst({ select: { id: true, branchId: true, orderNumber: true } });
  console.log('Sample order:', JSON.stringify(sample));

  await prisma.$disconnect();
}

main().catch(console.error);
