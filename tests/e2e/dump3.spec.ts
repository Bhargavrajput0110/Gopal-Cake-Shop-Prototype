import { test, expect } from '@playwright/test';
test('dump3', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('requestfailed', request => console.log('FAILED:', request.url(), request.failure()?.errorText));
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('API RESPONSE:', response.url(), response.status());
    }
  });
  page.on('dialog', async dialog => {
    console.log('DIALOG:', dialog.message());
    await dialog.accept();
  });

  await page.goto('/custom');
  await page.waitForLoadState('networkidle');
  await page.locator('button', { hasText: /^1 Kg/ }).first().click();
  await page.locator('button', { hasText: /^Pineapple/ }).first().click();
  await page.locator('input[type="date"]').fill(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  await page.locator('input[type="tel"]').fill('9876543210');
  await page.getByRole('button', { name: 'Store Pickup', exact: true }).click();
  
  const payBtn = page.getByRole('button', { name: /Pay ₹\d+ & Confirm/ });
  await payBtn.click();
  
  await page.waitForTimeout(5000);
  console.log('URL IS NOW:', page.url());
});
