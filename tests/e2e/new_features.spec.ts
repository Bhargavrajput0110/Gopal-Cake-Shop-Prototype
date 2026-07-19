import { test, expect, request } from '@playwright/test';

// Helper for Tomorrow's Date in YYYY-MM-DD
function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

test.describe('Milestone 5 New Features E2E Tests', () => {

  test.beforeAll(async () => {
    // Seed the database
    const apiContext = await request.newContext();
    const response = await apiContext.post('http://localhost:3000/api/admin/seed');
    expect(response.ok()).toBeTruthy();
    await apiContext.dispose();
  });

  test('1. Dynamic product page displays details correctly', async ({ page }) => {
    // Navigate to a seeded product page
    await page.goto('/product/classic-chocolate-cake');
    await page.waitForLoadState('networkidle');

    // Verify product name
    const title = page.locator('h1').filter({ hasText: 'Classic Chocolate Cake' });
    await expect(title).toBeVisible();

    // Verify starting price
    await expect(page.locator('text=₹450')).toBeVisible();

    // Verify description is present
    await expect(page.locator('text=Description')).toBeVisible();

    // Verify allergens section is present
    await expect(page.locator('text=Ingredients & Allergens')).toBeVisible();

    // Verify customized order button is present
    const orderBtn = page.getByRole('link', { name: 'Order This Cake (Customize)' }).or(page.getByRole('button', { name: 'Order This Cake (Customize)' }));
    await expect(orderBtn).toBeVisible();
  });

  test('2. Admin panel renders 3 charts', async ({ page }) => {
    // Log in as Admin using custom PIN keypad
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Select Role
    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    // Select Profile
    await page.getByRole('button', { name: 'Admin', exact: true }).click();

    // Press PIN digits: 0000
    for (const digit of '0000') {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }

    // Wait for redirect to admin command center
    await page.waitForURL(/\/admin/);
    await page.waitForLoadState('networkidle');

    // Verify presence of 3 charts
    const charts = page.locator('.recharts-responsive-container');
    await expect(charts).toHaveCount(3);
  });

  test('3. Admin reviews moderation interface displays reviews table and action buttons', async ({ page }) => {
    // Log in as Admin using custom PIN keypad
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    await page.getByRole('button', { name: 'Admin', exact: true }).click();

    for (const digit of '0000') {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }

    await page.waitForURL(/\/admin/);

    // Go to reviews moderation page
    await page.goto('/admin/reviews');
    await page.waitForLoadState('networkidle');

    // Verify reviews table is visible
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verify column headers
    await expect(page.locator('th:has-text("Customer & Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Product Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Rating")')).toBeVisible();
    await expect(page.locator('th:has-text("Comment")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();

    // Verify presence of Approve and Hide action buttons
    const approveBtn = page.getByRole('button', { name: 'Approve' }).first();
    const hideBtn = page.getByRole('button', { name: 'Hide' }).first();
    await expect(approveBtn.or(hideBtn)).toBeVisible();
  });

  test('4. Download Invoice button on order tracking page works', async ({ page }) => {
    // Place an order first to get to order tracking page
    await page.goto('/custom');
    await page.waitForLoadState('networkidle');

    // Select Weight (1 Kg)
    await page.locator('button:has-text("1 Kg")').first().click();

    // Select Flavour (Pineapple)
    await page.locator('button:has-text("Pineapple")').first().click();

    // Fill date
    await page.locator('input[type="date"]').fill(getTomorrowDateString());

    // Fill phone number
    await page.locator('input[type="tel"]').fill('9876543210');

    // Ensure Store Pickup is selected
    await page.getByRole('button', { name: 'Store Pickup', exact: true }).click();

    // Click Pay & Confirm
    const payBtn = page.getByRole('button', { name: /Pay ₹\d+ & Confirm/ });
    await expect(payBtn).toBeEnabled();
    await payBtn.click();

    // Wait for redirect to order status tracking page
    await page.waitForURL(/\/order\/[a-zA-Z0-9\-]+/);
    await expect(page).toHaveURL(/\/order\/[a-zA-Z0-9\-]+/);

    // Verify Download Invoice button is present
    const downloadBtn = page.getByRole('button', { name: 'Download Invoice', exact: true });
    await expect(downloadBtn).toBeVisible();

    // Simulate clicking the download button and verify it downloads a file
    const downloadPromise = page.waitForEvent('download');
    await downloadBtn.click();
    const download = await downloadPromise;

    // Verify that the file downloads successfully and filename matches pattern
    expect(download.suggestedFilename()).toContain('invoice-');
  });

});