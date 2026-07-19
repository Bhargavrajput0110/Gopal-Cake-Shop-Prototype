# Changes Log

## Description
This log records changes made to implement and verify the native Node.js load-testing script for Gopal Cake Shop.

## Code Changes
Implemented load-testing functionality in `scripts/load_test.js`:
- Fetches products list from `http://localhost:3000/api/products` to get valid real seeded products first.
- If products are not available, falls back gracefully to a hardcoded product list to prevent script crashing.
- Supports concurrency (number of simulated concurrent users) via `--concurrency` (with `-c` alias, default 5) and configurable duration via `--duration` (with `-d` alias, default 15).
- Generates random, schema-conforming order payloads containing:
  - Random takeaway/walk-in names ("Walk-in Customer A", etc.) or delivery names ("Aarav Patel", etc.).
  - Random 10-digit phone numbers starting with '9'.
  - Random items with matching prices/totals, subtotal, discount, tax, delivery charges, and grandTotal.
  - Random branch from the official branch names ("Khanderao Branch", "Uma Branch", "Elora Park Branch", "Factory Warashiya").
- Measures request latencies, keeps count of successes and failures, and tracks failed details (status and response/error body).
- Outputs a clean, formatted report including:
  - Total requests sent
  - Successful requests
  - Failed requests with status/error details
  - Throughput (RPS)
  - Average latency (ms)
  - Percentile latencies (p50, p90, p99)

## Run Logs
Running the load test script with `--duration 5 --concurrency 5`:

```
Fetching products from server first...
Successfully fetched 8 products.

╔══════════════════════════════════════════════════════╗
║        Gopal Cake Shop — API Load Test               ║
╚══════════════════════════════════════════════════════╝

  Target URL    : http://localhost:3000
  Concurrency   : 5 customers
  Duration      : 5s

Sending requests: 
············══════════

╔══════════════════════════════════════════════════════╗
║                  LOAD TEST RESULTS                   ║
╚══════════════════════════════════════════════════════╝

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
════════════════════════════════════════════════════════
```
