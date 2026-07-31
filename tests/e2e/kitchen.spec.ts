import { test, expect } from './fixtures/baseTest';
import { fastLogin } from './helpers/auth';

test.describe('Kitchen Workflow', () => {

  test('Chef processes order (Golden Path)', async ({ page }) => {
    const cakeName = `Golden Path Cake ${Date.now()}`;
    // 1. Seed a Khanderao order waiting for kitchen acceptance
    const res = await page.request.post('/api/orders', {
      data: {
        customerName: "Chef Golden Path",
        customerPhone: "9876543210",
        branch: "khanderao",
        subtotal: 1200,
        grandTotal: 1200,
        timeTarget: new Date(Date.now() + 86400000).toISOString(),
        status: "WAITING_FOR_CHEF",
        items: [{ name: cakeName, qty: 1, weight: "1kg" }]
      }
    });
    expect(res.ok()).toBeTruthy();

    // 2. Log in as Khanderao Chef
    await fastLogin(page, 'chefKhm');
    await page.goto('/chef');
    
    await expect(page.getByRole('heading', { name: /KDS Terminal/i })).toBeVisible();

    // 3. Verify order appears in Queue tab and accept it
    await expect(page.getByText(cakeName)).toBeVisible({ timeout: 15000 });
    const orderCard = page.locator('.rounded-xl').filter({ hasText: cakeName });
    await orderCard.getByRole('button', { name: /Accept Order/i }).click();

    // Wait for order to leave Queue tab
    await expect(page.getByText(cakeName)).toBeHidden();

    // 4. Switch to Active tab and verify order is being made
    await page.getByRole('button', { name: /^Active/i }).click();
    await expect(page.getByText(cakeName)).toBeVisible();

    // 5. Mark order as Ready
    await orderCard.getByRole('button', { name: /Mark Ready/i }).click();

    // Wait for order to leave Active tab
    await expect(page.getByText(cakeName)).toBeHidden();

    // 6. Verify order has moved to the Ready tab
    await page.getByRole('button', { name: /^Ready/i }).click();
    await expect(page.getByText(cakeName)).toBeVisible();
  });

});

test.describe('Branch Isolation', () => {
  test('Chef from Uma branch cannot see Khanderao orders', async ({ page }) => {
    const khdCake = `Khanderao Secret Cake ${Date.now()}`;
    const umaCake = `Uma Branch Cake ${Date.now()}`;
    // 1. Seed orders for both branches
    await page.request.post('/api/orders', {
      data: {
        customerName: "Khanderao Customer",
        customerPhone: "9876543211",
        branch: "khanderao",
        subtotal: 800,
        grandTotal: 800,
        timeTarget: new Date(Date.now() + 86400000).toISOString(),
        status: "WAITING_FOR_CHEF",
        items: [{ name: khdCake, qty: 1, weight: "1kg" }]
      }
    });

    await page.request.post('/api/orders', {
      data: {
        customerName: "Uma Customer",
        customerPhone: "9876543212",
        branch: "uma",
        subtotal: 900,
        grandTotal: 900,
        timeTarget: new Date(Date.now() + 86400000).toISOString(),
        status: "WAITING_FOR_CHEF",
        items: [{ name: umaCake, qty: 1, weight: "1kg" }]
      }
    });

    // 2. Log in as Uma Chef
    await fastLogin(page, 'chefUma');
    await page.goto('/chef');

    // 3. Verify Uma order is visible while Khanderao order is isolated
    await expect(page.getByText(umaCake)).toBeVisible();
    await expect(page.getByText(khdCake)).toHaveCount(0);

    // 4. Verify Station selector is locked for the chef
    const stationSelect = page.locator('select').first();
    await expect(stationSelect).toBeDisabled();
  });
});
