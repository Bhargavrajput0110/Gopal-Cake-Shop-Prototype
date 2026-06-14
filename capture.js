const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // iPhone 13 / 14 Viewport
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  
  const captureUrl = async (url, filename) => {
    console.log(`Capturing ${url} to ${filename}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      // Allow time for animations/images to load
      await new Promise(resolve => setTimeout(resolve, 4000));
      await page.screenshot({ path: filename, fullPage: true });
    } catch (e) {
      console.error(`Error capturing ${url}: ${e}`);
    }
  };

  await captureUrl('http://localhost:3000', 'mobile_home.png');
  await captureUrl('http://localhost:3000/menu', 'mobile_menu.png');
  await captureUrl('http://localhost:3000/product/123', 'mobile_product.png');

  await browser.close();
  console.log('Capture complete!');
})();
