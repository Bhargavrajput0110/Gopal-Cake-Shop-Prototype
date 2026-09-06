/**
 * Phase 5: Chef Terminal E2E Test
 *
 * Validates the chef workflow using real order data and a real chef account.
 * 
 * Target: UMA Branch
 * Chef: Chef Sanjeev (Uma)
 * Tests:
 *  CHEF-01 — Chef can accept assignment (WAITING_FOR_CHEF -> CHEF_ACCEPTED)
 *  CHEF-02 — Chef can start production (CHEF_ACCEPTED -> MAKING)
 *  CHEF-03 — Invalid transition is rejected (e.g., WAITING_FOR_CHEF -> PACKED)
 *  CHEF-04 — Chef cannot accept order from another branch
 */

import { chromium, BrowserContext, Page } from 'playwright';
import { prisma } from '../src/lib/prisma';

const BASE = 'http://localhost:3000';

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

async function run() {
  console.log('Starting Phase 5: Chef Terminal E2E Tests\n');
  const browser = await chromium.launch({ headless: true });

  // Find a real UMA order item waiting for a chef
  const umaItem = await prisma.orderItem.findFirst({
    where: { 
      status: 'WAITING_FOR_CHEF', 
      order: { 
        branchId: 'uma',
        trackingId: { not: { startsWith: 'GCS-DEMO' } }
      } 
    },
    include: { order: true }
  });

  if (!umaItem) {
    console.log('[SKIP] No WAITING_FOR_CHEF items found in UMA branch. Run a POS/Storefront test to generate one.');
    await browser.close();
    return;
  }
  console.log(`Found UMA item ${umaItem.id} (Order ${umaItem.order.orderNumber}) waiting for chef.`);

  // Find a real KHD order item waiting for a chef (for isolation testing)
  const khdItem = await prisma.orderItem.findFirst({
    where: { 
      status: 'WAITING_FOR_CHEF', 
      order: { branchId: 'khanderao' } 
    }
  }) || umaItem; // Fallback to umaItem if none exists, just to avoid nulls (the test will fail logically if it falls back)

  // 1. Log in as UMA Chef (Chef Sanjeev)
  const umaCtx = await browser.newContext();
  const umaPage = await umaCtx.newPage();
  await loginAs(umaPage, umaCtx, 'Chef', 'Lavkush', '0000', 'Uma Branch');
  console.log('Logged in as Lavkush (Uma)');

  // CHEF-03: Test invalid transition directly
  const invRes = await umaCtx.request.patch(`${BASE}/api/v1/chef/production/${umaItem.id}/status`, {
    data: { status: 'PACKED' }
  });
  if (invRes.status() === 409) {
    console.log(`[PASS] CHEF-03: Invalid transition to PACKED rejected -> status=${invRes.status()}`);
  } else {
    console.log(`[FAIL] CHEF-03: Invalid transition to PACKED -> status=${invRes.status()}`);
  }

  // CHEF-04: Test cross-branch modification (UMA Chef trying to modify KHD order)
  if (khdItem.orderId !== umaItem.orderId) {
    const crossRes = await umaCtx.request.patch(`${BASE}/api/v1/chef/production/${khdItem.id}/status`, {
      data: { action: 'ACCEPT_ASSIGNMENT' }
    });
    if (crossRes.status() === 403) {
      console.log(`[PASS] CHEF-04: Cross-branch assignment rejected -> status=${crossRes.status()}`);
    } else {
      console.log(`[FAIL] CHEF-04: Cross-branch assignment -> status=${crossRes.status()}`);
    }
  } else {
    console.log('[SKIP] CHEF-04: No KHD item available to test cross-branch isolation');
  }

  // CHEF-01: Accept Assignment (WAITING_FOR_CHEF -> CHEF_ACCEPTED)
  const acceptRes = await umaCtx.request.patch(`${BASE}/api/v1/chef/production/${umaItem.id}/status`, {
    data: { action: 'ACCEPT_ASSIGNMENT' }
  });
  if (acceptRes.status() === 200) {
    const body = await acceptRes.json();
    console.log(`[PASS] CHEF-01: Accepted assignment -> status=${body.item.status} assignedTo=${body.item.assignedChefId}`);
  } else {
    console.log(`[FAIL] CHEF-01: Failed to accept assignment -> status=${acceptRes.status()}`);
  }

  // CHEF-02: Start Production (CHEF_ACCEPTED -> MAKING)
  const makeRes = await umaCtx.request.patch(`${BASE}/api/v1/chef/production/${umaItem.id}/status`, {
    data: { status: 'MAKING' }
  });
  if (makeRes.status() === 200) {
    const body = await makeRes.json();
    console.log(`[PASS] CHEF-02: Started production -> status=${body.item.status}`);
  } else {
    const body = await makeRes.json().catch(() => ({}));
    console.log(`[FAIL] CHEF-02: Failed to start production -> status=${makeRes.status()} body=${JSON.stringify(body)}`);
  }

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
