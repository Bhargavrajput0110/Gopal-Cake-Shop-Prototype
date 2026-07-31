import { test, expect } from './fixtures/baseTest';

test.describe('Authentication & Session Reliability', () => {

  test('Login and Logout Flow via UI', async ({ page }) => {
    await page.goto('/login');
    
    // Select Admin -> System Admin -> PIN
    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    await page.getByRole('button', { name: 'Super Admin', exact: true }).click();
    
    // Enter PIN 1234
    for (const digit of ['1', '2', '3', '4']) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    
    // Wait for redirect to finish
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await expect(page.locator('text=Admin Dashboard').first()).toBeVisible();

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Browser Back Button after Logout', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    await page.getByRole('button', { name: 'Super Admin', exact: true }).click();
    for (const digit of ['1', '2', '3', '4']) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    await expect(page).toHaveURL(/\/admin/);

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login/);

    // Press Back
    await page.goBack();
    
    // Should be redirected back to login or see an unauthorized message, 
    // NOT the protected admin content.
    await expect(page).toHaveURL(/\/login/);
  });

  test('Multi-Tab Behavior', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Login in Tab 1
    await page1.goto('/login');
    await page1.getByRole('button', { name: 'Admin', exact: true }).click();
    await page1.getByRole('button', { name: 'Super Admin', exact: true }).click();
    for (const digit of ['1', '2', '3', '4']) {
      await page1.getByRole('button', { name: digit, exact: true }).click();
    }
    await expect(page1).toHaveURL(/\/admin/);

    // Navigate to admin in Tab 2 (should be allowed because session is shared)
    await page2.goto('/admin');
    await expect(page2.locator('text=Admin Dashboard').first()).toBeVisible();

    // Logout in Tab 1
    await page1.getByRole('button', { name: 'Logout' }).click();
    await expect(page1).toHaveURL(/\/login/);

    // Refresh Tab 2 - should be redirected to login
    await page2.reload();
    await expect(page2).toHaveURL(/\/login/);
  });

});
