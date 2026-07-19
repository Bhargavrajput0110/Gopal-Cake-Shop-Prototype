import { test, expect, Page } from '@playwright/test';

/**
 * Mock login data matching src/app/login/page.tsx static staffList + branchList.
 * IDs '1'-'5' trigger the e2e-bypass-auth cookie path in LoginClient.tsx.
 *
 * staffList entries:
 *   { id: "1", name: "Admin",       role: "admin"   }
 *   { id: "2", name: "Manager KHM", role: "manager", branchId: "b2" }
 *   { id: "3", name: "Sales KHM",   role: "sales",   branchId: "b2" }
 *   { id: "4", name: "Chef KHM",    role: "chef",    branchId: "b2" }
 *   { id: "5", name: "Driver KHM",  role: "driver",  branchId: "b2" }
 *
 * branchList:
 *   { id: "b1", name: "Uma Branch" }
 *   { id: "b2", name: "Khanderao Branch (HQ)" }
 */
const ROLES = {
  admin:   { roleLabel: 'Admin',   pin: '0000', dashboard: '/admin',    branch: null,                    profileName: 'Admin'       },
  manager: { roleLabel: 'Manager', pin: '4444', dashboard: '/manager',  branch: 'Khanderao Branch (HQ)', profileName: 'Manager KHM' },
  sales:   { roleLabel: 'Sales',   pin: '1111', dashboard: '/sales',    branch: 'Khanderao Branch (HQ)', profileName: 'Sales KHM'   },
  chef:    { roleLabel: 'Chef',    pin: '2222', dashboard: '/chef',      branch: 'Khanderao Branch (HQ)', profileName: 'Chef KHM'    },
  driver:  { roleLabel: 'Driver',  pin: '3333', dashboard: '/delivery', branch: 'Khanderao Branch (HQ)', profileName: 'Driver KHM'  },
};

async function loginAs(page: Page, roleKey: keyof typeof ROLES) {
  const role = ROLES[roleKey];
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Step 1: Select Role — wait for "Select Your Role" heading first
  await page.getByRole('heading', { name: 'Select Your Role' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: role.roleLabel, exact: true }).click();

  // Step 2: Select Branch (non-admin only)
  if (role.branch) {
    await page.getByRole('heading', { name: 'Select Your Branch' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: role.branch, exact: true }).click();
  }

  // Step 3: Select Staff Profile — wait for "Select Your Profile" heading
  await page.getByRole('heading', { name: 'Select Your Profile' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: role.profileName }).click();

  // Step 4: Enter 4-digit PIN — wait for PIN pad (digit "1" button)
  await page.getByRole('button', { name: '1', exact: true }).waitFor({ state: 'visible' });
  for (const digit of role.pin) {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }

  // Wait for redirect to role dashboard
  await page.waitForURL(new RegExp(role.dashboard), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test.describe('RC1 Runtime Verification', () => {

  const checkPage = async (page: Page, url: string, name: string) => {
    const errors: string[] = [];

    page.on('pageerror', error => {
      errors.push(`[pageerror] ${error.message}`);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore expected auth errors from unauthenticated API polling on mount
        if (
          text.includes('the server responded with a status of 401') ||
          text.includes('ERR_ABORTED') ||
          text.includes('net::ERR_')
        ) return;
        errors.push(`[console.error] ${text}`);
      }
    });

    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give React time to fully hydrate

    await page.screenshot({
      path: `playwright-report/screenshots/rc1-${name}.png`,
      fullPage: true
    });

    expect(errors, `Page "${name}" (${url}) has runtime errors:\n${errors.join('\n')}`).toHaveLength(0);
  };

  // ── Public ─────────────────────────────────────────────────────────────────

  test('Module: Login Page', async ({ page }) => {
    await checkPage(page, '/login', 'login');
  });

  // ── Admin ──────────────────────────────────────────────────────────────────

  test('Module: Admin Dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    await checkPage(page, '/admin', 'admin-dashboard');
  });

  test('Module: Admin Orders', async ({ page }) => {
    await loginAs(page, 'admin');
    await checkPage(page, '/admin/orders', 'admin-orders');
  });

  test('Module: Admin Products', async ({ page }) => {
    await loginAs(page, 'admin');
    await checkPage(page, '/admin/products', 'admin-products');
  });

  test('Module: Admin Categories', async ({ page }) => {
    await loginAs(page, 'admin');
    await checkPage(page, '/admin/categories', 'admin-categories');
  });

  test('Module: Admin Design Library', async ({ page }) => {
    await loginAs(page, 'admin');
    await checkPage(page, '/admin/design-library', 'admin-design-library');
  });

  // ── Sales ──────────────────────────────────────────────────────────────────

  test('Module: Sales Dashboard', async ({ page }) => {
    await loginAs(page, 'sales');
    await checkPage(page, '/sales', 'sales-dashboard');
  });

  test('Module: Sales POS', async ({ page }) => {
    await loginAs(page, 'sales');
    await checkPage(page, '/sales/pos', 'sales-pos');
  });

  // ── Chef ───────────────────────────────────────────────────────────────────

  test('Module: Chef KDS', async ({ page }) => {
    await loginAs(page, 'chef');
    await checkPage(page, '/chef', 'chef-kds');
  });

  // ── Driver ─────────────────────────────────────────────────────────────────

  test('Module: Driver Dashboard', async ({ page }) => {
    await loginAs(page, 'driver');
    await checkPage(page, '/delivery', 'driver-delivery');
  });

  // ── Manager ────────────────────────────────────────────────────────────────

  test('Module: Manager Dashboard', async ({ page }) => {
    await loginAs(page, 'manager');
    await checkPage(page, '/manager', 'manager-dashboard');
  });
});
