process.env.SKIP_ENV_VALIDATION = 'true';
import { prisma } from '../src/lib/prisma';

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: 'SALESPERSON', status: { not: 'SUSPENDED' } },
    select: { id: true, name: true, phone: true }
  });
  console.log(JSON.stringify(user));
  await prisma.$disconnect();
}
main();
