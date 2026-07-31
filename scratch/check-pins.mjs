import { config } from 'dotenv';
config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true }
  });
  console.log('Users in DB:');
  console.table(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
