# Project Execution Plan: Point of Sale & Performance Stress Testing

This execution plan decomposes the requirements from `ORIGINAL_REQUEST.md` into actionable milestones, tracking tasks from exploration to code implementation, stress testing, optimization, and final verification.

## Architecture & Code Layout
- **Database Backend**: Supabase client (`supabaseAdmin`) querying remote tables `orders`, `products`, `categories`, and `customers`.
- **Server**: Custom Express + Socket.IO server (`server.js`) wrapping Next.js. Must be run with `node server.js` for websocket broadcasts to work.
- **Client Route**: POS is at `/sales/pos` and order tracking at `/track/[orderId]`.
- **Target Files**:
  - `src/app/sales/pos/page.tsx` (POS interface and submission)
  - `src/app/api/orders/route.ts` (Order creation endpoint)
  - `src/app/api/products/route.ts` (Products endpoint)
  - `scripts/load_test.js` (Stress test script to be built)
  - Next.js config and components for optimizations.

---

## Milestones

### Milestone 1: POS Page Verification & Order Creation Integration
* **Objective**: Ensure that navigating to `/sales/pos` displays the catalog/cart, and creating a test order successfully saves it to the database with the status `waiting_for_chef`.
* **Tasks**:
  1. Verify `/sales/pos` compilation and resolve any page-level linting/type errors.
  2. Verify `/api/products`, `/api/categories`, and `/api/orders` endpoints are fully functional.
  3. Perform a manual end-to-end integration test creating a walk-in order.
* **Verification**: A test order is recorded in the database, has status `waiting_for_chef`, and broadcasts `order_created` websocket event.

### Milestone 2: Stress Testing Script Development
* **Objective**: Create a load-testing script `scripts/load_test.js` (using `autocannon` or `k6` or `axios` concurrent batches) that executes concurrent API requests to `/api/orders` and outputs a performance report with Requests Per Second (RPS) and average latency.
* **Tasks**:
  1. Design the load-testing script using a lightweight runner like `autocannon` or native HTTP requests.
  2. Implement simulated customer order traffic (different branches, items, details).
  3. Ensure it runs locally and prints a summary report (requests, latency, throughput).
* **Verification**: Run `node scripts/load_test.js` and verify it successfully targets the server and generates a report.

### Milestone 3: Performance Audit & Optimizations
* **Objective**: Identify database query bottlenecks, React rendering issues, API response caching, and image loading bottlenecks, and implement optimizations.
* **Tasks**:
  1. Optimize Supabase/PostgreSQL queries (indices, select fields, connection reuse).
  2. Introduce caching mechanisms for static/infrequently changing routes (like `/api/products` and `/api/categories`).
  3. Optimize React rendering and image loading (using Next.js `Image` or cached CDN paths) on POS catalog items.
* **Verification**: Re-run the load test script and compare RPS and latency values to ensure improvements.

### Milestone 4: Final E2E Verification & Forensic Integrity Audit
* **Objective**: Verify application stability, check that the build succeeds without error, and run the Forensic Auditor to check for integrity.
* **Tasks**:
  1. Run the custom server in production mode and execute the load test script to verify liveness.
  2. Ensure 100% test pass rates and clean build logs.
  3. Run the Forensic Auditor to verify no hardcoding, bypasses, or integrity violations exist.
* **Verification**: Successful build, 100% passing tests, and green Forensic Auditor verdict.
