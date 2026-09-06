import { prisma } from './src/lib/prisma';

/**
 * BRANCH CONSOLIDATION MIGRATION
 * 
 * Merges 6 duplicate branches into the 4 canonical branches.
 * Migrates all Orders and Users safely before deleting duplicates.
 * Does NOT delete production data — only reassigns branchId references.
 */

const MIGRATIONS: { fromId: string; toId: string; fromName: string; toName: string }[] = [
  { fromId: 'elora',                      toId: 'cmswuiiun00031su3vfrn9eq5', fromName: 'Elora',             toName: 'Ellora Park' },
  { fromId: 'varasiya',                   toId: 'cmswuiiu000021su3kv1mr41f', fromName: 'Varasiya',          toName: 'Factory Warasiya' },
  { fromId: 'b-001',                      toId: 'khanderao',                 fromName: 'Khanderao Market b-001', toName: 'Khanderao Market' },
  { fromId: 'BRANCH-A',                   toId: 'uma',                       fromName: 'Main Branch BRANCH-A',   toName: 'Uma Branch' },
  { fromId: 'default-branch',             toId: 'uma',                       fromName: 'Main Branch default',    toName: 'Uma Branch' },
  { fromId: 'cmrfv5hab0000h0u3fwuzy9x4', toId: 'uma',                       fromName: 'Mock Branch',        toName: 'Uma Branch' },
];

// Pre-migration counts
const preCounts: Record<string, { orders: number; users: number }> = {};

async function run() {
  console.log('='.repeat(70));
  console.log('BRANCH CONSOLIDATION — MIGRATION SCRIPT');
  console.log(new Date().toISOString());
  console.log('='.repeat(70));

  // PRE-MIGRATION SNAPSHOT
  const totalOrdersBefore = await prisma.order.count();
  const totalUsersBefore = await prisma.user.count();
  console.log(`\nPRE-MIGRATION SNAPSHOT`);
  console.log(`  Total orders: ${totalOrdersBefore}`);
  console.log(`  Total users : ${totalUsersBefore}`);

  // STEP 1: Migrate all references
  console.log('\n' + '='.repeat(70));
  console.log('STEP 1: MIGRATING REFERENCES');
  console.log('='.repeat(70));

  for (const { fromId, toId, fromName, toName } of MIGRATIONS) {
    const branch = await prisma.branch.findUnique({ where: { id: fromId } });
    if (!branch) {
      console.log(`⚠️  "${fromName}" (${fromId}) not found — skipping`);
      preCounts[fromId] = { orders: 0, users: 0 };
      continue;
    }

    const orderCount = await prisma.order.count({ where: { branchId: fromId } });
    const userCount = await prisma.user.count({ where: { branchId: fromId } });
    preCounts[fromId] = { orders: orderCount, users: userCount };

    console.log(`\n→ Migrating "${fromName}" → "${toName}"`);
    console.log(`  Orders to migrate: ${orderCount}`);
    console.log(`  Users to migrate : ${userCount}`);

    if (orderCount > 0) {
      const result = await prisma.order.updateMany({ where: { branchId: fromId }, data: { branchId: toId } });
      console.log(`  ✅ Orders migrated: ${result.count}`);
    }

    if (userCount > 0) {
      const result = await prisma.user.updateMany({ where: { branchId: fromId }, data: { branchId: toId } });
      console.log(`  ✅ Users migrated : ${result.count}`);
    }

    if (orderCount === 0 && userCount === 0) {
      console.log(`  ✅ No references — safe to delete directly`);
    }
  }

  // STEP 2: Verify zero references remain before deletion
  console.log('\n' + '='.repeat(70));
  console.log('STEP 2: VERIFYING ZERO REFERENCES REMAIN');
  console.log('='.repeat(70));

  let safeToDelete = true;
  for (const { fromId, fromName } of MIGRATIONS) {
    const branch = await prisma.branch.findUnique({ where: { id: fromId } });
    if (!branch) { console.log(`  ⚠️  "${fromName}" not in DB`); continue; }

    const orders = await prisma.order.count({ where: { branchId: fromId } });
    const users = await prisma.user.count({ where: { branchId: fromId } });

    if (orders > 0 || users > 0) {
      console.log(`  ❌ "${fromName}" still has refs: orders=${orders} users=${users} — ABORT`);
      safeToDelete = false;
    } else {
      console.log(`  ✅ "${fromName}" — 0 references remaining`);
    }
  }

  if (!safeToDelete) {
    console.log('\n🔴 ABORT: Some branches still have references. Not deleting.');
    process.exit(1);
  }

  // STEP 3: Delete duplicate branches
  console.log('\n' + '='.repeat(70));
  console.log('STEP 3: DELETING DUPLICATE BRANCHES');
  console.log('='.repeat(70));

  for (const { fromId, fromName } of MIGRATIONS) {
    try {
      await prisma.branch.delete({ where: { id: fromId } });
      console.log(`  ✅ Deleted: "${fromName}" (${fromId})`);
    } catch (e: any) {
      console.log(`  ⚠️  Could not delete "${fromName}": ${e.message}`);
    }
  }

  // STEP 4: Post-migration verification
  console.log('\n' + '='.repeat(70));
  console.log('STEP 4: POST-MIGRATION VERIFICATION');
  console.log('='.repeat(70));

  const totalOrdersAfter = await prisma.order.count();
  const totalUsersAfter = await prisma.user.count();
  const remainingBranches = await prisma.branch.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } });

  console.log(`\n  Total orders: ${totalOrdersBefore} → ${totalOrdersAfter} ${totalOrdersAfter === totalOrdersBefore ? '✅' : '❌ MISMATCH!'}`);
  console.log(`  Total users : ${totalUsersBefore} → ${totalUsersAfter} ${totalUsersAfter === totalUsersBefore ? '✅' : '❌ MISMATCH!'}`);
  console.log(`  Remaining branches (${remainingBranches.length}):`);
  remainingBranches.forEach(b => console.log(`    ${b.code?.padEnd(15)} "${b.name}" (${b.id})`));

  const expectedBranches = ['uma', 'cmswuiita00011su3977ajl1z', 'cmswuiiu000021su3kv1mr41f', 'cmswuiiun00031su3vfrn9eq5', 'khanderao'];
  const remainingIds = remainingBranches.map(b => b.id);
  const allCanonicalPresent = expectedBranches.every(id => remainingIds.includes(id));
  const noDuplicatesLeft = MIGRATIONS.every(({ fromId }) => !remainingIds.includes(fromId));

  console.log(`\n  All 4 canonical branches present: ${allCanonicalPresent ? '✅' : '❌'}`);
  console.log(`  No duplicate branches remain    : ${noDuplicatesLeft ? '✅' : '❌'}`);

  if (allCanonicalPresent && noDuplicatesLeft && totalOrdersAfter === totalOrdersBefore && totalUsersAfter === totalUsersBefore) {
    console.log('\n🟢 MIGRATION COMPLETE — All checks passed.');
  } else {
    console.log('\n🔴 MIGRATION ISSUES DETECTED — Review output above.');
  }
  console.log('='.repeat(70));
}

run().catch(console.error).finally(() => prisma.$disconnect());
