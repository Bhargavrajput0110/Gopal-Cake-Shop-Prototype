import { prisma } from './src/lib/prisma';

async function run() {
  console.log('='.repeat(70));
  console.log('DELETING REMAINING PLACEHOLDER USERS (NULL EMAILS)');
  console.log('='.repeat(70));

  const remaining = await prisma.user.findMany({
    where: {
      name: { in: ['Sales Uma', 'Manager KHM', 'Driver KHM'] }
    },
    select: { id: true, name: true, email: true }
  });

  console.log(`Found ${remaining.length} remaining placeholders`);
  remaining.forEach(u => console.log(`  - ${u.name} (id=${u.id}, email=${u.email})`));

  if (remaining.length > 0) {
    const ids = remaining.map(u => u.id);
    const result = await prisma.user.deleteMany({
      where: { id: { in: ids } }
    });
    console.log(`\n✅ Deleted ${result.count} users`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
