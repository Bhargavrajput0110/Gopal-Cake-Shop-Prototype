import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: [] });
async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(x => x.name).join(', '));
}
main().finally(() => prisma.$disconnect());
