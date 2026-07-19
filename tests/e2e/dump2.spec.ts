import { test, expect } from '@playwright/test';
test('dump2', async ({ page }) => {
  await page.goto('/custom');
  await page.waitForLoadState('networkidle');
  await page.locator('button', { hasText: /^1 Kg/ }).click();
  await page.waitForTimeout(1000);
  const buttons = await page.locator('button').allInnerTexts();
  console.log(buttons);
});
