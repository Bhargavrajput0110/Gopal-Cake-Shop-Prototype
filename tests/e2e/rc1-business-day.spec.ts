import { test, expect, BrowserContext } from '@playwright/test';

// Stage 5 E2E Sync Matrix
// This test simulates the complete business day flow across multiple browser windows.

test.describe('RC1 Business Day Sync Matrix', () => {
  let customerContext: BrowserContext;
  let posContext: BrowserContext;
  let chefContext: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    customerContext = await browser.newContext();
    posContext = await browser.newContext();
    chefContext = await browser.newContext();
  });

  test.afterAll(async () => {
    await customerContext.close();
    await posContext.close();
    await chefContext.close();
  });

  test('End-to-End Web Order to POS and Chef Sync', async () => {
    test.setTimeout(60000); // 60 seconds

    const customerPage = await customerContext.newPage();
    const posPage = await posContext.newPage();
    const chefPage = await chefContext.newPage();

    // 1. Setup - Log in POS & Chef
    // Using bypass auth headers or mock cookies (auth.ts respects IS_PLAYWRIGHT)
    await posPage.goto('/sales'); // Might redirect to login if mock auth isn't intercepting, but we assume Playwright mock auth handles it.
    await chefPage.goto('/chef');

    // 2. Customer places order
    await customerPage.goto('/');
    
    // We mock the order creation if the UI is too complex, or we can just hit the API from the customer context.
    // For sync testing, hitting the API is fine since we are testing Socket Sync across clients.
    const response = await customerContext.request.post('/api/v1/orders/checkout', {
      data: {
        branchId: 'khanderao',
        customerId: 'usr_mock_customer', // Needs valid ID
        items: [{ productId: 'mock_prod', quantity: 1, weight: 1, price: 500, productName: 'Test Sync Cake' }],
        deliveryType: 'DELIVERY',
        targetDate: new Date().toISOString(),
        paymentMethod: 'CASH',
        paymentType: 'ADVANCE',
        payments: [{ method: 'CASH', amount: 200 }]
      }
    });

    expect(response.ok()).toBeTruthy();
    const orderData = await response.json();
    const orderNumber = orderData.orderNumber;

    // 3. Verify POS updates without refresh (target <= 2s)
    const startTime = Date.now();
    await expect(posPage.locator(`text=${orderNumber}`)).toBeVisible({ timeout: 5000 });
    const posLatency = Date.now() - startTime;
    console.log(`POS Sync Latency: ${posLatency}ms`);
    expect(posLatency).toBeLessThanOrEqual(2500); // Allow slight buffer in CI

    // 4. POS accepts the order (triggers timeline/status)
    await posPage.locator(`text=${orderNumber}`).click();
    await posPage.locator('button:has-text("Accept Order")').click();

    // 5. Verify Chef updates without refresh
    const chefStartTime = Date.now();
    await expect(chefPage.locator(`text=${orderNumber}`)).toBeVisible({ timeout: 5000 });
    const chefLatency = Date.now() - chefStartTime;
    console.log(`Chef Sync Latency: ${chefLatency}ms`);
    expect(chefLatency).toBeLessThanOrEqual(2500);
  });
});
