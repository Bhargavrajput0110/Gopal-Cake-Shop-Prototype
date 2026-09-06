require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { startOfDay, endOfDay } = require('date-fns');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("=== PHASE 2 VERIFICATION ===");
  
  const targetDate = new Date();
  const todayStart = startOfDay(targetDate);
  const todayEnd = endOfDay(targetDate);

  // 1. Total Order Count check
  const baseWhere = {
    createdAt: { gte: todayStart, lte: todayEnd },
    status: { notIn: ['CANCELLED', 'DRAFT'] }
  };

  const totalOrdersDb = await prisma.order.count({ where: baseWhere });
  console.log(`[Verification] Orders Today (Excl. Cancelled/Draft): ${totalOrdersDb}`);

  // Cancelled Orders
  const cancelledOrders = await prisma.order.count({
    where: {
      createdAt: { gte: todayStart, lte: todayEnd },
      status: 'CANCELLED'
    }
  });
  console.log(`[Verification] Cancelled Orders Today: ${cancelledOrders}`);

  // 2. Revenue Verification
  const orderAgg = await prisma.order.aggregate({
    where: baseWhere,
    _sum: { totalAmount: true }
  });
  const todaysSales = Number(orderAgg._sum.totalAmount || 0);
  console.log(`[Verification] Total Revenue (Today): ₹${todaysSales}`);

  // Small known subset of orders to manually verify revenue
  const sampleOrders = await prisma.order.findMany({
    where: baseWhere,
    take: 3,
    select: { orderNumber: true, totalAmount: true, status: true }
  });
  console.log(`[Verification] Sample Orders for Revenue Manual Match:`);
  console.table(sampleOrders.map(o => ({ orderNumber: o.orderNumber, status: o.status, amount: Number(o.totalAmount) })));

  // 3. Category/Product Double Count Check
  const orderItems = await prisma.orderItem.findMany({
    where: { order: baseWhere },
    select: { quantity: true, price: true }
  });
  const itemsRevenue = orderItems.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  console.log(`[Verification] Total Revenue derived from OrderItems: ₹${itemsRevenue}`);
  
  if (itemsRevenue === todaysSales) {
    console.log(`[Verification] Product/Category totals MATCH the total revenue!`);
  } else {
    console.log(`[Verification] WARNING: Product/Category totals (₹${itemsRevenue}) DIFFER from total revenue (₹${todaysSales}). This may be due to delivery fees or discounts applied at the order level.`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
