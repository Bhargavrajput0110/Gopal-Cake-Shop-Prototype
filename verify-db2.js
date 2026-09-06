require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

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
  
  await prisma.$disconnect();
}

main().catch(console.error);
