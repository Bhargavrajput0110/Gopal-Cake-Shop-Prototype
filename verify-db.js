const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const customerCount = await prisma.customer.count();
  const productCount = await prisma.product.count();
  const orderCount = await prisma.order.count();
  const branchCount = await prisma.branch.count();

  console.log(`Users: ${userCount}`);
  console.log(`Customers: ${customerCount}`);
  console.log(`Products: ${productCount}`);
  console.log(`Orders: ${orderCount}`);
  console.log(`Branches: ${branchCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
