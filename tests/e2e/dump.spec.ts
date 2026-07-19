import { test, expect } from '@playwright/test';
test('dump', async ({ page }) => {
  await page.goto('/custom');
  await page.waitForLoadState('networkidle');
  const buttons = await page.locator('button').allInnerTexts();
  console.log(buttons);
});
