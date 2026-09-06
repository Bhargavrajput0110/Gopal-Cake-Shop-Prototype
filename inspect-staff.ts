import { prisma } from './src/lib/prisma';

async function run() {
  const staff = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'MANAGER', 'SALESPERSON', 'CHEF', 'DELIVERY'] },
      status: 'ACTIVE',
      email: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      branch: { select: { name: true, code: true } }
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }]
  });

  // Print as compact table
  console.log(`${'NAME'.padEnd(30)} ${'EMAIL'.padEnd(45)} ${'PHONE'.padEnd(15)} ${'LAST4'.padEnd(6)} ${'ROLE'.padEnd(15)} BRANCH`);
  console.log('-'.repeat(130));
  for (const u of staff) {
    const phone = u.phone || '';
    const last4 = phone.replace(/\D/g, '').slice(-4) || 'N/A ';
    console.log(
      `${(u.name || '').padEnd(30)} ${(u.email || '').padEnd(45)} ${phone.padEnd(15)} ${last4.padEnd(6)} ${u.role.padEnd(15)} ${u.branch?.name || 'Global'}`
    );
  }
  console.log(`\nTotal ACTIVE staff with email: ${staff.length}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
