/**
 * POS-07 Isolated Re-run
 * Cross-branch isolation test:
 * A Varasiya (Factory Warasiya) salesperson tries to record a payment on a UMA order
 * that still has a balance outstanding.
 * 
 * Note: KHD (Khanderao Market) is EXCLUDED from the login page branch selector.
 * Using Naresh Warasiya (Factory Warasiya branch) instead.
 * 
 * Expected: 403 (branch isolation enforced)
 * Known defect: /orders/:id/payments has no branch check → will likely pass (200) = DEFECT
 */
import { chromium } from 'playwright';
import { prisma } from '../src/lib/prisma';
import { FinancialService } from '../src/services/FinancialService';

const BASE = 'http://localhost:3000';

async function loginAs(page: any, context: any, roleName: string, userName: string, pin = '0000', branchName?: string) {
  await context.clearCookies();
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: roleName }).click();
  if (branchName && !['Admin', 'Vendor'].includes(roleName)) {
    await page.getByRole('button', { name: branchName }).click();
  }
  await page.getByRole('button', { name: new RegExp(userName, 'i') }).first().click();
  for (const digit of pin) {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.waitForTimeout(2000);
  if (await page.getByText('Invalid PIN').isVisible()) {
    throw new Error(`Login failed for ${userName}: Invalid PIN`);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. Create an UMA partial order (with outstanding balance) via Manager UMA session
  const mgrCtx = await browser.newContext();
  const mgrPage = await mgrCtx.newPage();
  await loginAs(mgrPage, mgrCtx, 'Manager', 'Anita Patel', '0000', 'Uma Branch');

  const prod = await (await fetch(`${BASE}/api/v1/public/products?limit=1`)).json();
  const product = prod.data[0];

  // Create a PARTIAL order (50% advance) that has outstanding balance
  const res = await mgrCtx.request.post(`${BASE}/api/v1/pos/checkout`, {
    data: {
      customerId: 'walk-in',
      branchId: 'uma',
      items: [{ productId: product.id, quantity: 1, weight: 1, flavor: 'Classic' }],
      payments: [{ method: 'CASH', amount: 15 }],  // partial advance
      paymentType: 'PARTIAL',
      idempotencyKey: `pos07-uma-${Date.now()}`,
    },
  });
  const d = await res.json();
  const umaOrderId = d.orderId;
  console.log(`Created UMA partial order: ${umaOrderId} (HTTP ${res.status()})`);

  if (!umaOrderId) {
    console.log('FAIL: Could not create UMA order for cross-branch test');
    await browser.close();
    return;
  }

  const summaryBefore = await FinancialService.calculateFinancialSummary(umaOrderId);
  console.log(`Order financial state: ${summaryBefore.paymentStatus}, outstanding=₹${summaryBefore.outstandingAmount}`);

  // 2. Login as Varasiya salesperson (different branch from UMA)
  const varCtx = await browser.newContext();
  const varPage = await varCtx.newPage();
  await loginAs(varPage, varCtx, 'Sales', 'Naresh', '0000', 'Factory Warasiya');
  console.log('Varasiya salesperson logged in');

  // 3. Attempt to record a payment on the UMA order
  const crossRes = await varCtx.request.post(`${BASE}/api/v1/orders/${umaOrderId}/payments`, {
    data: { amount: 10, method: 'CASH' },
  });
  const body = await crossRes.json().catch(() => ({}));
  
  const blocked = crossRes.status() === 403 || crossRes.status() === 401;
  const allowed = crossRes.status() === 200;
  
  console.log(`\nPOS-07 Cross-branch result:`);
  console.log(`  Status: ${crossRes.status()}`);
  console.log(`  Body: ${JSON.stringify(body)}`);
  console.log(`  Branch isolation enforced: ${blocked}`);
  
  if (allowed) {
    console.log(`\n⚠️  DEFECT: KHD salesperson recorded payment on UMA order. Branch isolation MISSING on /orders/:id/payments`);
    const summaryAfter = await FinancialService.calculateFinancialSummary(umaOrderId);
    console.log(`  New balance: ₹${summaryAfter.outstandingAmount} (was ₹${summaryBefore.outstandingAmount})`);
  } else if (blocked) {
    console.log(`\n✅ PASS: Cross-branch payment correctly rejected with ${crossRes.status()}`);
  } else {
    console.log(`\n⚠️  Status ${crossRes.status()} — rejected but NOT by branch isolation (possibly overpayment guard)`);
  }

  await browser.close();
  await prisma.$disconnect();
}

run().catch(e => { console.error(e.message); process.exit(1); });
