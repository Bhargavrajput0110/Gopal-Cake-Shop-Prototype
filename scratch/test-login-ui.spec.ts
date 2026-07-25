import { test, expect } from '@playwright/test';

test('Verify orders display on Sales overview and Orders page', async ({ page }) => {
  console.log('Navigating to live login page...');
  await page.goto('https://gopal-cake-shop-prototype.onrender.com/login');

  // Step 1: Select Manager -> Khanderao Market -> Manager KHM
  await page.getByRole('button', { name: 'Manager' }).click();
  await page.getByRole('button', { name: 'Khanderao Market' }).click();
  await page.getByRole('button', { name: 'Manager KHM' }).click();

  // Enter PIN 1111
  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: '1', exact: true }).click();

  await page.waitForTimeout(5000);
  console.log('Current URL after login:', page.url());

  // Check /sales content
  const overviewContent = await page.textContent('body');
  console.log('Overview page snippet:', overviewContent?.slice(0, 400));

  // Navigate to /sales/orders
  console.log('Navigating to /sales/orders...');
  await page.goto('https://gopal-cake-shop-prototype.onrender.com/sales/orders');
  await page.waitForTimeout(4000);

  const ordersContent = await page.textContent('body');
  console.log('Orders page snippet:', ordersContent?.slice(0, 500));

  expect(ordersContent).toContain('ORD-');
});
