## 2026-07-05T09:12:47Z
You are a teamwork_preview_worker. Your working directory is d:\Gopal Cake Shop\.agents\teamwork_preview_worker_setup_e2e.
Your task is to setup Playwright and implement E2E tests for Gopal Cake Shop.

### Tasks:
1. **Setup Playwright**:
   - Install `@playwright/test` as a devDependency.
   - Run `npx playwright install chromium` to install the Chromium browser.
   - Create `playwright.config.ts` in the repository root. Ensure it has a `webServer` block configured to run `npm run dev` at `http://localhost:3000` (timeout 120s), and configures base URL, retries, etc.
2. **Write E2E Test Suite**:
   - Create E2E tests in `tests/e2e/`.
   - Write tests following the 4-tier design:
     - **Tier 1: Feature Coverage (>=5 test cases per feature)**:
       - Customer Order Flow features: 1) Store Pickup checkout, 2) Home Delivery checkout, 3) Checkout with message on cake, 4) Checkout with surprise option, 5) Checkout with custom quantity.
       - Staff Authentication features: Login via custom PIN keypad for 1) Admin (usr_admin/0000), 2) Sales (usr_sales_khm/2222), 3) Chef (usr_chef_khm/3333), 4) Driver (usr_driver_khm/4444), 5) Manager (usr_manager_khm/1111).
     - **Tier 2: Boundary & Corner Cases (>=5 test cases per feature)**:
       - Customer flow boundaries: 1) Checkout form validation (missing required fields), 2) Invalid phone format, 3) Extreme weight values (10kg), 4) Invalid coupon code, 5) Past date/time selection.
       - Staff login boundaries: 1) Incorrect PIN entry, 2) Short PIN entry, 3) Login keypad back/delete button, 4) Route protection redirect (direct access to protected route redirects to /login).
     - **Tier 3: Combinations**:
       - Pairwise combinations of Store Pickup vs Home Delivery, Surprise Toggle, Branch selection, and Coupon Application.
     - **Tier 4: Real-world scenarios**:
       - Complete order lifecycle: Customer orders a custom cake -> redirected to tracking page `/order/[orderId]` (verify initial state) -> Staff logs in -> Staff updates order status in KDS or dashboard -> Customer tracking page updates.
3. **Write E2E Infrastructure Documents**:
   - Create `TEST_INFRA.md` at the project root (d:\Gopal Cake Shop) detailing the Playwright setup, config details, 4-tier test case mapping, and selectors.
   - Create `TEST_READY.md` at the project root (d:\Gopal Cake Shop) containing the test runner command, expected exit codes, and coverage count.
4. **Execute and Verify**:
   - Run the Playwright test suite and make sure all tests pass.
   - Verify that your test cases actually run against the live Next.js server locally and assert authentic behaviors.

### MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please write your progress and findings in d:\Gopal Cake Shop\.agents\teamwork_preview_worker_setup_e2e\progress.md and write a handoff.md when complete. Reply with your final results.
