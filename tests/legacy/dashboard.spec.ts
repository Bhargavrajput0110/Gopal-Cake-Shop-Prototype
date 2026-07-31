import { test, expect } from './fixtures/baseTest';
import { fastLogin } from './helpers/auth';

test.describe('Admin Dashboard', () => {

  test('Dashboard loads metrics', async ({ page }) => {
    await fastLogin(page, 'admin');
    await page.goto('/admin');
    
    await expect(page.locator('text=Command Center').first()).toBeVisible();
    // Assuming UI has KPI widgets
    await expect(page.locator('text=Total Orders')).toBeVisible();
  });

});
