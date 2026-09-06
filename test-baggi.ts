import { prisma } from './src/lib/prisma';
async function run() {
  const user = await prisma.user.findUnique({ where: { id: 'cmswuijfn000v1su3gv1om5h8' }});
  console.log('User:', user);
}
run().finally(() => prisma.$disconnect());
