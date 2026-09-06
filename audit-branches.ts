import { prisma } from './src/lib/prisma';

// Maps each duplicate branch id → its canonical branch id and name
const MIGRATION_MAP: { id: string; canonical: string; canonicalLabel: string }[] = [
  { id: 'elora',                       canonical: 'cmswuiiun00031su3vfrn9eq5', canonicalLabel: 'Ellora Park (ELLORAPARK)' },
  { id: 'varasiya',                    canonical: 'cmswuiiu000021su3kv1mr41f', canonicalLabel: 'Factory Warasiya (WARASIYA)' },
  { id: 'b-001',                       canonical: 'khanderao',                  canonicalLabel: 'Khanderao Market (KHD)' },
  { id: 'BRANCH-A',                    canonical: 'uma',                        canonicalLabel: 'Uma Branch (UMA)' },
  { id: 'default-branch',              canonical: 'uma',                        canonicalLabel: 'Uma Branch (UMA)' },
  { id: 'cmrfv5hab0000h0u3fwuzy9x4',  canonical: 'uma',                        canonicalLabel: 'Uma Branch (UMA)' }, // Mock Branch
];

const CANONICAL_IDS = ['uma', 'cmswuiita00011su3977ajl1z', 'cmswuiiu000021su3kv1mr41f', 'cmswuiiun00031su3vfrn9eq5', 'khanderao'];

async function run() {
  console.log('='.repeat(70));
  console.log('BRANCH REFERENCE AUDIT (pre-migration)');
  console.log('='.repeat(70));

  let grandTotalRefs = 0;

  for (const { id: branchId, canonical, canonicalLabel } of MIGRATION_MAP) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true, name: true, code: true } });
    if (!branch) { console.log(`\n⚠️  Branch "${branchId}" not in DB — skipping`); continue; }

    const [orders, users, transfers] = await Promise.all([
      prisma.order.count({ where: { branchId } }),
      prisma.user.count({ where: { branchId } }),
      prisma.branchTransfer.count({ where: { OR: [{ fromBranchId: branchId }, { toBranchId: branchId }] } }),
    ]);

    const total = orders + users + transfers;
    grandTotalRefs += total;

    console.log(`\n📂 DUPLICATE: "${branch.name}" (id=${branchId}, code=${branch.code})`);
    console.log(`   → Merge into: ${canonicalLabel}`);
    console.log(`   Orders          : ${orders}`);
    console.log(`   Users/Staff     : ${users}`);
    console.log(`   BranchTransfers : ${transfers}`);
    console.log(`   TOTAL REFS      : ${total} ${total === 0 ? '✅ SAFE TO DELETE DIRECTLY' : '⚠️  MUST MIGRATE FIRST'}`);

    if (users > 0) {
      const staffList = await prisma.user.findMany({ where: { branchId }, select: { name: true, role: true, email: true } });
      staffList.forEach(u => console.log(`     👤 ${u.name} (${u.role}) <${u.email}>`));
    }
    if (orders > 0) {
      const sample = await prisma.order.findMany({ where: { branchId }, select: { orderNumber: true, status: true }, take: 5 });
      console.log(`   Sample orders: ${sample.map(o => `${o.orderNumber}(${o.status})`).join(', ')}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`GRAND TOTAL REFERENCES TO MIGRATE: ${grandTotalRefs}`);
  console.log('='.repeat(70));

  console.log('\nCANONICAL BRANCHES (to keep):');
  const canonicals = await prisma.branch.findMany({ where: { id: { in: CANONICAL_IDS } }, select: { id: true, name: true, code: true } });
  for (const b of canonicals) {
    const [orders, users] = await Promise.all([
      prisma.order.count({ where: { branchId: b.id } }),
      prisma.user.count({ where: { branchId: b.id } }),
    ]);
    console.log(`  ${(b.code || 'NULL').padEnd(15)} "${b.name}" orders=${orders} users=${users}`);
  }
  console.log('='.repeat(70));
}

run().catch(console.error).finally(() => prisma.$disconnect());
