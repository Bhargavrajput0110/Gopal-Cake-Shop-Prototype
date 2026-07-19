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
    // 1. GET /api/v1/products
    console.log('Testing GET /api/v1/products...');
    let getRes = await page.evaluate(async () => {
      const r = await fetch('/api/v1/products');
      return { status: r.status, data: await r.json() };
    });
    if (getRes.status === 200 && getRes.data.success) {
      reportSuccess('GET /api/v1/products returned 200 OK');
    } else {
      reportError(`GET /api/v1/products failed: ${getRes.status} ${JSON.stringify(getRes.data)}`);
    }

    // 2. POST /api/v1/products
    console.log('\nTesting POST /api/v1/products...');
    const newProductPayload = {
      name: "API Test Cake",
      description: "A cake created by API test",
      basePrice: 500,
      availableForSale: true,
      weightVariants: [{ weight: "500g", price: 500 }]
    };
    let postRes = await page.evaluate(async (payload) => {
      const r = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: r.status, data: await r.json() };
    }, newProductPayload);
    
    let createdProductId = null;
    if (postRes.status === 200 && postRes.data.success) {
      createdProductId = postRes.data.data.id;
      reportSuccess(`POST /api/v1/products returned 200 OK (ID: ${createdProductId})`);
    } else {
      reportError(`POST /api/v1/products failed: ${postRes.status} ${JSON.stringify(postRes.data)}`);
    }

    if (createdProductId) {
      // 3. PUT /api/v1/products/:id
      console.log(`\nTesting PUT /api/v1/products/${createdProductId}...`);
      const updatePayload = { basePrice: 600 };
      let putRes = await page.evaluate(async ({ id, payload }) => {
        const r = await fetch(`/api/v1/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return { status: r.status, data: await r.json() };
      }, { id: createdProductId, payload: updatePayload });
      
      if (putRes.status === 200 && putRes.data.success && putRes.data.data.basePrice === 600) {
        reportSuccess(`PUT /api/v1/products/${createdProductId} returned 200 OK and updated price`);
      } else {
        reportError(`PUT failed: ${putRes.status} ${JSON.stringify(putRes.data)}`);
      }

      // 4. POST /api/v1/products/:id (Clone)
      console.log(`\nTesting POST /api/v1/products/${createdProductId} (Action: Clone)...`);
      let cloneRes = await page.evaluate(async (id) => {
        const r = await fetch(`/api/v1/products/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clone' })
        });
        return { status: r.status, data: await r.json() };
      }, createdProductId);

      let clonedProductId = null;
      if (cloneRes.status === 200 && cloneRes.data.success && cloneRes.data.data.name === 'API Test Cake (Copy)') {
        clonedProductId = cloneRes.data.data.id;
        reportSuccess(`Clone returned 200 OK (New ID: ${clonedProductId})`);
      } else {
        reportError(`Clone failed: ${cloneRes.status} ${JSON.stringify(cloneRes.data)}`);
      }

      // 5. DELETE /api/v1/products/:id (Soft delete/Archive)
      console.log(`\nTesting DELETE /api/v1/products/${createdProductId}...`);
      let deleteRes = await page.evaluate(async (id) => {
        const r = await fetch(`/api/v1/products/${id}`, { method: 'DELETE' });
        return { status: r.status, data: await r.json() };
      }, createdProductId);

      if (deleteRes.status === 200 && deleteRes.data.success) {
        reportSuccess(`DELETE /api/v1/products/${createdProductId} returned 200 OK`);
      } else {
        reportError(`DELETE failed: ${deleteRes.status} ${JSON.stringify(deleteRes.data)}`);
      }

      // 6. Verify GET excludes archived by default, includes with isArchived=true
      let getArchivedRes = await page.evaluate(async (id) => {
        const r1 = await fetch('/api/v1/products');
        const d1 = await r1.json();
        const r2 = await fetch('/api/v1/products?isArchived=true');
        const d2 = await r2.json();
        return { activeItems: d1.data.items, archivedItems: d2.data.items };
      }, createdProductId);

      const inActive = getArchivedRes.activeItems.some(i => i.id === createdProductId);
      const inArchived = getArchivedRes.archivedItems.some(i => i.id === createdProductId);
      
      if (!inActive && inArchived) {
        reportSuccess(`Archive visibility rules verified (Not in active list, exists in archived list)`);
      } else {
        reportError(`Visibility rules failed: inActive=${inActive}, inArchived=${inArchived}`);
      }

      // Clean up cloned product
      if (clonedProductId) {
        await page.evaluate(async (id) => fetch(`/api/v1/products/${id}`, { method: 'DELETE' }), clonedProductId);
      }
    }
  } catch (e) {
    reportError(`Exception thrown during tests: ${e.message}`);
  }

  console.log(`\nFinished API Audit. Total Errors: ${totalErrors}`);
  await browser.close();
  process.exit(totalErrors > 0 ? 1 : 0);
})();
