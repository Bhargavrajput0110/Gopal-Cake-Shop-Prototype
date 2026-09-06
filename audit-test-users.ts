import { prisma } from './src/lib/prisma';

async function run() {
  // Find all test/fake users by name pattern
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { name: { startsWith: 'Test User' } },
        { name: { startsWith: 'test_user' } },
        { email: { contains: 'testuser-' } },
        { email: { contains: '@example.com' } },
        { name: 'Sales Uma' },            // placeholder, not real staff
        { name: 'Manager KHM' },          // placeholder
        { name: 'Driver KHM' },           // placeholder
        { name: 'Driver 1' },
        { name: 'Driver 2' },
        { name: 'Driver 3' },
        { name: 'Driver 4' },
        { name: 'Driver 5' },
        { name: 'Driver 6' },
        { name: 'Driver KHM' },
      ]
    },
    select: { id: true, name: true, email: true, role: true, status: true }
  });

  console.log(`Found ${testUsers.length} test/placeholder users:\n`);
  testUsers.forEach(u => console.log(`  ${u.name.padEnd(40)} ${(u.email || 'no-email').padEnd(45)} ${u.role} [${u.status}]`));

  // Also check orders tied to them
  const testIds = testUsers.map(u => u.id);
  const ordersLinked = await prisma.order.count({
    where: { OR: [{ createdBy: { in: testIds } }] }
  });
  console.log(`\nOrders linked to these users: ${ordersLinked}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
