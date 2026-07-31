import { Page, expect } from '@playwright/test';
import { TEST_USERS, TestUserKey, DEFAULT_PIN } from '../fixtures/users';

/**
 * Standardized login helper that replaces brittle UI login flows.
 * Uses the seeded `1234` PIN by default and waits for the page to fully load.
 */
export async function fastLogin(page: Page, userKey: TestUserKey) {
  const user = TEST_USERS[userKey];
  
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400); // Wait for entrance animations
  
  // Click Role
  await page.getByRole('button', { name: user.roleName, exact: true }).click();
  await page.waitForTimeout(300); // Wait for transition animation

  // Click Branch (if applicable)
  if (user.branchName) {
    await page.getByRole('button', { name: user.branchName, exact: true }).click();
    await page.waitForTimeout(300);
  }

  // Click Profile Name
  await page.getByRole('button', { name: user.name }).click();

  // Wait for PIN pad screen to be visible and animation to settle
  await expect(page.getByText('Enter your 4-digit PIN')).toBeVisible();
  await page.waitForTimeout(300);

  // Enter PIN
  for (const digit of DEFAULT_PIN) {
    await page.getByRole('button', { name: digit, exact: true }).click({ force: true });
  }
  
  // Wait for login to complete and navigate away from login page
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('load'); // Ensure the destination page is fully loaded
}
