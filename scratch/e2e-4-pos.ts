/**
 * Phase 4: Manager/Sales POS E2E Test
 *
 * Uses Playwright browser sessions with UI PIN-login so NextAuth cookies
 * are present on all API calls (same pattern as Phase 1).
 *
 * Tests:
 *  POS-01 — Walk-in custom cake (SALESPERSON + CASH full payment)
 *  POS-02 — POS CASH → immediate ledger SUCCESS (critical financial invariant)
 *  POS-03 — Partial advance at checkout time (paymentType=PARTIAL, 50% CASH)
 *  POS-04 — Balance payment clears → PAID
 *  POS-05 — Overpayment rejected (amount > balance due)
 *  POS-06 — CHEF role cannot POST to /pos/checkout (RBAC)
 *  POS-07 — Cross-branch payment: KHD salesperson on UMA order
 *            (currently NOT enforced = defect, recorded faithfully)
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { prisma } from '../src/lib/prisma';
import { FinancialService } from '../src/services/FinancialService';

const BASE = 'http://localhost:3000';

type R = { id: string; phase: string; action: string; exp: string; actual: string; pass: boolean; sev: string };
const results: R[] = [];

function log(id: string, phase: string, action: string, exp: string, actual: string, pass: boolean, sev: string) {
  results.push({ id, phase, action, exp, actual, pass, sev });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id}: ${action} -> ${actual}`);
}

async function loginAs(page: Page, context: BrowserContext, roleName: string, userName: string, pin = '0000', branchName?: string) {
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

async function getFirstProduct() {
  const r = await fetch(`${BASE}/api/v1/public/products?limit=100`);
  const d = await r.json();
  return d.data.find((p: any) => p.availableForSale) || d.data[0];
}

async function run() {
  console.log('Starting Phase 4: POS E2E Tests\n');

  const product = await getFirstProduct();
  if (!product) { console.error('FATAL: no product found'); return; }

  const browser = await chromium.launch({ headless: true });
  let posOrderId: string | null = null;    // Fully-paid POS order (POS-01/02/05)
  let partialOrderId: string | null = null; // Partial advance order (POS-03/04)
  let partialTotal = 0;

  // =========================================================
  // Login as Salesperson (Uma) for POS-01/02
  // =========================================================
  const salesCtx = await browser.newContext();
  const salesPage = await salesCtx.newPage();
  try {
    await loginAs(salesPage, salesCtx, 'Sales', 'Ravi Shah', '0000', 'Uma');
  } catch (e: any) {
    log('POS-SETUP', 'Setup', 'Login as Sales/Uma', 'Login succeeds', e.message, false, 'Critical');
    await browser.close(); return;
  }

  // =========================================================
  // POS-01: Walk-in custom cake — CASH full payment at POS
  // =========================================================
  try {
    const res = await salesCtx.request.post(`${BASE}/api/v1/pos/checkout`, {
      data: {
        customerId: 'walk-in',
        branchId: 'uma',
        items: [{
          productId: product.id,
          quantity: 1,
          weight: 1,
          flavor: 'Red Velvet',
          messageOnCake: 'Happy Birthday Test',
          notes: 'Deliver after 6 PM',
          shape: '2 Tiers',
          referenceImages: ['https://example.com/pos-ref.jpg'],
        }],
        payments: [{ method: 'CASH', amount: 1200 }],
        paymentType: 'FULL',
        idempotencyKey: `pos-01-${Date.now()}`,
      },
    });
    const d = await res.json();
    posOrderId = d.orderId;
    log('POS-01', 'POS Checkout', 'Walk-in custom cake (SALESPERSON + CASH)', '200 + orderId',
      `status=${res.status()} orderId=${d.orderId}`, res.status() === 200 && !!d.orderId, 'Critical');
  } catch (e: any) {
    log('POS-01', 'POS Checkout', 'Walk-in custom cake', '200 OK', e.message, false, 'Critical');
  }

  // =========================================================
  // POS-02: POS CASH → immediate ledger SUCCESS invariant
  // =========================================================
  if (posOrderId) {
    try {
      await new Promise(r => setTimeout(r, 400));
      const order = await prisma.order.findUnique({
        where: { id: posOrderId },
        include: { ledgerEntries: true, payments: true }
      });
      const total = Number(order?.totalAmount ?? 0);
      const ledgerOK = order?.ledgerEntries.some(l => l.status === 'SUCCESS') ?? false;
      const payOK = order?.payments.some(p => p.status === 'SUCCESS') ?? false;
      const source = order?.source;
      log('POS-02', 'Financial', 'POS CASH → immediate SUCCESS ledger',
        'source=POS, ledger=SUCCESS, payment=SUCCESS',
        `source=${source} ledgerOK=${ledgerOK} payOK=${payOK} total=₹${total}`,
        ledgerOK && payOK && source === 'POS', 'Critical');
    } catch (e: any) {
      log('POS-02', 'Financial', 'POS immediate SUCCESS', 'Read DB', e.message, false, 'Critical');
    }
  } else {
    log('POS-02', 'Financial', 'POS immediate SUCCESS', 'Requires POS-01', 'SKIPPED', false, 'Critical');
  }

  // =========================================================
  // Login as Manager (Uma) for POS-03/04/05
  // =========================================================
  const mgrCtx = await browser.newContext();
  const mgrPage = await mgrCtx.newPage();
  try {
    await loginAs(mgrPage, mgrCtx, 'Manager', 'Anita Patel', '0000', 'Uma');
  } catch (e: any) {
    log('POS-03a', 'Setup', 'Login as Manager/Uma', 'Login succeeds', e.message, false, 'Critical');
  }

  // =========================================================
  // POS-03: Partial advance at checkout (50% CASH via payments array)
  // Engine: payload.payments.length > 0 branch → SUCCESS for CASH
  // Then remaining balance should be PARTIALLY_PAID
  // =========================================================
  try {
    // First get the real product price to compute 50%
    const priceCheckRes = await mgrCtx.request.post(`${BASE}/api/v1/pos/checkout`, {
      data: {
        customerId: 'walk-in',
        branchId: 'uma',
        items: [{
          productId: product.id,
          quantity: 1,
          weight: 1,
          flavor: 'Classic',
          messageOnCake: 'Congrats',
          notes: 'Partial advance test',
        }],
        payments: [{ method: 'CASH', amount: 1200 }], // full payment first to discover price
        paymentType: 'FULL',
        idempotencyKey: `pos-03-price-${Date.now()}`,
      },
    });
    const priceData = await priceCheckRes.json();
    if (priceCheckRes.status() === 200 && priceData.orderId) {
      const priceOrder = await prisma.order.findUnique({ where: { id: priceData.orderId } });
      partialTotal = Number(priceOrder?.totalAmount ?? 1200);
    } else {
      partialTotal = 1200; // fallback
    }

    const halfAmount = Math.round(partialTotal / 2);
    const remainingAmount = partialTotal - halfAmount;

    // Now create the actual partial order
    const res = await mgrCtx.request.post(`${BASE}/api/v1/pos/checkout`, {
      data: {
        customerId: 'walk-in',
        branchId: 'uma',
        items: [{
          productId: product.id,
          quantity: 1,
          weight: 1,
          flavor: 'Classic',
          messageOnCake: 'Congrats Partial',
          notes: 'Partial advance test',
        }],
        payments: [{ method: 'CASH', amount: halfAmount }], // 50% advance
        paymentType: 'PARTIAL',
        idempotencyKey: `pos-03-${Date.now()}`,
      },
    });

    const d = await res.json();
    partialOrderId = d.orderId;

    if (res.status() === 200 && partialOrderId) {
      log('POS-03a', 'POS Partial', 'Create order with 50% advance (paymentType=PARTIAL)',
        '200 + orderId',
        `status=${res.status()} orderId=${partialOrderId} advance=₹${halfAmount} of ₹${partialTotal}`,
        true, 'Critical');

      // Verify PARTIALLY_PAID via FinancialService
      await new Promise(r => setTimeout(r, 300));
      const summary = await FinancialService.calculateFinancialSummary(partialOrderId);
      const pass = summary.paymentStatus === 'PARTIALLY_PAID'
        && summary.paidAmount === halfAmount
        && summary.outstandingAmount === remainingAmount;

      log('POS-03b', 'Financial', 'After 50% advance → PARTIALLY_PAID',
        'paymentStatus=PARTIALLY_PAID, paid=50%, outstanding=50%',
        `status=${summary.paymentStatus} paid=₹${summary.paidAmount} outstanding=₹${summary.outstandingAmount}`,
        pass, 'Critical');
    } else {
      log('POS-03a', 'POS Partial', 'Create partial order', '200 OK', `status=${res.status()} body=${JSON.stringify(d)}`, false, 'Critical');
      log('POS-03b', 'Financial', 'PARTIALLY_PAID check', 'Requires POS-03a', 'SKIPPED', false, 'Critical');
    }
  } catch (e: any) {
    log('POS-03a', 'POS Partial', 'Partial advance', 'Create+pay', e.message, false, 'Critical');
    log('POS-03b', 'Financial', 'PARTIALLY_PAID check', 'Requires POS-03a', 'SKIPPED', false, 'Critical');
  }

  // =========================================================
  // POS-04: Record balance payment → PAID
  // =========================================================
  if (partialOrderId && partialTotal > 0) {
    try {
      const summaryBefore = await FinancialService.calculateFinancialSummary(partialOrderId);
      const remaining = summaryBefore.outstandingAmount;

      const payRes = await mgrCtx.request.post(`${BASE}/api/v1/orders/${partialOrderId}/payments`, {
        data: { amount: remaining, method: 'UPI' },
      });

      const summaryAfter = await FinancialService.calculateFinancialSummary(partialOrderId);
      const pass = payRes.status() === 200 && summaryAfter.paymentStatus === 'PAID' && summaryAfter.outstandingAmount === 0;

      log('POS-04', 'Financial', 'Balance payment → PAID',
        'paymentStatus=PAID, outstanding=0',
        `status=${payRes.status()} payStatus=${summaryAfter.paymentStatus} outstanding=₹${summaryAfter.outstandingAmount}`,
        pass, 'Critical');
    } catch (e: any) {
      log('POS-04', 'Financial', 'Balance payment → PAID', 'Clear balance', e.message, false, 'Critical');
    }
  } else {
    log('POS-04', 'Financial', 'Balance payment → PAID', 'Requires POS-03', 'SKIPPED', false, 'Critical');
  }

  // =========================================================
  // POS-05: Overpayment rejected (amount > balance on fully-paid order)
  // posOrderId is fully PAID from POS-01/02
  // =========================================================
  if (posOrderId) {
    try {
      const overRes = await mgrCtx.request.post(`${BASE}/api/v1/orders/${posOrderId}/payments`, {
        data: { amount: 9999, method: 'CASH' },
      });
      log('POS-05', 'Validation', 'Overpayment rejected (amount > balance)',
        '400',
        `status=${overRes.status()}`,
        overRes.status() === 400, 'High');
    } catch (e: any) {
      log('POS-05', 'Validation', 'Overpayment rejected', '400', e.message, false, 'High');
    }
  } else {
    log('POS-05', 'Validation', 'Overpayment rejected', 'Requires POS-01', 'SKIPPED', false, 'High');
  }

  // =========================================================
  // POS-06: CHEF cannot access /pos/checkout
  // Using Chef Sanjeev (Uma) — the seeded chef with email
  // =========================================================
  const chefCtx = await browser.newContext();
  const chefPage = await chefCtx.newPage();
  try {
    await loginAs(chefPage, chefCtx, 'Chef', 'Chef Sanjeev', '0000', 'Uma');
    const res = await chefCtx.request.post(`${BASE}/api/v1/pos/checkout`, {
      data: {
        customerId: 'walk-in',
        branchId: 'uma',
        items: [{ productId: product.id, quantity: 1, weight: 1, flavor: 'Classic' }],
        payments: [{ method: 'CASH', amount: 600 }],
        paymentType: 'FULL',
        idempotencyKey: `pos-06-${Date.now()}`,
      },
    });
    log('POS-06', 'RBAC', 'CHEF cannot access POS checkout',
      '401 or 403',
      `status=${res.status()}`,
      res.status() === 401 || res.status() === 403, 'Critical');
  } catch (e: any) {
    log('POS-06', 'RBAC', 'CHEF cannot access POS checkout', '401 or 403', e.message, false, 'Critical');
  }
  await chefCtx.close();

  // =========================================================
  // POS-07: Cross-branch isolation — KHD salesperson on UMA order
  // NOTE: The /orders/:id/payments route does NOT check branch isolation.
  //       This test records the observed behavior (DEFECT if it passes through).
  // =========================================================
  if (posOrderId) {
    const khdCtx = await browser.newContext();
    const khdPage = await khdCtx.newPage();
    try {
      await loginAs(khdPage, khdCtx, 'Sales', 'Priti Mehta', '0000', 'Khanderao');
      const crossRes = await khdCtx.request.post(`${BASE}/api/v1/orders/${posOrderId}/payments`, {
        data: { amount: 100, method: 'CASH' },
      });
      const body = await crossRes.json().catch(() => ({}));
      // Expected: 403. If 400, it only means the balance check tripped (already paid).
      // If 200, that's a real cross-branch bypass.
      const blocked = crossRes.status() === 403 || crossRes.status() === 401;
      const alreadyPaid = crossRes.status() === 400; // balance=0 → overpayment rejection is NOT a security check
      log('POS-07', 'RBAC', 'Cross-branch payment attempt (KHD→UMA order)',
        '403 or 401 (branch isolation)',
        `status=${crossRes.status()} ${alreadyPaid ? '⚠️ Rejected only by overpayment check, NOT branch isolation' : ''} body=${JSON.stringify(body).substring(0, 60)}`,
        blocked, 'Critical');
    } catch (e: any) {
      log('POS-07', 'RBAC', 'Cross-branch payment attempt', 'Blocked', e.message, false, 'Critical');
    }
    await khdCtx.close();
  } else {
    log('POS-07', 'RBAC', 'Cross-branch payment attempt', 'Requires POS-01', 'SKIPPED', false, 'Critical');
  }

  await browser.close();
  await prisma.$disconnect();

  // ---- Print Results ----
  console.log('\n--- MARKDOWN RESULTS ---\n');
  for (const r of results) {
    console.log(`| ${r.id} | ${r.phase} | ${r.action} | ${r.exp} | ${r.actual} | Executed | ${r.pass ? 'PASS' : 'FAIL'} | ${r.sev} |`);
  }
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\nSummary: ${passed} PASS | ${failed} FAIL | ${results.length} Total`);
}

run().catch(e => { console.error(e); process.exit(1); });
