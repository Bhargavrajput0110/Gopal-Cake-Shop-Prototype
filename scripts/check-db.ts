import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const [users, branches, products, orders, settings] = await Promise.all([
    prisma.user.count(),
    prisma.branch.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.settings.count(),
  ]);

  console.log('\n=== PRE-SEED DATABASE TABLE CHECK ===');
  console.log(`  User count:     ${users}`);
  console.log(`  Branch count:   ${branches}`);
  console.log(`  Product count:  ${products}`);
  console.log(`  Order count:    ${orders}`);
  console.log(`  Settings count: ${settings}`);
  console.log('=====================================');

  if (users === 0 && branches === 0 && products === 0) {
    console.log('VERDICT: Database is EMPTY. Safe to seed.');
  } else {
    console.log('VERDICT: Database has existing data. Seed will upsert (safe). Review counts above before proceeding.');
  }
}

main()
  .catch((e) => { console.error('DB check failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
