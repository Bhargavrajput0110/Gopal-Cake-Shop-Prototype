const { chromium } = require('@playwright/test');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Logging in to get session...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Admin', exact: true }).click();
  await page.getByRole('button', { name: 'Admin' }).click();
  for (const digit of '0000') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.waitForURL('**/admin', { timeout: 15000 });
  console.log('Logged in successfully.\n');

  let totalErrors = 0;
  function reportError(msg) {
    console.error(`❌ [ERROR] ${msg}`);
    totalErrors++;
  }
  function reportSuccess(msg) {
    console.log(`✅ [OK] ${msg}`);
  }

  try {
    // We will test concurrency explicitly by fetching a product, then modifying it via API behind the scenes, and trying to modify it via UI.
    console.log('1. Testing Concurrency...');
    
    // Create a product first
    const newProductPayload = {
      name: "Concurrency Test Cake",
      description: "A cake created by API test for concurrency",
      basePrice: 500,
      availableForSale: true
    };
    
    let postRes = await page.evaluate(async (payload) => {
      const r = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: r.status, data: await r.json() };
    }, newProductPayload);
    
    const productId = postRes.data.data.id;
    let productUpdatedAt = postRes.data.data.updatedAt;

    // Simulate Admin B updating the product in the background
    await page.evaluate(async ({ id }) => {
      await fetch(`/api/v1/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePrice: 600 })
      });
    }, { id: productId });

    // Simulate Admin A trying to update using the old timestamp
    let staleUpdateRes = await page.evaluate(async ({ id, staleTime }) => {
      const r = await fetch(`/api/v1/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePrice: 700, currentUpdatedAt: staleTime })
      });
      return { status: r.status, data: await r.json() };
    }, { id: productId, staleTime: productUpdatedAt });

    if (staleUpdateRes.status === 409 && staleUpdateRes.data.code === 'CONCURRENCY_CONFLICT') {
      reportSuccess('Concurrency Control: Blocked stale update successfully (409 Conflict)');
    } else {
      reportError(`Concurrency Control failed: Expected 409, got ${staleUpdateRes.status}`);
    }

    // Clone constraint test
    console.log('\n2. Testing Clone Integrity...');
    let cloneRes = await page.evaluate(async (id) => {
      const r = await fetch(`/api/v1/products/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clone' })
      });
      return { status: r.status, data: await r.json() };
    }, productId);

    const clonedProduct = cloneRes.data.data;
    if (clonedProduct.id !== productId && clonedProduct.name === 'Concurrency Test Cake (Copy)') {
      reportSuccess('Clone Integrity: Unique ID and Modified Name generated successfully');
    } else {
      reportError('Clone Integrity failed');
    }

    // Cleanup
    await page.evaluate(async (id) => fetch(`/api/v1/products/${id}`, { method: 'DELETE' }), productId);
    await page.evaluate(async (id) => fetch(`/api/v1/products/${id}`, { method: 'DELETE' }), clonedProduct.id);

  } catch (e) {
    reportError(`Exception thrown during tests: ${e.message}`);
  }

  console.log(`\nFinished UI/Business Audit Script. Total Errors: ${totalErrors}`);
  await browser.close();
  process.exit(totalErrors > 0 ? 1 : 0);
})();
