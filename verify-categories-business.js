const { chromium } = require('playwright');
const assert = require('assert');

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Logging in to get session...");
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Admin', exact: true }).click();
  await page.getByRole('button', { name: 'Admin' }).click();
  for (const digit of '0000') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.waitForURL('**/admin', { timeout: 15000 });
  console.log("Logged in successfully.\n");

  let errors = 0;
  const timestamp = Date.now();
  const categoryName = `Business Audit Category ${timestamp}`;
  const categorySlug = `business-audit-category-${timestamp}`;
  
  try {
    // 1. Create Category
    let createRes = await page.evaluate(async (payload) => {
      const r = await fetch('/api/v1/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: r.status, data: await r.json() };
    }, { name: categoryName, slug: categorySlug, displayOrder: 1, status: 'active' });

    assert.strictEqual(createRes.status, 200, "Expected 200 OK for Category Creation");
    const categoryId = createRes.data.data.id;
    const initialUpdatedAt = createRes.data.data.updatedAt;
    console.log(`✅ [OK] Category created via API (ID: ${categoryId}, Slug: ${categorySlug})`);

    // 2. Assign Product to Category
    const productName = `Category Audit Cake ${timestamp}`;
    let productRes = await page.evaluate(async (payload) => {
      const r = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: r.status, data: await r.json() };
    }, {
      name: productName,
      description: 'Testing Category Rules',
      basePrice: 500,
      categoryId: categoryId,
      availableForSale: true
    });
    
    if (productRes.status !== 200) {
      console.error("Product Creation Error:", productRes.data);
    }
    assert.strictEqual(productRes.status, 200, "Expected 200 OK for Product Creation");
    const productId = productRes.data.data.id;
    console.log(`✅ [OK] Product created and assigned to Category (ProductID: ${productId})`);

    // 3. Category Propagation & Product Filtering
    let storefrontRes = await page.evaluate(async (id) => {
      const r = await fetch(`/api/v1/products?categoryId=${id}`);
      return { status: r.status, data: await r.json() };
    }, categoryId);
    
    assert.strictEqual(storefrontRes.status, 200);
    assert(storefrontRes.data.data.items.some(p => p.id === productId), "Product should appear when filtering by category in Storefront");
    console.log(`✅ [OK] Category Propagation Verified: Product visible under category in Storefront API`);

    // 4. Concurrency Test
    let staleUpdateRes = await page.evaluate(async (payload) => {
      const r = await fetch(`/api/v1/categories/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: r.status, data: await r.json() };
    }, { 
      id: categoryId, 
      name: "Stale Name Attempt", 
      currentUpdatedAt: new Date(Date.now() - 100000).toISOString() // 100s ago
    });

    assert.strictEqual(staleUpdateRes.status, 409, "Expected 409 Conflict for stale update");
    assert.strictEqual(staleUpdateRes.data.code, 'CONCURRENCY_CONFLICT');
    console.log(`✅ [OK] Concurrency Verified: Stale update rejected with 409 Conflict`);

    // 5. Category Rename
    const newName = `Renamed Category ${timestamp}`;
    let renameRes = await page.evaluate(async (payload) => {
      const r = await fetch(`/api/v1/categories/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: r.status, data: await r.json() };
    }, { 
      id: categoryId, 
      name: newName, 
      currentUpdatedAt: initialUpdatedAt 
    });

    assert.strictEqual(renameRes.status, 200, "Expected 200 OK for rename");
    console.log(`✅ [OK] Category Rename Verified: Name updated to ${newName}`);
    
    // Verify product still linked
    let renameStorefrontRes = await page.evaluate(async (id) => {
      const r = await fetch(`/api/v1/products?categoryId=${id}`);
      return { status: r.status, data: await r.json() };
    }, categoryId);
    assert(renameStorefrontRes.data.data.items.some(p => p.id === productId), "Product should STILL appear under category after rename");
    console.log(`✅ [OK] Rename Propagation Verified: Product remained linked after rename`);

    // 6. Category Delete Validation
    let deleteRes = await page.evaluate(async (id) => {
      const r = await fetch(`/api/v1/categories/${id}`, { method: 'DELETE' });
      return { status: r.status, data: await r.json() };
    }, categoryId);

    assert.strictEqual(deleteRes.status, 409, "Expected 409 Conflict when deleting category with products");
    assert.strictEqual(deleteRes.data.code, 'CATEGORY_HAS_PRODUCTS');
    console.log(`✅ [OK] Deletion Rules Verified: Blocked deletion of category containing products`);

    // 7. Category Archive
    let archiveRes = await page.evaluate(async (payload) => {
      const r = await fetch(`/api/v1/categories/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: r.status, data: await r.json() };
    }, { 
      id: categoryId, 
      status: 'archived',
      currentUpdatedAt: renameRes.data.data.updatedAt
    });
    
    assert.strictEqual(archiveRes.status, 200);
    console.log(`✅ [OK] Category Archived via API`);

    // Verify products remain available
    let allProductsRes = await page.evaluate(async () => {
      const r = await fetch(`/api/v1/products`);
      return { status: r.status, data: await r.json() };
    });
    assert(allProductsRes.data.data.items.some(p => p.id === productId), "Product from archived category should still be in 'All Products'");
    console.log(`✅ [OK] Archiving Rules Verified: Product from archived category remains active`);

  } catch (err) {
    console.error(`❌ [ERROR] Exception thrown during tests: ${err.message}`);
    errors++;
  } finally {
    console.log(`\nFinished Business Audit Script. Total Errors: ${errors}`);
    await browser.close();
    process.exit(errors > 0 ? 1 : 0);
  }
}

run();
