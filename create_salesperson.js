const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // First, ensure we have a branch
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Main Branch',
        code: 'MAIN01',
        address: '123 Main St, Vadodara'
      }
    });
  }

  // Check if a sales person already exists
  const existing = await prisma.user.findFirst({
    where: { role: 'SALESPERSON' }
  });

  if (existing) {
    console.log('Salesperson already exists: ', existing.name);
    return;
  }

  // Create a new sales person
  const salesperson = await prisma.user.create({
    data: {
      name: 'Raju Bhai (Sales)',
      email: 'raju@gopalcake.com',
      username: 'rajusales',
      phone: '+919876543210',
      passwordHash: 'not_needed_for_pin', // PIN login is bypassed or mocked
      role: 'SALESPERSON',
      status: 'ACTIVE',
      branchId: branch.id
    }
  });

  console.log('Successfully created salesperson profile:', salesperson.name);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
