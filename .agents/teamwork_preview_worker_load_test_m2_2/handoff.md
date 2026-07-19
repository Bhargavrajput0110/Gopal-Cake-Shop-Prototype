# Handoff Report — Load-Testing Setup

## 1. Observation

- **Modified File**: `scripts/load_test.js`
- **Output Log File**: `C:\Users\Bhargav\.gemini\antigravity\brain\40c31b6f-c497-494c-a486-07bde6c19eb4\.system_generated\tasks\task-56.log`
- **Server Verification**: Verified that custom Next.js server was running at `http://localhost:3000` via checking products endpoint:
  ```
  Server is running: status 200
  ```
- **Load Test Run**: Executed command `node scripts/load_test.js --duration 5 --concurrency 5`. The execution output logged:
  ```
  Fetching products from server first...
  Successfully fetched 8 products.
  ...
  Total Requests : 22
  Successful     : 22 ✓
  Failed         : 0 ✗
  Error Rate     : 0.0%
  Throughput     : 4.40 req/s

  Latency Percentiles:
    Average : 1311ms
    p50     : 1270ms
    p90     : 1692ms
    p99     : 2525ms

  ✅ ALL REQUESTS SUCCEEDED!
  ```

## 2. Logic Chain

- **Requirements**:
  - The script must fetch products from `/api/products` first to ensure matching items. In `scripts/load_test.js`, we retrieve products at `main()` start using `httpRequest(`${BASE_URL}/api/products`)`.
  - Concurrency & duration must be configurable. We parsed command line parameters `--concurrency` (with fallback to 5) and `--duration` (with fallback to 15) using a `getArg()` helper.
  - Payloads must have random walk-in/delivery names, 10-digit phone, matching prices/totals, and branch. In `generateRandomOrder()`, we construct the payload with a random choice of names, generating `"9" + Math.floor(100000000 + Math.random() * 900000000)` phone number, calculating correct subtotal, tax, delivery charges, and grandTotal based on selected products' `basePrice`, and choosing a random branch from `"Khanderao Branch"`, `"Uma Branch"`, `"Elora Park Branch"`, or `"Factory Warashiya"`.
  - Metrics tracking: Latency of each request, successful, and failed requests are saved in the `metrics` object. p50, p90, and p99 percentiles are calculated by sorting the array of latencies and finding the values at indexes `0.5`, `0.9`, and `0.99`.
- **Result**: The output report contains all specified details (Total, Success, Failed, RPS, Average, p50, p90, p99). All 22 requests succeeded during the test run with 0 errors.

## 3. Caveats

- Assumes the database contains seeded products. If the product list retrieved is empty or HTTP request fails, the script uses a hardcoded fallback list of products so it does not fail/crash.
- Socket.io connections from the load test are not established; only REST API orders are posted.

## 4. Conclusion

The load-testing script `scripts/load_test.js` is fully implemented using native Node.js libraries, complies with all requirements, and successfully simulates concurrent order traffic against the running server.

## 5. Verification Method

To verify the load-testing script execution:
1. Ensure the application server is running locally (e.g. at `http://localhost:3000`).
2. Run the command:
   ```bash
   node scripts/load_test.js --duration 5 --concurrency 5
   ```
3. Check the output logs to verify products are fetched, requests are made, and the formatted performance report is printed.
