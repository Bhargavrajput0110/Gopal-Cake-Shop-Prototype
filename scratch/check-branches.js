const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.branch.findMany().then(b => {
  console.log(b.map(br => ({ id: br.id, name: br.name, code: br.code })))
}).finally(() => prisma.$disconnect());
