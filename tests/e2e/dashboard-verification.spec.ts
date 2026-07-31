import { test, expect } from '@playwright/test';
import { fastLogin } from './helpers/auth';

test.describe('Dashboard E2E Verification', () => {
  test('Executive Dashboard loads and displays KPI cards', async ({ page }) => {
    // Navigate to Executive Dashboard
    await fastLogin(page, 'admin');
    await page.goto('/admin');
    
    // Wait for the UI to load
    await expect(page.locator('text=Command Center')).toBeVisible();

    // Verify KPIs are displayed correctly (behavior/presence based)
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Completed Orders')).toBeVisible();
    await expect(page.locator('text=Pending Orders')).toBeVisible();
    await expect(page.locator('text=Ready Orders')).toBeVisible();
    
    // Verify Branch tabs rendering
    await expect(page.getByRole('button', { name: 'Khanderao' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Uma' })).toBeVisible();

    // Verify 7-Day trend chart is present
    await expect(page.locator('text=7-Day Revenue Trend')).toBeVisible();
  });

  test('Branch Manager Dashboard loads and displays scoped KPIs', async ({ page }) => {
    // Navigate to Manager Dashboard
    await fastLogin(page, 'managerKhm');
    await page.goto('/manager');
    
    // Wait for the UI to load
    await expect(page.locator('text=Command Center').or(page.locator('text=Manager'))).toBeVisible();

    // Verify KPIs are displayed correctly (behavior/presence based)
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Pending Orders')).toBeVisible();
  });
});
