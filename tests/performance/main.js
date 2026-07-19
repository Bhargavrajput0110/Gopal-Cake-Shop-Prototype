import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuration
export const options = {
  scenarios: {
    // Stage A: Baseline (25 -> 50 -> 100)
    // Stage B: Normal Production (150 -> 250)
    // Stage C: Peak (500)
    // We will parameterize this via env vars to run specific stages
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: __ENV.TARGET_VUS || 50 },  // Ramp up
        { duration: '1m', target: __ENV.TARGET_VUS || 50 },   // Sustain
        { duration: '10s', target: 0 },                       // Ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // API Latency: p95 checkout < 2s, p99 checkout < 3s
    'http_req_duration{type:checkout}': ['p(95)<2000', 'p(99)<3000'],
    // General API Latency
    'http_req_duration': ['p(95)<1500', 'p(99)<2000'],
    // Reliability: Error rate < 0.1%
    'http_req_failed': ['rate<0.001'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 45% Browse, 20% Tracking, 15% Checkout, 10% Dashboards, 5% Chef, 5% Driver
  const rand = Math.random();

  if (rand < 0.45) {
    browseCatalog();
  } else if (rand < 0.65) {
    checkTracking();
  } else if (rand < 0.80) {
    simulateCheckout();
  } else if (rand < 0.90) {
    viewDashboard();
  } else if (rand < 0.95) {
    viewChefKDS();
  } else {
    viewDriverPool();
  }

  // Think time between actions (1 to 3 seconds)
  sleep(Math.random() * 2 + 1);
}

// -------------------------------------------------------------
// Scenarios
// -------------------------------------------------------------

function browseCatalog() {
  const urls = ['/', '/custom'];
  const res = http.get(`${BASE_URL}${randomItem(urls)}`, { tags: { type: 'browse' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
}

function checkTracking() {
  // Use a mock order ID
  const orderId = 'ORD-MOCK-1783707396275';
  const res = http.get(`${BASE_URL}/order/${orderId}`, { tags: { type: 'tracking' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
}

function simulateCheckout() {
  // Simulate an API call to create a POS order
  const payload = JSON.stringify({
    customerId: "CUST-GUEST",
    branchId: "b-001",
    items: [
      { productId: "p-001", quantity: 1, frontendPrice: 450 }
    ],
    payments: [
      { method: "CASH", amount: 450 }
    ],
    notes: "Load test order"
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      // Bypass auth cookie for the test
      'Cookie': 'e2e-bypass-auth=true'
    },
    tags: { type: 'checkout' }
  };

  const res = http.post(`${BASE_URL}/api/v1/pos/checkout`, payload, params);
  
  // We expect 201 Created
  check(res, { 'checkout success': (r) => r.status === 201 });
}

function viewDashboard() {
  const res = http.get(`${BASE_URL}/api/v1/orders?limit=20`, {
    headers: { 'Cookie': 'e2e-bypass-auth=true' },
    tags: { type: 'dashboard' }
  });
  check(res, { 'dashboard success': (r) => r.status === 200 });
}

function viewChefKDS() {
  const res = http.get(`${BASE_URL}/api/v1/chef/orders`, {
    headers: { 'Cookie': 'e2e-bypass-auth=true' },
    tags: { type: 'chef' }
  });
  // Accept 200 or 404 (if no mock API handler for /chef specifically)
  check(res, { 'chef KDS success': (r) => r.status === 200 || r.status === 404 });
}

function viewDriverPool() {
  const res = http.get(`${BASE_URL}/api/v1/orders`, {
    headers: { 'Cookie': 'e2e-bypass-auth=true' },
    tags: { type: 'driver' }
  });
  check(res, { 'driver pool success': (r) => r.status === 200 || r.status === 404 });
}
