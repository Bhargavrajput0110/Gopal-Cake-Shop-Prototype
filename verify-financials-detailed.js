async function run() {
  console.log("Starting Advanced Financial Workflows Verification...");

  const branchId = "cmswuiiun00031su3vfrn9eq5";
  const productId = "cmsjy6omi000gtcu39fm7li8v";

  // 1. Create UNPAID Order
  console.log("\n--- Creating UNPAID Order ---");
  const unpaidOrderPayload = {
    idempotencyKey: `fin-${Date.now()}`,
    customer: { name: "Test User Fin", phone: "9998887775", email: "fin@test.com" },
    address: { house: "123", street: "Main", area: "Center", city: "Vadodara", pin: "390001" },
    items: [{ productId: productId, quantity: 1, weight: 1 }],
    paymentMethod: "CASH", 
    deliveryType: "DELIVERY",
    branchId: branchId,
    deliveryDate: new Date(Date.now() + 86400000).toISOString(),
  };

  const resUnpaid = await fetch('http://localhost:3000/api/v1/public/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unpaidOrderPayload)
  });

  const unpaidJson = await resUnpaid.json();
  if (!unpaidJson.success) {
    console.error("Failed to create UNPAID order:", unpaidJson);
    process.exit(1);
  }
  console.log(`Order Created: ${unpaidJson.orderId}`);
  const orderId = unpaidJson.orderId;

  // 2. Fetch order via Admin API to get total amount
  // We need an admin auth token or just fetch order directly
  // 2. Fetch order via Admin API to get total amount
  const cookie = `gopal_dummy_role=ADMIN`;
  const resOrder = await fetch(`http://localhost:3000/api/v1/orders/${orderId}`, {
    headers: { 'Cookie': cookie }
  });
  const orderJson = await resOrder.json();
  const totalAmount = parseFloat(orderJson.data.totalAmount);
  console.log(`Total Amount: ${totalAmount}`);

  // 3. Record Partial Payment (50%)
  const partialAmount = totalAmount / 2;
  console.log(`\n--- Recording Partial Payment: ${partialAmount} ---`);
  
  // Since we bypass next-auth in test scripts by using Prisma directly, let's use the service
  const { FinancialService } = require('./src/services/FinancialService.ts');
  // Wait, we can't easily require TS files with Next.js aliases from node script without ts-node or tsx.
  // Instead, let's hit the API. To hit the API we need a dummy role cookie!
  
  const resPartial = await fetch(`http://localhost:3000/api/v1/orders/${orderId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ amount: partialAmount, method: 'CASH' })
  });

  const partialJson = await resPartial.json();
  console.log("Partial Payment Response:", partialJson);

  // 4. Verify Financial Status via API
  const resStatus = await fetch(`http://localhost:3000/api/v1/orders/${orderId}/financials`, {
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  const statusJson = await resStatus.json();
  console.log("Financial Summary:", statusJson.data);

  // 5. Pay Remaining Balance
  console.log(`\n--- Recording Remaining Payment: ${statusJson.data.outstandingAmount} ---`);
  const resRemaining = await fetch(`http://localhost:3000/api/v1/orders/${orderId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ amount: statusJson.data.outstandingAmount, method: 'CASH' })
  });
  const remainingJson = await resRemaining.json();
  console.log("Remaining Payment Response:", remainingJson);

  // 6. Verify final status
  const resFinalStatus = await fetch(`http://localhost:3000/api/v1/orders/${orderId}/financials`, {
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  const finalStatusJson = await resFinalStatus.json();
  console.log("Final Financial Summary:", finalStatusJson.data);

  // 7. Check Admin Dashboard KPIs
  console.log("\n--- Checking Admin Dashboard KPIs ---");
  const resKpis = await fetch(`http://localhost:3000/api/v1/analytics/kpis`, {
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  const kpisJson = await resKpis.json();
  if (kpisJson.success) {
    console.log("Admin KPIs:", kpisJson.data);
  } else {
    console.error("Failed to fetch KPIs:", kpisJson);
  }
}

run().catch(console.error);
