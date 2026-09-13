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
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'lavkush', mode: 'insensitive' } },
        { username: { contains: 'lavkush', mode: 'insensitive' } }
      ]
    },
    include: { branch: true }
  });

  console.log("Lavkush user details:");
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
