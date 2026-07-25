import { chromium } from 'playwright';

async function testOverview() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to live login page...');
  await page.goto('https://gopal-cake-shop-prototype.onrender.com/login');
  await page.getByRole('button', { name: 'Manager' }).click();
  await page.getByRole('button', { name: 'Khanderao Market' }).click();
  await page.getByRole('button', { name: 'Manager KHM' }).click();

  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: '1', exact: true }).click();

  console.log('Waiting 8 seconds for dashboard render...');
  await page.waitForTimeout(8000);
  console.log('Current URL:', page.url());

  const overviewText = await page.textContent('body');
  console.log('\n--- /sales Page Content ---');
  console.log(overviewText?.slice(0, 1500));

  await page.goto('https://gopal-cake-shop-prototype.onrender.com/sales/orders');
  await page.waitForTimeout(5000);
  console.log('\n--- /sales/orders Page Content ---');
  const ordersText = await page.textContent('body');
  console.log(ordersText?.slice(0, 1500));

  await browser.close();
}

testOverview().catch(console.error);
