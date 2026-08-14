import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.product.count();
  console.log(`PRODUCT_COUNT=${count}`);
  
  if (count > 0) {
    const products = await prisma.product.findMany({ take: 5, select: { name: true } });
    console.log('Sample products:', products.map(p => p.name).join(', '));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
