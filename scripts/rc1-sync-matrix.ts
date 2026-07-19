import 'dotenv/config';
import { io } from 'socket.io-client';
import fetch from 'node-fetch';
import { prisma } from '../src/lib/prisma';

async function runSyncMatrix() {
  console.log("Stage 5: Starting Sync Matrix Latency Test...");
  
  const branch = await prisma.branch.findFirst({ where: { code: 'KHD' } });
  const customer = await prisma.customer.findFirst();
  const product = await prisma.product.findFirst();

  if (!branch || !customer || !product) {
    console.error("Missing seeded data.");
    return;
  }

  // Connect POS Socket (Sales Role)
  const posSocket = io('http://localhost:3000', {
    transports: ['websocket'],
    reconnection: false
  });

  // Connect Chef Socket
  const chefSocket = io('http://localhost:3000', {
    transports: ['websocket'],
    reconnection: false
  });

  let posConnected = false;
  let chefConnected = false;

  posSocket.on('connect', () => {
    posConnected = true;
    posSocket.emit('join_branch', branch.id); 
  });

  chefSocket.on('connect', () => {
    chefConnected = true;
    chefSocket.emit('join_branch', branch.id); 
  });

  // Wait for connections
  await new Promise(r => setTimeout(r, 2000));
  
  if (!posConnected || !chefConnected) {
    console.error("Failed to connect to Socket.IO server on localhost:3000.");
    process.exit(1);
  }

  console.log("POS and Chef Sockets connected & rooms joined.");

  let posReceived = false;
  let chefReceived = false;
  let posLatency = 0;
  let chefLatency = 0;

  posSocket.on('order_created', () => {
    posLatency = Date.now() - orderStartTime;
    posReceived = true;
    console.log(`[Event] POS received 'order_created' in ${posLatency}ms`);
  });

  chefSocket.on('order_created', () => {
    chefLatency = Date.now() - orderStartTime;
    chefReceived = true;
    console.log(`[Event] Chef received 'order_created' in ${chefLatency}ms`);
  });

  // Simulate Customer Web Order via API
  console.log("Customer placing order via API...");
  const orderStartTime = Date.now();
  
  const payload = {
    idempotencyKey: 'test-sync-key-' + Date.now(),
    customer: {
      name: 'Sync Test User',
      phone: '9999999999',
      email: 'test@example.com'
    },
    address: {
      house: '123',
      street: 'Test Street',
      area: 'Test Area',
      city: 'Test City',
      pin: '400001'
    },
    items: [{ productId: product.id, quantity: 1, weight: 1, flavor: 'Chocolate' }],
    paymentMethod: 'CASH',
    branchId: branch.id,
    deliveryDate: new Date().toISOString()
  };

  // We need to bypass auth, so we just use the StorefrontEngine directly!
  // Wait, if we use StorefrontEngine directly, it triggers the Outbox pattern and global io if available.
  // Wait, `StorefrontEngine.ts` emits to `global.io`. But our Node script won't trigger the Next.js process `global.io`!
  // We MUST hit the Next.js API endpoint to trigger the real server's Socket.IO emission.
  
  const res = await fetch('http://localhost:3000/api/v1/public/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // How to bypass auth for this endpoint during test? 
    // The endpoint might be protected. Let's see if it works or returns 401.
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Checkout API Failed: ${res.status} ${text}`);
    // If it's a 401, we know Auth is blocking it.
  } else {
    const data = await res.json();
    console.log(`Order successfully created via API: ${data.orderNumber}`);
  }

  // Wait up to 5 seconds for sockets
  let waitCount = 0;
  while ((!posReceived || !chefReceived) && waitCount < 50) {
    await new Promise(r => setTimeout(r, 100));
    waitCount++;
  }

  posSocket.disconnect();
  chefSocket.disconnect();

  console.log("\n--- Sync Matrix Results ---");
  console.log(`POS Latency Target (<=2000ms): ${posReceived ? posLatency + 'ms (PASS)' : 'FAIL - No Event'}`);
  console.log(`Chef Latency Target (<=2000ms): ${chefReceived ? chefLatency + 'ms (PASS)' : 'FAIL - No Event'}`);

  if (posReceived && chefReceived && posLatency <= 2000 && chefLatency <= 2000) {
    console.log("✅ Sync Matrix (Stage 5) PASSED.");
    process.exit(0);
  } else {
    console.log("❌ Sync Matrix (Stage 5) FAILED.");
    process.exit(1);
  }
}

runSyncMatrix().catch(console.error);
