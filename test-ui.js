const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));
  page.on('response', response => {
    if (!response.ok()) console.log('BROWSER RESPONSE NOT OK:', response.url(), response.status());
  });
  
  try {
    await page.goto('http://localhost:3000/menu', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
  } catch(e) {
    console.error('ERROR GOTO:', e);
  }
  await browser.close();
})();
