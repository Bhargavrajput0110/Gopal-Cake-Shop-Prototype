import { chromium } from 'playwright';

async function catchClientError() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('pageerror', (err) => {
    console.error('=== CLIENT PAGE ERROR ===\n', err);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('=== CONSOLE ERROR ===\n', msg.text());
    }
  });

  console.log('Navigating to login page...');
  await page.goto('https://gopal-cake-shop-prototype.onrender.com/login');
  await page.getByRole('button', { name: 'Manager' }).click();
  await page.getByRole('button', { name: 'Khanderao Market' }).click();
  await page.getByRole('button', { name: 'Manager KHM' }).click();

  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: '1', exact: true }).click();

  await page.waitForTimeout(5000);
  console.log('Navigated to /sales. Current URL:', page.url());

  console.log('Navigating to /sales/orders...');
  await page.goto('https://gopal-cake-shop-prototype.onrender.com/sales/orders');
  await page.waitForTimeout(5000);
  console.log('Navigated to /sales/orders. Current URL:', page.url());

  await browser.close();
}

catchClientError().catch(console.error);
