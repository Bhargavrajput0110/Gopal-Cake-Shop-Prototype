const https = require('https');

const RENDER_BASE = 'https://gopal-cake-shop-prototype.onrender.com';

function post(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(raw) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(raw) }));
    }).on('error', reject);
  });
}

async function runGate2Test() {
  console.log('=== GATE 2 SMOKE TEST: LIVE RENDER SERVER ===\n');

  // Step 1: Place Customer Order
  console.log('[Step 1] Placing Customer Order via /api/v1/public/checkout...');
  const checkoutPayload = {
    idempotencyKey: `gate2-smoke-${Date.now()}`,
    customer: {
      name: 'Gate 2 Test Customer',
      phone: '9998887776',
      email: 'gate2test@gopalcakeshop.com'
    },
    address: {
      house: 'Flat 101',
      street: 'Alkapuri Main Rd',
      area: 'Alkapuri',
      city: 'Vadodara',
      pin: '390007',
      landmark: 'Near HDFC Bank'
    },
    items: [
      {
        productId: 'cmrkzus6n001qb4u38or7llim', // Classic Chocolate Truffle
        quantity: 1,
        weight: 1,
        flavor: 'Chocolate Truffle',
        messageOnCake: 'Gate 2 Smoke Test'
      }
    ],
    paymentMethod: 'UPI',
    deliveryType: 'DELIVERY',
    branchId: 'khanderao',
    deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  const checkoutRes = await post(`${RENDER_BASE}/api/v1/public/checkout`, checkoutPayload);
  console.log('Checkout Response:', checkoutRes.data);

  if (checkoutRes.status !== 200 || !checkoutRes.data.trackingId) {
    console.error('❌ Step 1 FAILED: Checkout failed');
    process.exit(1);
  }

  const { trackingId, orderId } = checkoutRes.data;
  console.log(`✅ Step 1 PASSED: Order Created! TrackingId: ${trackingId}, OrderId: ${orderId}\n`);

  // Step 2: Customer Tracking API Lookup
  console.log('[Step 2] Verifying Customer Tracking Page Lookup (/api/v1/public/orders/[trackingId])...');
  const trackingRes = await get(`${RENDER_BASE}/api/v1/public/orders/${trackingId}`);
  console.log('Tracking API Response:', trackingRes.data);

  if (trackingRes.status !== 200 || !trackingRes.data.orderNumber) {
    console.error('❌ Step 2 FAILED: Customer tracking lookup failed');
    process.exit(1);
  }
  console.log(`✅ Step 2 PASSED: Tracking API returned Order Number: ${trackingRes.data.orderNumber}, Status: ${trackingRes.data.status}\n`);

  console.log('🎉 REAL-TIME EMPIRICAL EVIDENCE COLLECTED SUCCESSFULLY FOR STEPS 1 & 2!');
}

runGate2Test().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
