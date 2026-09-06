async function run() {
  console.log("Starting Financial Workflows Verification...");
  
  const branchId = "cmswuiiun00031su3vfrn9eq5";
  const productId = "cmsjy6omi000gtcu39fm7li8v";

  // 1. Verify UNPAID Order
  console.log("\n--- Creating UNPAID Order (CASH) ---");
  const unpaidOrderPayload = {
    idempotencyKey: `unpaid-${Date.now()}`,
    customer: { name: "Test User Unpaid", phone: "9998887776", email: "unpaid@test.com" },
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
  if (unpaidJson.success) {
    console.log("UNPAID Order Created successfully!");
    console.log("Tracking ID:", unpaidJson.trackingId);
    console.log("Order ID:", unpaidJson.orderId);
  } else {
    console.error("Failed to create UNPAID order:", unpaidJson);
  }

  // 2. Verify PAID Order 
  console.log("\n--- Creating PAID Order (ONLINE) ---");
  const paidOrderPayload = {
    ...unpaidOrderPayload,
    idempotencyKey: `paid-${Date.now()}`,
    paymentMethod: "RAZORPAY",
    customer: { name: "Test User Paid", phone: "9998887777", email: "paid@test.com" },
  };

  const resPaid = await fetch('http://localhost:3000/api/v1/public/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paidOrderPayload)
  });

  const paidJson = await resPaid.json();
  if (paidJson.success) {
    console.log("PAID Order Created successfully!");
    console.log("Tracking ID:", paidJson.trackingId);
    console.log("Order ID:", paidJson.orderId);
    console.log("Payment flow initialized.");
  } else {
    console.error("Failed to create PAID order:", paidJson);
  }
}

run().catch(console.error);
