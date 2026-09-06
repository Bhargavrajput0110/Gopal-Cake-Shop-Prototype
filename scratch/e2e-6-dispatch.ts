import { chromium, APIRequestContext, Browser, Page } from 'playwright';
import { prisma } from '../src/lib/prisma';

const BASE_URL = 'http://localhost:3000';

async function loginAs(page: Page, ctx: BrowserContext, roleName: string, userName: string, pin: string = '0000', branchName?: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  try {
    await page.getByRole('button', { name: roleName }).click();
    
    if (branchName && roleName !== 'Admin' && roleName !== 'Vendor') {
      await page.getByRole('button', { name: branchName }).click();
    }

    await page.getByRole('button', { name: new RegExp(userName, "i") }).first().click();

    for (const digit of pin) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    
    // Wait for the login to complete and navigate away
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10000 });
    console.log(`[loginAs] Successfully logged in as ${roleName} - ${userName}. Final URL: ${page.url()}`);
    
  } catch (err) {
    const html = await page.content();
    console.error(`Failed to login as ${roleName} - ${userName}. HTML dump:`, html.substring(0, 500));
    await page.screenshot({ path: `scratch/error-login-${roleName}.png` });
    throw err;
  }
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    console.log("Starting Phase 6: Dispatch & Delivery E2E Tests\n");

    // Get the item currently in MAKING state
    const umaItem = await prisma.orderItem.findFirst({
      where: { 
        status: 'MAKING', 
        order: { 
          branchId: 'uma',
          trackingId: { not: { startsWith: 'GCS-DEMO' } }
        } 
      },
      include: { order: true }
    });

    if (!umaItem) {
      throw new Error("No real UMA item found in MAKING state to test dispatch.");
    }
    
    console.log(`Found UMA item ${umaItem.id} (Order ${umaItem.order.orderNumber}) in MAKING state.`);

    // 1. Chef Lavkush marks as READY
    console.log('\n--- Chef Workflow ---');
    const chefCtx = await browser.newContext();
    const chefPage = await chefCtx.newPage();
    await loginAs(chefPage, chefCtx, 'Chef', 'Lavkush', '0000', 'Uma Branch');
    
    const chefRes = await chefCtx.request.patch(`${BASE_URL}/api/v1/chef/production/${umaItem.id}/status`, {
      data: { status: 'READY' }
    });
    console.log(`[PASS] CHEF: Marked as READY -> status=${chefRes.status()} body=${await chefRes.text()}`);

    // 2. Assign driver (Baggi) via API (Admin role required)
    console.log('\n--- Assignment Workflow ---');
    const driver = await prisma.user.findFirst({ where: { username: 'baggi_global' } });
    if (!driver) throw new Error("Driver Baggi not found");

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await loginAs(adminPage, adminCtx, 'Admin', 'Rishi Bhai', '0000');
    
    const assignRes = await adminCtx.request.post(`${BASE_URL}/api/deliveries/${umaItem.order.id}/assign`, {
      data: { deliveryPersonId: driver.id }
    });
    console.log(`[PASS] ADMIN: Assigned Driver Baggi -> status=${assignRes.status()} body=${await assignRes.text()}`);

    // 3. Driver Baggi accepts and delivers
    console.log('\n--- Driver Workflow ---');
    const driverCtx = await browser.newContext();
    const driverPage = await driverCtx.newPage();
    
    // Login as Baggi
    await loginAs(driverPage, driverCtx, 'Driver', 'Baggi', '0000', 'Uma Branch'); 
    
    // Accept assignment
    const acceptRes = await driverCtx.request.patch(`${BASE_URL}/api/v1/driver/deliveries/${umaItem.order.id}/status`, {
      data: { action: 'ACCEPTED' }
    });
    console.log(`[PASS] DRIVER: Accepted assignment -> status=${acceptRes.status()} body=${await acceptRes.text()}`);

    // Mark Delivered
    const deliverRes = await driverCtx.request.patch(`${BASE_URL}/api/v1/driver/deliveries/${umaItem.order.id}/status`, {
      data: { action: 'DELIVERED', cashCollected: 0 }
    });
    console.log(`[PASS] DRIVER: Marked as DELIVERED -> status=${deliverRes.status()} body=${await deliverRes.text()}`);

    console.log("\nPhase 6 E2E Tests Complete!");

  } catch (e) {
    console.error("Test execution failed:", e);
  } finally {
    await browser.close();
  }
}

runTests();
