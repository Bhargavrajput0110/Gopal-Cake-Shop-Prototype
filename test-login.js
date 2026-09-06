const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const u = await prisma.user.findUnique({where:{id:'usr_admin'}});
  console.log(u);
  if (u) {
    console.log(await bcrypt.compare('0000', u.passwordHash));
  }
}
check().finally(()=>prisma.$disconnect());
