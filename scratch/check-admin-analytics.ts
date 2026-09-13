import { prisma } from '../src/lib/prisma';
import { FinancialService } from '../src/services/FinancialService';

async function checkAnalytics() {
  const totalOrdersCount = await prisma.order.count();
  console.log('Total Orders in DB:', totalOrdersCount);

  const orders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      branchId: true,
      createdAt: true,
      targetDate: true,
      customer: { select: { name: true, phone: true } },
      ledgerEntries: true,
      payments: true,
    }
  });

  console.log('Recent 10 Orders:');
  for (const o of orders) {
    const summary = await FinancialService.calculateFinancialSummary(o.id);
    console.log(`- Order #${o.orderNumber || o.id.slice(0, 8)} | Status: ${o.status} | Branch: ${o.branchId} | Total: ₹${o.totalAmount} | Paid: ₹${summary.paidAmount} | Due: ₹${summary.outstandingAmount} | Created: ${o.createdAt.toISOString()}`);
  }
}

checkAnalytics().catch(console.error).finally(() => prisma.$disconnect());
