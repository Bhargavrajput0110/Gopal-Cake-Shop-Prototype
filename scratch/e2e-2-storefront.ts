import { chromium, Page } from 'playwright';

const BASE_URL = 'http://localhost:3000';

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
    console.log("Starting Storefront E2E Tests...");

    // Test 1: Real Products API
    try {
      const apiContext = context.request;
      const res = await apiContext.get(`${BASE_URL}/api/v1/public/products?limit=100`);
      const data = await res.json();
      
      const hasProducts = data.data && data.data.length > 0;
      const hasImages = hasProducts && data.data.some((p: any) => p.thumbnail || p.largeImage || p.imageUrl);
      const pass = res.status() === 200 && hasProducts && hasImages;
      
      addResult('STORE-01', 'Public API', 'Fetch Products', '200 OK, returns real products with images', `Status: ${res.status()}, count: ${data.data?.length}, hasImages: ${hasImages}`, pass, 'Critical');
    } catch (e: any) {
      addResult('STORE-01', 'Public API', 'Fetch Products', '200 OK', e.message, false, 'Critical');
    }

    // Test 2: Categories API
    try {
      const apiContext = context.request;
      const res = await apiContext.get(`${BASE_URL}/api/v1/public/categories`);
      const data = await res.json();
      
      const hasCategories = Array.isArray(data) && data.length > 0;
      // Ensure we don't have mock data like "id: 'mock'"
      const hasMock = hasCategories && data.some((c: any) => c.id === 'mock');
      
      const pass = res.status() === 200 && hasCategories && !hasMock;
      
      addResult('STORE-02', 'Public API', 'Fetch Categories', '200 OK, no mock data', `Status: ${res.status()}, count: ${hasCategories ? data.length : 0}, hasMock: ${hasMock}`, pass, 'Critical');
    } catch (e: any) {
      addResult('STORE-02', 'Public API', 'Fetch Categories', '200 OK', e.message, false, 'Critical');
    }

    // Test 3: Product UI
    try {
      await page.goto(`${BASE_URL}/menu`);
      await page.waitForLoadState('networkidle');
      
      // Wait for products to load
      const productCards = page.locator('h3.font-display');
      const count = await productCards.count();
      
      const pass = count > 0;
      
      addResult('STORE-03', 'Customer Storefront', 'Load Menu Page', 'Displays product cards', `Count: ${count}`, pass, 'Critical');
    } catch (e: any) {
      addResult('STORE-03', 'Customer Storefront', 'Load Menu Page', 'Displays product cards', e.message, false, 'Critical');
    }

    // Output Markdown
    console.log("\n--- MARKDOWN RESULTS ---\n");
    for (const r of results) {
      console.log(`| ${r.id} | ${r.pre} | ${r.action} | ${r.exp} | ${r.actual} | Executed | ${r.pass ? 'PASS' : 'FAIL'} | ${r.severity} |`);
    }

  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
