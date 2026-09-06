import { chromium, APIRequestContext, Browser, Page } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function loginAs(page: Page, roleName: string, userName: string, pin: string = '0000', branchName?: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: roleName }).click();
  
  if (branchName && roleName !== 'Admin' && roleName !== 'Vendor') {
    await page.getByRole('button', { name: branchName }).click();
  }

  await page.getByRole('button', { name: new RegExp(userName, "i") }).first().click();

  for (const digit of pin) {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  
  await page.waitForTimeout(2000);
  
  const errorLoc = page.getByText('Invalid PIN');
  if (await errorLoc.isVisible()) {
    throw new Error(`Login failed for ${userName}: Invalid PIN`);
  }
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results: any[] = [];
  
  function addResult(id: string, pre: string, action: string, exp: string, actual: string, pass: boolean, severity: string) {
    results.push({ id, pre, action, exp, actual, pass, severity });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id}: ${action} -> ${actual}`);
  }

  try {
    console.log("Starting RBAC E2E Tests...");

    // Test 1: Salesperson (Sanket)
    await context.clearCookies();
    try {
      await loginAs(page, 'Sales', 'Sanket', '0000', 'Uma Branch');
      const url = page.url();
      const apiContext = context.request;
      const res = await apiContext.get(`${BASE_URL}/api/v1/reporting/dashboard`);
      
      const isSales = url.includes('/sales');
      const apiBlocked = res.status() === 403 || res.status() === 404;
      
      addResult(
        'AUTH-01', 'Sales (Sanket)', 'Attempt admin API', 
        '/sales + 403 API', 
        `${url} + API ${res.status()}`, 
        isSales && apiBlocked, 'High'
      );
    } catch (e: any) {
      addResult('AUTH-01', 'Sales (Sanket)', 'Login', 'Success', `Error: ${e.message}`, false, 'High');
    }

    // Test 2: Chef (Lavkush)
    await context.clearCookies();
    try {
      await loginAs(page, 'Chef', 'Lavkush', '0000', 'Uma Branch');
      const url = page.url();
      addResult('AUTH-02', 'Chef (Lavkush)', 'Access /chef', '/chef', url, url.includes('/chef'), 'Critical');
    } catch (e: any) {
      addResult('AUTH-02', 'Chef (Lavkush)', 'Login', 'Success', `Error: ${e.message}`, false, 'Critical');
    }

    // Test 3: Manager (NOT TESTED - No real Manager)
    addResult('AUTH-03', 'Manager', '/manager', '/manager', 'NOT TESTED - No real manager', false, 'Critical');

    // Test 4: Admin (Rishi Bhai)
    await context.clearCookies();
    try {
      await loginAs(page, 'Admin', 'Rishi Bhai', '0000');
      const url = page.url();
      addResult('AUTH-04', 'Admin (Rishi Bhai)', 'Access /admin', '/admin', url, url.includes('/admin'), 'Critical');
    } catch (e: any) {
      addResult('AUTH-04', 'Admin (Rishi Bhai)', 'Login', 'Success', `Error: ${e.message}`, false, 'Critical');
    }

    // Test 5: Driver (Baggi)
    await context.clearCookies();
    try {
      await loginAs(page, 'Driver', 'Baggi', '0000', 'Uma Branch');
      const url = page.url();
      addResult('AUTH-05', 'Driver (Baggi)', 'Access /driver', '/driver', url, url.includes('/driver'), 'Critical');
    } catch (e: any) {
      addResult('AUTH-05', 'Driver (Baggi)', 'Login', 'Success', `Error: ${e.message}`, false, 'Critical');
    }

    // Test 6: Vendor (Vikas Bhai)
    await context.clearCookies();
    try {
      // Password for Vikas Bhai is 1977
      await loginAs(page, 'Vendor', 'Vikas Bhai', '1977');
      const url = page.url();
      addResult('AUTH-06', 'Vendor (Vikas Bhai)', 'Access /vendor', '/vendor', url, url.includes('/vendor'), 'High');
    } catch (e: any) {
      addResult('AUTH-06', 'Vendor (Vikas Bhai)', 'Login', 'Success', `Error: ${e.message}`, false, 'High');
    }

  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
