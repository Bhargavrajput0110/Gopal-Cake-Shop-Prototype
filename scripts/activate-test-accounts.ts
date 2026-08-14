import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  await prisma.user.updateMany({
    where: { username: { in: ['sales_uma', 'chef_uma', 'driver_uma'] } },
    data: { status: 'ACTIVE' }
  });
  console.log('Activated test staff accounts: sales_uma, chef_uma, driver_uma');
}
main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
