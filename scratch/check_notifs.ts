import { prisma } from '../src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, branchId: true, role: true }
  });
  console.log('Users:');
  console.table(users);
  
  const notifs = await prisma.inAppNotification.findMany();
  console.log(`\nTotal InAppNotifications in DB: ${notifs.length}`);
  
  if (notifs.length > 0) {
    console.log('Sample notif userIds:');
    const uids = new Set(notifs.map(n => n.userId));
    console.log(Array.from(uids));
  }
}

main().finally(() => prisma.$disconnect());
