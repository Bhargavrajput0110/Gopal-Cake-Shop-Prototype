async function reproduceIssue1() {
  console.log("Placing order from customer website...");
  
  // Payload based on the POST /api/orders/route.ts
  const orderPayload = {
    customerName: "Website Customer",
    customerPhone: "9999988888",
    branch: "khanderao", // Trying with the correct canonical branch
    status: "new",
    orderType: "pickup",
    timeTarget: new Date(Date.now() + 86400000).toISOString(),
    subtotal: 500,
    grandTotal: 500,
    items: [
      {
        name: "Standard Chocolate Cake",
        qty: 1,
        weight: 1,
        flavour: "Chocolate"
      }
    ]
  };

  try {
    const res = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const text = await res.text();
    console.log("Website Checkout Response:", res.status, text);

    if (!res.ok) {
        console.error("Failed to place order.");
        return;
    }

    const { order } = JSON.parse(text);
    console.log(`Order placed successfully. ID: ${order.id}`);

    // Now check if it appears in the Sales Dashboard API for Khanderao branch
    console.log("Fetching Sales Dashboard orders for Khanderao...");
    
    // In our system, the Sales dashboard fetches from /api/v1/orders, which uses server session or branch filters.
    // We will bypass auth using the E2E cookie
    const salesRes = await fetch('http://localhost:3000/api/v1/orders?limit=50', {
      headers: {
        'Cookie': 'e2e-bypass-auth=true'
      }
    });

    const salesText = await salesRes.text();
    const salesData = JSON.parse(salesText);

    if (salesData.success) {
      const found = salesData.data.find(o => o.id === order.id);
      if (found) {
        console.log(`✅ SUCCESS: Order ${order.id} found in Sales Dashboard API!`);
      } else {
        console.log(`❌ FAILED: Order ${order.id} NOT found in Sales Dashboard API!`);
      }
    } else {
        console.log("Failed to fetch sales dashboard orders.", salesData);
    }
  } catch (err) {
    console.error("Error reproducing issue:", err);
  }
}

reproduceIssue1();
