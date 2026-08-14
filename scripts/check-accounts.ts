import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Get all staff accounts with their IDs and verify PINs
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, email: true, role: true, status: true, passwordHash: true, branchId: true },
    where: { role: { in: ['ADMIN', 'SALESPERSON', 'CHEF', 'DELIVERY', 'MANAGER'] } },
    orderBy: [{ role: 'asc' }, { username: 'asc' }],
  });

  console.log('\n=== STAFF ACCOUNTS WITH IDs (for login) ===');
  console.log('Auth uses: { id: <userId>, pin: <PIN> }');
  console.log('--------------------------------------------');
  for (const u of users) {
    const pin1234 = await bcrypt.compare('1234', u.passwordHash);
    const pin0000 = await bcrypt.compare('0000', u.passwordHash);
    const pinWorks = pin1234 ? '1234' : pin0000 ? '0000' : 'UNKNOWN';
    if (u.username) {
      console.log(`[${u.role}] ${u.username} (${u.status}) → id: ${u.id} | PIN: ${pinWorks}`);
    }
  }

  // Specifically find the ACTIVE admin account
  console.log('\n=== ACTIVE ADMIN ACCOUNT ===');
  const activeAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN', status: 'ACTIVE' },
    select: { id: true, username: true, name: true, passwordHash: true }
  });
  if (activeAdmin) {
    const pin1234 = await bcrypt.compare('1234', activeAdmin.passwordHash);
    const pin0000 = await bcrypt.compare('0000', activeAdmin.passwordHash);
    console.log(`Found: ${activeAdmin.name} (${activeAdmin.username})`);
    console.log(`  ID: ${activeAdmin.id}`);
    console.log(`  PIN 1234: ${pin1234 ? '✅' : '❌'} | PIN 0000: ${pin0000 ? '✅' : '❌'}`);
  } else {
    console.log('No ACTIVE admin found. Check usr_admin account.');
  }
}

main()
  .catch((e) => { console.error('Error:', e.message); process.exit(1); })
  .finally(async () => { pool.end(); });
