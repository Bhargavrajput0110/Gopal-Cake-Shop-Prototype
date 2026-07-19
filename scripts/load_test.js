const http = require('http');
const https = require('https');
const { URL } = require('url');

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : fallback;
};

const BASE_URL = getArg('--url', 'http://localhost:3000');
const DURATION_SECONDS = parseInt(getArg('--duration', getArg('-d', '15')));
const CONCURRENT_CUSTOMERS = parseInt(getArg('--concurrency', getArg('-c', '5')));

// Helper for making HTTP requests
function httpRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const headers = { ...(options.headers || {}) };
    
    let requestBody = null;
    if (body) {
      requestBody = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(requestBody);
    }

    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    if (requestBody) {
      req.write(requestBody);
    }
    req.end();
  });
}

// Global metrics
const metrics = {
  total: 0,
  success: 0,
  failed: 0,
  latencies: [],
  failedDetails: []
};

function recordResult(latencyMs, success, detail = null) {
  metrics.total++;
  metrics.latencies.push(latencyMs);
  if (success) {
    metrics.success++;
  } else {
    metrics.failed++;
    if (detail) {
      metrics.failedDetails.push(detail);
    }
  }
}

// Random generators
const branches = ["Khanderao Branch", "Uma Branch", "Elora Park Branch", "Factory Warashiya"];
const walkInNames = ["Walk-in Customer A", "Walk-in Customer B", "Walk-in Customer C", "Walk-in Customer D"];
const deliveryNames = ["Aarav Patel", "Priya Sharma", "Rajesh Kumar", "Anjali Gupta", "Amit Shah", "Vikram Rathore"];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomOrder(products) {
  const orderType = Math.random() > 0.5 ? "walk_in" : "delivery";
  const customerName = orderType === "walk_in" ? getRandomItem(walkInNames) : getRandomItem(deliveryNames);
  
  // Random 10-digit phone number starting with 9
  const customerPhone = "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
  const branch = getRandomItem(branches);
  
  // Select 1 to 3 random products
  const selectedProducts = [];
  const numItems = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numItems; i++) {
    selectedProducts.push(getRandomItem(products));
  }

  const items = selectedProducts.map(p => {
    const qty = Math.floor(Math.random() * 2) + 1;
    const weight = getRandomItem(["500g", "1kg", "2kg"]);
    return {
      name: p.name,
      qty: qty,
      weight: weight,
      price: p.price || p.basePrice || 500
    };
  });

  // Calculate matching prices/totals
  let subtotal = 0;
  items.forEach(item => {
    subtotal += item.price * item.qty;
  });

  const finalItems = items.map(item => ({
    name: item.name,
    qty: item.qty,
    weight: item.weight
  }));

  const discount = Math.random() > 0.7 ? 50 : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = parseFloat((taxableAmount * 0.05).toFixed(2));
  const deliveryCharge = orderType === "delivery" ? 50 : 0;
  const grandTotal = parseFloat((taxableAmount + tax + deliveryCharge).toFixed(2));
  
  const advancePaid = Math.random() > 0.5 ? grandTotal : parseFloat((grandTotal / 2).toFixed(2));
  const pendingBalance = parseFloat((grandTotal - advancePaid).toFixed(2));

  return {
    orderType,
    status: "waiting_for_chef",
    customerName,
    customerPhone,
    branch,
    items: finalItems,
    subtotal,
    discount,
    tax,
    deliveryCharge,
    grandTotal,
    advancePaid,
    pendingBalance,
    priorityLevel: getRandomItem(["normal", "high", "normal"]),
    isSurprise: Math.random() > 0.8,
    timeTarget: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    customerInstructions: Math.random() > 0.5 ? "Handle with care" : ""
  };
}

async function runCustomer(products) {
  const payload = generateRandomOrder(products);
  const start = Date.now();
  try {
    const res = await httpRequest(
      `${BASE_URL}/api/orders`,
      { method: 'POST' },
      payload
    );
    const latency = Date.now() - start;
    const ok = res.status === 200 || res.status === 201;
    if (ok) {
      recordResult(latency, true);
      process.stdout.write('·');
    } else {
      let errBody = '';
      try {
        errBody = JSON.parse(res.body).error || res.body;
      } catch(e) {
        errBody = res.body;
      }
      recordResult(latency, false, { status: res.status, error: errBody || 'Status ' + res.status });
      process.stdout.write('✗');
    }
  } catch (e) {
    const latency = Date.now() - start;
    recordResult(latency, false, { status: 'CONNECTION_ERROR', error: e.message });
    process.stdout.write('✗');
  }
}

async function main() {
  console.log('Fetching products from server first...');
  let products = [];
  try {
    const res = await httpRequest(`${BASE_URL}/api/products`);
    if (res.status !== 200) {
      throw new Error(`Failed to fetch products, status code: ${res.status}`);
    }
    products = JSON.parse(res.body);
    if (!Array.isArray(products) || products.length === 0) {
      console.warn('Warning: Fetched products list is empty. Using fallback products.');
      products = [
        { name: 'Chocolate Truffle Cake', basePrice: 500 },
        { name: 'Pineapple Cake', basePrice: 600 },
        { name: 'Custom Designer Cake', basePrice: 1800 },
        { name: 'Photo Cream Cake', basePrice: 800 }
      ];
    } else {
      console.log(`Successfully fetched ${products.length} products.`);
    }
  } catch (err) {
    console.error(`Error fetching products: ${err.message}. Using fallback products.`);
    products = [
      { name: 'Chocolate Truffle Cake', basePrice: 500 },
      { name: 'Pineapple Cake', basePrice: 600 },
      { name: 'Custom Designer Cake', basePrice: 1800 },
      { name: 'Photo Cream Cake', basePrice: 800 }
    ];
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║        Gopal Cake Shop — API Load Test               ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\n  Target URL    : ${BASE_URL}`);
  console.log(`  Concurrency   : ${CONCURRENT_CUSTOMERS} customers`);
  console.log(`  Duration      : ${DURATION_SECONDS}s\n`);

  const endTime = Date.now() + DURATION_SECONDS * 1000;
  const workers = [];

  async function workerLoop() {
    while (Date.now() < endTime) {
      await runCustomer(products);
    }
  }

  console.log('Sending requests: ');
  for (let i = 0; i < CONCURRENT_CUSTOMERS; i++) {
    workers.push(workerLoop());
  }

  await Promise.all(workers);

  // Print results
  const sorted = [...metrics.latencies].sort((a, b) => a - b);
  const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
  const p50 = sorted.length ? sorted[Math.floor(sorted.length * 0.5)] : 0;
  const p90 = sorted.length ? sorted[Math.floor(sorted.length * 0.9)] : 0;
  const p99 = sorted.length ? sorted[Math.floor(sorted.length * 0.99)] : 0;
  const rps = (metrics.total / DURATION_SECONDS).toFixed(2);
  const errorRate = metrics.total ? ((metrics.failed / metrics.total) * 100).toFixed(1) : '0.0';

  console.log('\n\n╔══════════════════════════════════════════════════════╗');
  console.log('║                  LOAD TEST RESULTS                   ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\n  Total Requests : ${metrics.total}`);
  console.log(`  Successful     : ${metrics.success} ✓`);
  console.log(`  Failed         : ${metrics.failed} ✗`);
  console.log(`  Error Rate     : ${errorRate}%`);
  console.log(`  Throughput     : ${rps} req/s`);
  console.log('\n  Latency Percentiles:');
  console.log(`    Average : ${avg.toFixed(0)}ms`);
  console.log(`    p50     : ${p50}ms`);
  console.log(`    p90     : ${p90}ms`);
  console.log(`    p99     : ${p99}ms`);

  if (metrics.failedDetails.length > 0) {
    console.log('\n  Failed Request Details (up to 10 samples):');
    const samples = metrics.failedDetails.slice(0, 10);
    samples.forEach((detail, index) => {
      console.log(`    [${index + 1}] Status: ${detail.status} | Error: ${detail.error}`);
    });
  }

  console.log('\n' + (metrics.failed === 0 ? '  ✅ ALL REQUESTS SUCCEEDED!' : `  ⚠️  ${metrics.failed} request(s) failed.`));
  console.log('═'.repeat(56) + '\n');
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
