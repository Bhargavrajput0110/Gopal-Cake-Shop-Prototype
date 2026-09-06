const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to localhost:3000
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Wait a few seconds for video to play
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'screenshot.png' });
  
  await browser.close();
  console.log('Screenshot taken!');
})();
