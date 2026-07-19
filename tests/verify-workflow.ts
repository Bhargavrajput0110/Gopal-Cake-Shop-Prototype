import { prisma } from '../src/lib/prisma';
async function main() {
  const order = await prisma.order.findFirst();
  console.log(order);
}
main();
