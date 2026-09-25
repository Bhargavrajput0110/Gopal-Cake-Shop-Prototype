require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.inAppNotification.count();
  console.log('Total notifs:', c);
  
  const notifs = await prisma.inAppNotification.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log('Recent notifs:', notifs);
  
  const users = await prisma.user.findMany({
    where: { role: 'SALESPERSON' }
  });
  console.log('Salespeople:', users.map(u => ({ id: u.id, name: u.name, branchId: u.branchId })));
}

main().finally(() => prisma.$disconnect());
