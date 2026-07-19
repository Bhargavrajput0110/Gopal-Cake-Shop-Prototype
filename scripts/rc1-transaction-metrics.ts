import 'dotenv/config';
import { StorefrontEngine } from '../src/lib/orders/StorefrontEngine';
import { prisma } from '../src/lib/prisma';
import { performance } from 'perf_hooks';

async function testTransactionPerformance() {
  const branch = await prisma.branch.findFirst({ where: { code: 'KHD' } });
  const product = await prisma.product.findFirst();
  const customer = await prisma.customer.findFirst();

  if (!branch || !product || !customer) {
    throw new Error("Missing seed data.");
  }

  const payload = {
    branchId: branch.id,
    customerId: customer.id,
    items: [{ productId: product.id, quantity: 1, weight: 1, price: 500, productName: product.name }],
    deliveryType: 'PICKUP',
    targetDate: new Date().toISOString(),
    paymentMethod: 'CASH',
    paymentType: 'FULL',
    payments: [{ method: 'CASH', amount: 500 }]
  };

  const iterations = 50;
  const durations: number[] = [];

  console.log(`Running ${iterations} sequential transactions to baseline speed...`);
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await StorefrontEngine.processCheckout(
      { source: 'POS', branchId: branch.id, userId: 'pos-user' },
      payload as any
    );
    const end = performance.now();
    durations.push(end - start);
  }

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const max = Math.max(...durations);
  const min = Math.min(...durations);

  console.log(`Average Transaction Duration: ${avg.toFixed(2)}ms`);
  console.log(`Slowest Transaction: ${max.toFixed(2)}ms`);
  console.log(`Fastest Transaction: ${min.toFixed(2)}ms`);

  process.exit(0);
}

testTransactionPerformance().catch(e => {
  console.error(e);
  process.exit(1);
});
