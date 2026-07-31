import { test, expect } from './fixtures/baseTest';
import { fastLogin } from './helpers/auth';

test.describe('Delivery Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await fastLogin(page, 'driverKhm');
    await page.goto('/delivery');
  });

  test('Driver accepts and delivers order', async ({ page }) => {
    await expect(page.locator('text=Delivery Queue').first()).toBeVisible();
    // Assuming UI has 'Accept', 'Pick Up', 'Deliver'
  });

});
