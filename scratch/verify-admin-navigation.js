const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }, // Desktop
  });
  
  const page = await context.newPage();
  
  // Real login to get NextAuth session using Pinpad UI
  console.log('Logging in...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  
  await page.getByRole('heading', { name: 'Select Your Role' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Admin', exact: true }).click();
  
  await page.getByRole('heading', { name: 'Select Your Profile' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Admin' }).click();
  
  await page.getByRole('button', { name: '1', exact: true }).waitFor({ state: 'visible' });
  for (const digit of '0000') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  
  await page.waitForURL('**/admin', { timeout: 15000 });
  console.log('Login successful');

  const routes = [
    '/admin',
    '/admin/products',
    '/admin/categories',
    '/admin/media',
    '/admin/drivers'
  ];

  let totalErrors = 0;

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Multiple GoTrueClient') && !text.includes('Failed to load resource')) {
        console.error(`Console Error: ${text}`);
        totalErrors++;
      }
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/v1/admin/media') && !response.ok()) {
      console.error(`API Error on ${response.url()}: ${response.status()} ${await response.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.error(`Page Error: ${error.message}`);
    totalErrors++;
  });

  for (const route of routes) {
    console.log(`\nVisiting: ${route}`);
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
    
    // Check Sidebar (desktop)
    const sidebarVisible = await page.isVisible('aside');
    console.log(`- Sidebar Visible: ${sidebarVisible}`);
    
    // Check Topbar
    const topbarVisible = await page.isVisible('header');
    console.log(`- Topbar Visible: ${topbarVisible}`);
    
    const mediaLink = await page.locator('aside').getByText('Media', { exact: true }).isVisible();
    console.log(`- Media Link Present: ${mediaLink}`);

    const driversLink = await page.locator('aside').getByText('Drivers', { exact: true }).isVisible();
    console.log(`- Drivers Link Present: ${driversLink}`);
  }

  // Check Mobile Navigation
  console.log(`\nTesting Responsive/Mobile Nav...`);
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone 6/7/8
  });
  
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  
  await mobilePage.getByRole('heading', { name: 'Select Your Role' }).waitFor({ state: 'visible' });
  await mobilePage.getByRole('button', { name: 'Admin', exact: true }).click();
  
  await mobilePage.getByRole('heading', { name: 'Select Your Profile' }).waitFor({ state: 'visible' });
  await mobilePage.getByRole('button', { name: 'Admin' }).click();
  
  await mobilePage.getByRole('button', { name: '1', exact: true }).waitFor({ state: 'visible' });
  for (const digit of '0000') {
    await mobilePage.getByRole('button', { name: digit, exact: true }).click();
  }
  
  await mobilePage.waitForURL('**/admin', { timeout: 15000 });
  
  // Click mobile hamburger menu
  const menuButton = await mobilePage.locator('button:has(.lucide-menu)');
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await mobilePage.waitForTimeout(500); // Wait for animation
    const mobileMediaLink = await mobilePage.locator('.fixed.inset-0').getByText('Media', { exact: true }).isVisible();
    console.log(`- Mobile Nav Opened: true`);
    console.log(`- Mobile Media Link Present: ${mobileMediaLink}`);
  } else {
    console.log(`- Mobile Nav Button Not Found!`);
    totalErrors++;
  }

  console.log(`\nTotal Errors: ${totalErrors}`);
  
  await browser.close();
  process.exit(totalErrors > 0 ? 1 : 0);
})();
