const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ where: { role: 'DELIVERY' }});
  console.log('Drivers:', users.map(u => ({ name: u.name, branchId: u.branchId, deliveryScope: u.deliveryScope })));
  
  const umaBranch = await prisma.branch.findFirst({ where: { name: { contains: 'Uma' } }});
  console.log('Uma Branch ID:', umaBranch ? umaBranch.id : 'NOT FOUND');
}
run().finally(() => prisma.$disconnect());
