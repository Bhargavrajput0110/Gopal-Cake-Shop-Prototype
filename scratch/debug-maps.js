const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`BROWSER_CONSOLE [${msg.type()}]:`, msg.text());
  });
  
  page.on('response', resp => {
    if(resp.url().includes('maps.googleapis')) {
      console.log('MAPS_NETWORK:', resp.url(), resp.status());
    }
  });

  try {
    console.log("Navigating to checkout...");
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' });
    console.log("Waiting 5 seconds for maps to load...");
    await page.waitForTimeout(5000);
  } catch (e) {
    console.error("Navigation error:", e);
  } finally {
    await browser.close();
  }
})();
