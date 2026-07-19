import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Verification', () => {
  test('Executive Dashboard loads and displays KPI cards', async ({ page }) => {
    // 1. Intercept the Dashboard API and mock the response
    await page.route('**/api/v1/reporting/dashboard*', async route => {
      const json = {
        success: true,
        data: {
          todaysSales: 45000,
          ordersToday: 120,
          pendingOrders: 15,
          lateOrdersCount: 2,
          ordersByStatus: {
            DELIVERED: 80,
            READY_FOR_PICKUP: 10,
            CANCELLED: 3
          },
          branchRanking: [
            { branchId: 'Branch-A', branchName: 'Khanderao Market', revenue: 20000, orders: 50 },
            { branchId: 'Branch-B', branchName: 'Surat', revenue: 15000, orders: 40 }
          ],
          revenueTrend: [
            { date: new Date().toISOString(), revenue: 45000 }
          ]
        }
      };
      await route.fulfill({ json });
    });

    // 2. Navigate to Executive Dashboard
    await page.goto('/admin');
    
    // Wait for the mock API response to populate the UI
    await expect(page.locator('text=Command Center')).toBeVisible();

    // 3. Verify KPIs are displayed correctly
    await expect(page.locator('text=₹45,000')).toBeVisible(); // Revenue
    await expect(page.locator('text=120')).toBeVisible(); // Orders
    await expect(page.locator('text=15')).toBeVisible(); // Pending
    await expect(page.locator('text=2').first()).toBeVisible(); // Kitchen Delay
    
    // 4. Verify Branch rendering
    await expect(page.locator('text=Khanderao Market')).toBeVisible();
    await expect(page.locator('text=₹20,000')).toBeVisible();
  });

  test('Branch Manager Dashboard loads and displays scoped KPIs', async ({ page }) => {
    // 1. Intercept the Dashboard API for Branch Manager
    await page.route('**/api/v1/reporting/dashboard?branchId=Khanderao Market', async route => {
      const json = {
        success: true,
        data: {
          todaysSales: 20000,
          ordersToday: 50,
          pendingOrders: 5,
          lateOrdersCount: 0,
          revenueTrend: [
            { date: new Date().toISOString(), revenue: 20000 }
          ]
        }
      };
      await route.fulfill({ json });
    });

    // 2. Navigate to Manager Dashboard
    await page.goto('/manager');
    
    // Wait for the mock API response to populate the UI
    await expect(page.locator('text=Local Branch Command Center')).toBeVisible();

    // 3. Verify KPIs are displayed correctly
    await expect(page.locator('text=₹20,000')).toBeVisible(); // Revenue
    await expect(page.locator('text=50')).toBeVisible(); // Orders
    await expect(page.locator('text=5')).toBeVisible(); // Pending
  });
});
