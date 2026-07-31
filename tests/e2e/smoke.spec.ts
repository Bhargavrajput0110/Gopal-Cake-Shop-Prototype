import { test, expect } from './fixtures/baseTest';
import { fastLogin } from './helpers/auth';

test.describe('Smoke Suite (@smoke)', () => {

  test('POS loads and shows product catalog', async ({ page }) => {
    await fastLogin(page, 'salesKhm');
    await page.goto('/sales');
    // Click LAUNCH POS to get to the POS interface
    await page.getByRole('link', { name: 'LAUNCH POS' }).click();
    
    // Basic sanity check for POS
    await expect(page.locator('text=Walk-in Customer').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Add to Cart")').first()).toBeVisible({ timeout: 15000 });
  });

  test('Chef Dashboard loads correctly', async ({ page }) => {
    await fastLogin(page, 'chefKhm');
    await page.goto('/chef');
    // Check for Chef KDS title instead of Kitchen Production
    await expect(page.getByRole('heading', { name: 'KDS Terminal' }).first()).toBeVisible({ timeout: 15000 });
  });

});
