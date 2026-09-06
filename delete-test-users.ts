import { prisma } from './src/lib/prisma';

/**
 * DELETE TEST/PLACEHOLDER USERS
 * 
 * Deletes confirmed fake users: Test User *, Driver 1-6, Sales Uma, Manager KHM,
 * Driver KHM, Load Test. These accounts were created during dev/testing and are
 * not part of the 32-person official staff spec.
 * 
 * NEVER touches the 32 spec staff (gopalcake.internal emails).
 */

async function run() {
  console.log('='.repeat(70));
  console.log('DELETING TEST/PLACEHOLDER USERS');
  console.log(new Date().toISOString());
  console.log('='.repeat(70));

  const usersBefore = await prisma.user.count();
  console.log(`\nUsers before: ${usersBefore}`);

  // Identify test users by pattern — NEVER match gopalcake.internal emails
  const testUsers = await prisma.user.findMany({
    where: {
      AND: [
        { email: { not: { endsWith: '@gopalcake.internal' } } },  // NEVER delete real staff
        {
          OR: [
            { name: { startsWith: 'Test User' } },
            { email: { endsWith: '@example.com' } },
            { email: { endsWith: '@test.com' } },
            { name: 'Sales Uma' },
            { name: 'Manager KHM' },
            { name: 'Driver KHM' },
            { name: 'Driver 1' }, { name: 'Driver 2' }, { name: 'Driver 3' },
            { name: 'Driver 4' }, { name: 'Driver 5' }, { name: 'Driver 6' },
            { name: 'Load Test' },
          ]
        }
      ]
    },
    select: { id: true, name: true, email: true, role: true }
  });

  console.log(`\nTest users to delete: ${testUsers.length}`);
  testUsers.forEach(u => console.log(`  - ${u.name} <${u.email}> [${u.role}]`));

  if (testUsers.length === 0) {
    console.log('\n✅ No test users found.');
    return;
  }

  const testIds = testUsers.map(u => u.id);

  // Safety check: these must not be authors of any production orders
  // (Order.createdBy is a string field, not a FK relation in this schema)
  // We'll check the count directly with raw
  const ordersCreatedByTest = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*) as count FROM "public"."Order" WHERE "createdById" = ANY($1::text[])`,
    testIds
  );
  const orderCount = Number(ordersCreatedByTest[0]?.count ?? 0);
  console.log(`\nOrders referencing test users as creator: ${orderCount}`);

  if (orderCount > 0) {
    // Null out the createdById on those orders before deleting users
    await prisma.$executeRawUnsafe(
      `UPDATE "public"."Order" SET "createdById" = NULL WHERE "createdById" = ANY($1::text[])`,
      testIds
    );
    console.log(`  ✅ Cleared createdById on ${orderCount} orders`);
  }

  // Delete the test users
  const result = await prisma.user.deleteMany({
    where: {
      id: { in: testIds },
      email: { not: { endsWith: '@gopalcake.internal' } } // double-safety guard
    }
  });

  console.log(`\n✅ Deleted ${result.count} test users`);

  // Post-deletion verification
  const usersAfter = await prisma.user.count();
  console.log(`\nUsers: ${usersBefore} → ${usersAfter} (removed ${usersBefore - usersAfter})`);

  // Verify spec staff untouched
  const specStaff = await prisma.user.count({ where: { email: { endsWith: '@gopalcake.internal' } } });
  console.log(`Spec staff (gopalcake.internal): ${specStaff} ${specStaff === 32 ? '✅' : '❌ MISMATCH — CHECK IMMEDIATELY'}`);

  console.log('\n' + '='.repeat(70));
  if (specStaff === 32 && result.count === testUsers.length) {
    console.log('🟢 CLEANUP COMPLETE — All checks passed.');
  } else {
    console.log('🔴 ISSUES DETECTED — Review output above.');
  }
  console.log('='.repeat(70));
}

run().catch(console.error).finally(() => prisma.$disconnect());
