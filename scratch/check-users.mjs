import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('Users in DB:', users.map(u => ({ id: u.id, role: u.role, branch: u.branchId })));
  process.exit(0);
}
check();
