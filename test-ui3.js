const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000/menu', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: 'menu-screenshot2.png' });
  await browser.close();
})();
