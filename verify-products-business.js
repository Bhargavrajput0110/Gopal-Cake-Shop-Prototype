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
    // 1. Create product via API
    const newProductPayload = {
      name: "Business Audit Cake",
      description: "Testing historical data integrity",
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
    reportSuccess(`Product created via API (ID: ${productId})`);

    // 2. Create an order with this product via POS Checkout
    let branchRes = await page.evaluate(async () => {
      const r = await fetch('/api/v1/branches');
      return await r.json();
    });
    const validBranchId = branchRes.data[0]?.id || "cmrbk9z0p00016o506z2m39z5";

    const checkoutPayload = {
      customerId: "walk-in",
      branchId: validBranchId,
      paymentType: "FULL",
      payments: [{ method: "CASH", amount: 500 }],
      items: [{
        productId: productId,
        quantity: 1,
        weight: 1,
        flavor: "Vanilla",
        messageOnCake: "Test"
      }]
    };

    let checkoutRes = await page.evaluate(async (payload) => {
      const r = await fetch('/api/v1/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: r.status, data: await r.json() };
    }, checkoutPayload);

    console.log("Checkout Response:", checkoutRes);

    const orderId = checkoutRes.data.orderId;
    if (!orderId) {
       reportError(`Checkout failed: ${JSON.stringify(checkoutRes.data)}`);
       process.exit(1);
    }
    reportSuccess(`Order created via Checkout API (OrderID: ${orderId})`);

    // 3. Edit the product's price
    await page.evaluate(async (id) => {
      await fetch(`/api/v1/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePrice: 9999 })
      });
    }, productId);
    reportSuccess(`Product edited. New price: 9999`);

    // 4. Fetch the order via API and verify it hasn't changed
    let orderRes = await page.evaluate(async (id) => {
      // Just hit orders endpoint to get the list and find it
      const r = await fetch(`/api/v1/orders?limit=50`);
      return { status: r.status, data: await r.json() };
    }, orderId);

    const order = orderRes.data.data.find(o => o.id === orderId);
    if (order.items[0].productName === "Business Audit Cake" && order.items[0].price.toString() === "500") {
      reportSuccess(`Historical Integrity Verified: OrderItem retained snapshot (Name: ${order.items[0].productName}, Price: ${order.items[0].price})`);
    } else {
      reportError(`Historical Integrity Failed! Snapshot corrupted: Name=${order.items[0].productName}, Price=${order.items[0].price}`);
    }

    // 5. Delete/Archive the product
    await page.evaluate(async (id) => fetch(`/api/v1/products/${id}`, { method: 'DELETE' }), productId);
    reportSuccess(`Product archived via API.`);

    // 6. Verify order still accessible
    let orderAfterRes = await page.evaluate(async (id) => {
      const r = await fetch(`/api/v1/orders?limit=50`);
      return { status: r.status, data: await r.json() };
    }, orderId);
    const orderAfter = orderAfterRes.data.data.find(o => o.id === orderId);

    if (orderAfter && orderAfter.items.length === 1) {
      reportSuccess(`Historical Integrity Verified: Order intact after product archive.`);
    } else {
      reportError(`Historical Integrity Failed! Order vanished or items deleted.`);
    }
    // 5. Customer refreshes cart -> Product unavailable
    checkoutPayload.items[0].productId = productId;
    let checkoutAfterArchive = await page.evaluate(async (payload) => {
      const r = await fetch('/api/v1/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: r.status, data: await r.json() };
    }, checkoutPayload);

    if ((checkoutAfterArchive.status === 400 || checkoutAfterArchive.status === 500) && checkoutAfterArchive.data.message.includes('not available')) {
      reportSuccess("Active cart correctly rejected archived product");
    } else {
      reportError(`Archived product was allowed in active cart checkout! (Status: ${checkoutAfterArchive.status})`);
    }

    // 6. Restore Product
    await page.evaluate(async (id) => {
      await fetch(`/api/v1/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableForSale: true, isArchived: false })
      });
    }, productId);

    let checkoutAfterRestore = await page.evaluate(async (payload) => {
      const r = await fetch('/api/v1/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: r.status, data: await r.json() };
    }, checkoutPayload);

    if (checkoutAfterRestore.status === 200) {
      reportSuccess(`Restore Product Verified: Checkout succeeded (OrderID: ${checkoutAfterRestore.data.orderId})`);
    } else {
      reportError("Restore Product Failed: Checkout rejected");
    }

    // 7. Verify Duplicate SKU
    let duplicateSkuRes = await page.evaluate(async () => {
      const r = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Duplicate Cake",
          sku: "TEST-SKU-001",
          basePrice: 500,
        })
      });
      return { status: r.status, data: await r.json() };
    });
    
    let duplicateSkuRes2 = await page.evaluate(async () => {
      const r = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Duplicate Cake 2",
          sku: "TEST-SKU-001",
          basePrice: 600,
        })
      });
      return { status: r.status, data: await r.json() };
    });

    if (duplicateSkuRes2.status === 409) {
       reportSuccess("Duplicate SKU properly blocked (409 Conflict)");
    } else {
       reportError(`Duplicate SKU NOT blocked! Status: ${duplicateSkuRes2.status}`);
    }

    // 8. Verify Revenue Calculation
    let reportBefore = await page.evaluate(async () => {
       const today = new Date().toISOString();
       const r = await fetch(`/api/v1/reporting/sales?startDate=${today}&endDate=${today}`);
       return await r.json();
    });

    let finalOrderRes = await page.evaluate(async (payload) => {
      const r = await fetch('/api/v1/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await r.json();
    }, checkoutPayload);

    // Force status to COMPLETED via db to reflect in reports
    // Force status to COMPLETED via db to reflect in reports
    process.env.DATABASE_URL = "file:../prisma/dev.db"; // or wherever it resolves
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasourceUrl: "file:./prisma/dev.db"
    });
    await prisma.order.update({
      where: { id: finalOrderRes?.data?.orderId || finalOrderRes?.orderId },
      data: { status: 'COMPLETED' }
    });
    await prisma.$disconnect();

    let reportAfter = await page.evaluate(async () => {
       const today = new Date().toISOString();
       const r = await fetch(`/api/v1/reporting/sales?startDate=${today}&endDate=${today}`);
       return await r.json();
    });

    if (reportAfter.data.totalRevenue >= reportBefore.data.totalRevenue + 500) {
       reportSuccess("Revenue correctly aggregated after sale!");
    } else {
       reportError("Revenue aggregation failed or lagged!");
    }

  } catch (e) {
    reportError(`Exception thrown during tests: ${e.message}`);
  }

  console.log(`\nFinished Business Audit Script. Total Errors: ${totalErrors}`);
  await browser.close();
  process.exit(totalErrors > 0 ? 1 : 0);
})();
