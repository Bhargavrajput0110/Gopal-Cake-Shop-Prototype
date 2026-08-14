import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const orderId = 'cmsbt5321000fjsu3qmjo9woj';
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true }
  });
  
  if (!order) {
    console.log('Order not found');
    return;
  }
  
  const orderTotal = Number(order.totalAmount);
  const paymentTotal = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  
  console.log('--- RECONCILIATION CHECK ---');
  console.log(`Order Total:   ₹${orderTotal}`);
  console.log(`Payment Total: ₹${paymentTotal}`);
  console.log(`Matches:       ${orderTotal === paymentTotal ? '✅ YES' : '❌ NO'}`);
  console.log('----------------------------');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
