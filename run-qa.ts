import { chromium } from 'playwright';
import { prisma } from './src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function runQA() {
  console.log("Starting QA Automation...");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Helper to login
  async function loginAs(roleName: string, userName: string, pin: string = '0000') {
    console.log(`\n--- Logging in as ${roleName} (${userName}) ---`);
    await page.goto('http://localhost:3000/login');
    
    await page.getByRole('button', { name: roleName, exact: true }).click();
    
    // For roles like Admin/Vendor, there's no branch selection. For others, we might need to select branch.
    // In our test we just use Admin and Vendor, which skip branch selection.
    
    await page.getByRole('button', { name: new RegExp(userName, "i") }).first().click();
    
    for (const digit of pin) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    
    await page.waitForTimeout(2000);
    // Check if there was an error
    const errorLoc = page.getByText('Invalid PIN');
    if (await errorLoc.isVisible()) {
      throw new Error(`Login failed for ${userName}: Invalid PIN`);
    }
    console.log(`Successfully logged in as ${roleName}`);
    return context.request;
  }

  try {
    // PHASE 1: FINANCIAL WORKFLOWS
    console.log("\n=== PHASE 1: FINANCIAL WORKFLOWS ===");
    
    // Use unauthenticated context for public checkout API
    let apiContext = context.request;
    
    const branchId = "cmswuiiun00031su3vfrn9eq5";
    const productId = "cmsjy6omi000gtcu39fm7li8v";

    // 1. Create a controlled test order via API (Website COD)
    console.log("Creating ₹1000 Website COD order...");
    const checkoutRes = await apiContext.post(`http://localhost:3000/api/v1/public/checkout`, {
      data: {
        customer: { name: "QA Tester", phone: "9999999999" },
        items: [{
          productId: productId,
          name: "Test Cake",
          price: 1000,
          quantity: 1,
          weight: 1
        }],
        branchId: branchId,
        deliveryType: "DELIVERY",
        deliveryDate: new Date(Date.now() + 86400000).toISOString(),
        address: { house: '123', street: 'QA St', area: 'Test', city: 'QA City', pin: '380001' },
        paymentMethod: "CASH",
        paymentType: "FULL",
        idempotencyKey: `qa-test-${Date.now()}`
      }
    });
    const checkoutJson = await checkoutRes.json();
    if (!checkoutJson.success) throw new Error("Checkout failed: " + JSON.stringify(checkoutJson));
    const orderId = checkoutJson.orderId;
    console.log(`Created order ${orderId}`);

    // Login as Admin to check status and process payments
    apiContext = await loginAs('Admin', 'Admin');

    // Verify initial status via API
    // Note: API returns paidAmount, pendingBalance, and financialStatus now instead of cashCollectedAmount.
    let statusRes = await apiContext.get(`http://localhost:3000/api/v1/orders/${orderId}`);
    let statusJson = await statusRes.json();
    let paid = statusJson.data.paidAmount || 0;
    let bal = statusJson.data.pendingBalance;
    let st = statusJson.data.financialStatus;
    console.log(`Initial Status -> PAID=₹${paid} BALANCE=₹${bal} STATUS=${st}`);
    
    // Assert initial state is UNPAID (or PENDING)
    // NOTE: In the API, 0 paid means UNPAID.
    if (st !== 'UNPAID' || paid !== 0) {
      throw new Error(`Expected UNPAID, got ${st} with paid=${paid}`);
    }
    console.log("✅ Initial UNPAID state correct");

    // Record ₹100 payment
    console.log(`Recording ₹100 payment...`);
    const pay1 = await apiContext.post(`http://localhost:3000/api/v1/orders/${orderId}/payments`, {
      data: { amount: 100, method: 'CASH' }
    });
    const pay1Json = await pay1.json();
    console.log('Payment 1:', pay1Json);
    if (!pay1Json.success) throw new Error("Payment 1 failed");

    statusRes = await apiContext.get(`http://localhost:3000/api/v1/orders/${orderId}`);
    statusJson = await statusRes.json();
    paid = statusJson.data.paidAmount || 0;
    st = statusJson.data.financialStatus;
    console.log(`After ₹100 -> PAID=₹${paid} STATUS=${st}`);
    if (paid !== 100 || st !== 'PARTIALLY_PAID') {
      throw new Error(`Expected PARTIALLY_PAID and ₹100, got ${st} and ₹${paid}`);
    }
    console.log("✅ PARTIALLY_PAID state correct");

    // Test Overpayment
    console.log(`Testing overpayment of ₹1001...`);
    const overpaymentRes = await apiContext.post(`http://localhost:3000/api/v1/orders/${orderId}/payments`, {
      data: { amount: 1001, method: 'UPI' }
    });
    if (overpaymentRes.status() === 200) {
      throw new Error("Assertion failed: Overpayment of 1001 was allowed!");
    }
    console.log(`✅ Overpayment rejected (Status: ${overpaymentRes.status()})`);

    // Record remaining ₹79.5 payment
    console.log(`Recording ₹79.5 payment...`);
    const pay3 = await apiContext.post(`http://localhost:3000/api/v1/orders/${orderId}/payments`, {
      data: { amount: 79.5, method: 'UPI' }
    });
    const pay3Json = await pay3.json();
    console.log('Payment 3:', pay3Json);
    if (!pay3Json.success) throw new Error("Payment 3 failed");

    statusRes = await apiContext.get(`http://localhost:3000/api/v1/orders/${orderId}`);
    statusJson = await statusRes.json();
    paid = statusJson.data.paidAmount || 0;
    st = statusJson.data.financialStatus;
    console.log(`After remaining ₹79.5 -> PAID=₹${paid} STATUS=${st}`);
    if (paid !== 179.5 || st !== 'PAID') {
      throw new Error(`Expected PAID and ₹179.5, got ${st} and ₹${paid}`);
    }
    console.log("✅ PAID state correct");


    // PHASE 6: RBAC
    console.log("\n=== PHASE 6: RBAC ===");
    
    // Log out (clear cookies)
    await context.clearCookies();

    // Customer trying to hit Admin API
    const unauthRes = await apiContext.get(`http://localhost:3000/api/v1/reporting/dashboard`);
    console.log(`Unauthenticated Dashboard Request Status: ${unauthRes.status()}`);
    if (unauthRes.status() !== 401 && unauthRes.status() !== 403) throw new Error("Expected 401/403 for unauth");

    // Log in as Vendor
    const vendorApi = await loginAs('Vendor', 'Vendor Photo', '7777');
    const vendorRes = await vendorApi.get(`http://localhost:3000/api/v1/reporting/dashboard`);
    console.log(`Vendor Dashboard Request Status: ${vendorRes.status()}`);
    if (vendorRes.status() !== 401 && vendorRes.status() !== 403) throw new Error("Expected 401/403 for vendor");

    console.log("\n✅ All assertions passed successfully!");
  } catch (err) {
    console.error("\n❌ Test failed:", err);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

runQA();
