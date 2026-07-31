const fs = require('fs');
const path = require('path');

const testResultsDir = path.join(__dirname, '../test-results');
const dirs = fs.readdirSync(testResultsDir).filter(d => fs.statSync(path.join(testResultsDir, d)).isDirectory() && !d.startsWith('.'));

const suites = {
  Authentication: { passed: 0, failed: 0 },
  POS: { passed: 0, failed: 0 },
  Fulfillment: { passed: 0, failed: 0 },
  Dashboard: { passed: 0, failed: 0 },
  Other: { passed: 0, failed: 0 }
};

const failures = new Set();
const retries = new Set();

dirs.forEach(d => {
  if (d.endsWith('-retry1')) {
    retries.add(d.replace('-retry1', ''));
  } else {
    failures.add(d);
  }
});

// A test failed if it has a retry dir (meaning the first run failed). If it failed the retry too, it's a true failure. 
// Playwright creates these dirs when traces/screenshots are saved (usually on failure).
const failedTests = [...failures].filter(f => retries.has(f));

failedTests.forEach(f => {
  if (f.includes('auth') || f.includes('Login')) suites.Authentication.failed++;
  else if (f.includes('pos') || f.includes('Checkout')) suites.POS.failed++;
  else if (f.includes('kitchen') || f.includes('delivery') || f.includes('Driver') || f.includes('Chef')) suites.Fulfillment.failed++;
  else if (f.includes('dashboard') || f.includes('Dashboard')) suites.Dashboard.failed++;
  else suites.Other.failed++;
});

console.log("Failed Tests:", failedTests);
console.log("Suites Summary:", suites);
