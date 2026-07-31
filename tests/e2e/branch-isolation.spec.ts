import { test, expect } from './fixtures/baseTest';
import { fastLogin } from './helpers/auth';

test.describe('Branch Isolation', () => {
  test('Chef from Uma branch cannot see Khanderao orders', async ({ page }) => {
    await fastLogin(page, 'chefUma');
    await page.goto('/chef');
    
    // We expect the Chef view for Uma branch to load, but NOT contain any Khanderao references.
    await expect(page.getByRole('heading', { name: 'KDS Terminal' })).toBeVisible();
    await expect(page.locator('text=Khanderao')).toHaveCount(0);
  });
});
