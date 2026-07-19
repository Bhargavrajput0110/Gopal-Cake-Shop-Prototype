# Playwright E2E Testing Plan & Coverage Design

This document details the E2E testing strategy, structural architecture, selectors exploration, and test case inventory for the 4-tier Playwright E2E test suite targeting **Gopal Cake Shop**.

---

## 1. Playwright Test Architecture

The E2E tests are organized into 4 distinct tiers:
1. **Tier 1: Feature Coverage**: Core happy path flows covering primary customer and staff features.
2. **Tier 2: Boundary & Edge Cases**: Verification of form constraints, validation messages, authorization blocks, and error handling.
3. **Tier 3: Cross-Feature Combinations**: Pairwise testing combining fulfillment types, branch selections, surprise delivery configurations, and coupon applications.
4. **Tier 4: Real-world Application Scenarios**: Multiphase workflows showing real-time Socket.io synchronizations, role-based handoffs, and pricing negotiations.

---

## 2. Key Element Selectors Exploration

Based on code inspection of the target Next.js page components, the following element selectors will be used during Playwright script implementation:

### Customer Flow (`/menu` & `/product/[id]`)
- **Product Details Link**: `a[href^="/product/"]`
- **Weight Buttons**: `button:has-text("250g")`, `button:has-text("1kg")`, etc.
- **Flavour Search Input**: `input[placeholder*="Search flavours..."]`
- **Flavour Option Buttons**: `button:has-text("Butterscotch")`, `button:has-text("Classic Chocolate")`
- **Name/Text on Cake Input**: `input[placeholder*="Name / Message on Cake"]`
- **Quantity Decrement/Increment**: `button:has-text("-")`, `button:has-text("+")`
- **Date Required Input**: `input[type="date"]`
- **Time Target Input**: `input[type="time"]`
- **Fulfillment Toggles**: `button:has-text("Store Pickup")`, `button:has-text("Home Delivery")`
- **House/Flat/Block Input**: `input[placeholder*="House / Flat / Block No."]`
- **Landmark Input**: `input[placeholder*="Landmark"]`
- **Surprise Toggle Button**: `button:has-text("Make it a Surprise")` or relative switch element
- **Recipient Name Input**: `input[placeholder*="Who is getting the cake?"]`
- **Contact Number Input**: `input[placeholder*="+91 XXXXX XXXXX"]`
- **Coupon Code Input**: `input[placeholder="COUPON CODE"]`
- **Apply Coupon Button**: `button:has-text("APPLY")`
- **Confirm & Place Order Button**: `button:has-text("Pay")` (or contains `Confirm`)

### Staff Authentication (`/login`)
- **Role Select Buttons**: `button:has-text("Admin")`, `button:has-text("Chef")`, `button:has-text("Manager")`, `button:has-text("Sales")`
- **Branch Select Buttons**: `button:has-text("Khanderao Branch")`, `button:has-text("Elora Park Branch")`, `button:has-text("Uma Branch")`
- **Profile Select Buttons**: `button:has-text("Gopal Chef")` or generic `button` containing the staff name
- **PIN Pad Digit Buttons**: `button:has-text("0")` to `button:has-text("9")`
- **PIN Pad Delete Button**: `button:has(svg)` (contains Lucide Delete icon)
- **Error Banner**: `p:has-text("Invalid PIN.")`

### Admin live orders (`/admin/orders`)
- **Board/List View Toggles**: `button:has-text("Board")`, `button:has-text("List")`
- **Search Input**: `input[placeholder*="Search ID, Name, Phone..."]`
- **Status Filter Dropdown**: `select`
- **Board Columns**: `div:has-text("New & Quotes")`, `div:has-text("In Kitchen")`, `div:has-text("Ready")`, `div:has-text("Out for Delivery")`
- **Order Card**: `div` containing Order ID (e.g. text pattern starting with `order_` or UUID format)

---

## 3. Test Cases Inventory

### Tier 1: Feature Coverage (Core Happy Paths)

#### Feature A: Customer Order Flow (Homepage -> Add to Cart -> Checkout)
1. **TC-C1.1: Complete Store Pickup Order Flow**
   - **Description**: Verify that a guest customer can successfully configure a premium cake, select Store Pickup, and submit an order.
   - **Action**: Navigate to `/`, go to Menu, click a product, select `1kg` weight, choose `Butterscotch` flavour, input date required, select `Store Pickup` at `Khanderao Market`, input contact number, click `Confirm`.
   - **Assertion**: Redirected to `/order/[orderId]`, timeline status is `waiting_for_chef`.
2. **TC-C1.2: Complete Home Delivery Order Flow**
   - **Description**: Verify that a customer can place a home delivery order by filling in address details.
   - **Action**: Navigate to product page, select `2kg` weight, select `Classic Black Forest` flavour, enter date/time, choose `Home Delivery`, fill in house number, address (fetched from mock map pick), phone number, and confirm order.
   - **Assertion**: Order placed successfully, redirects to tracking page showing delivery address.
3. **TC-C1.3: Cart Quantity adjustments & Pricing Updates**
   - **Description**: Verify modifying quantity updates pricing totals before checkout.
   - **Action**: On product page, select weight `500g` (₹600), increment quantity to `3`, decrement to `2`.
   - **Assertion**: Base total updates to ₹1800, then to ₹1200. Recalculated 50% advance updates to ₹600.
4. **TC-C1.4: Special Instructions and Name on Cake Persistence**
   - **Description**: Verify that text to write on the cake and custom notes are stored.
   - **Action**: Enter `"Happy Birthday Rohan!"` in the Cake Text input, enter `"Eggless, less cream"` in notes. Complete order.
   - **Assertion**: Tracking page `/order/[orderId]` displays `"Message: Happy Birthday Rohan!"` and custom instructions exactly.
5. **TC-C1.5: Guest Checkout via Navbar Drawer**
   - **Description**: Verify checkout flow directly using the Navbar Shopping Cart Drawer.
   - **Action**: Add product to cart, open Navbar Cart Drawer, click "Proceed to Checkout", fill name, phone, address, select branch, and submit.
   - **Assertion**: Order placed successfully, shows "Order Placed!" screen, cart is cleared.

#### Feature B: Staff Authentication (Login & Dashboard Redirection)
6. **TC-S1.1: Admin Staff PIN Login**
   - **Description**: Verify that admin staff can login using role selection and 4-digit PIN.
   - **Action**: Navigate to `/login`, click `Admin`, select an admin profile, input the correct 4-digit PIN using the PIN pad.
   - **Assertion**: Redirected to `/admin` dashboard.
7. **TC-S1.2: Chef Staff PIN Login with Branch Select**
   - **Description**: Verify chef staff can login selecting branch, profile, and PIN.
   - **Action**: Navigate to `/login`, click `Chef`, select `Khanderao Branch`, click a chef profile, input correct PIN.
   - **Assertion**: Redirected to `/chef` dashboard.
8. **TC-S1.3: Manager Staff PIN Login with Branch Select**
   - **Description**: Verify manager staff can login selecting branch, profile, and PIN.
   - **Action**: Navigate to `/login`, click `Manager`, select `Elora Park Branch`, click a manager profile, input correct PIN.
   - **Assertion**: Redirected to `/manager` dashboard.
9. **TC-S1.4: Sales Staff PIN Login with Branch Select**
   - **Description**: Verify sales staff can login selecting branch, profile, and PIN.
   - **Action**: Navigate to `/login`, click `Sales`, select `Uma Branch`, click a sales profile, input correct PIN.
   - **Assertion**: Redirected to `/sales` dashboard.
10. **TC-S1.5: Session Invalidation on Logout**
    - **Description**: Verify logging out clears credentials and prevents backward navigation.
    - **Action**: Login as Admin, click "Logout" button, attempt to directly navigate back to `/admin`.
    - **Assertion**: Redirected back to `/login` page with callbackUrl in query parameters.

---

### Tier 2: Boundary & Corner Cases

#### Feature A: Customer Order Flow Boundary Cases
11. **TC-C2.1: Empty Cart Checkout Block**
    - **Description**: Verify guest checkout is blocked when the cart has no items.
    - **Action**: Open Navbar Cart drawer.
    - **Assertion**: Cart displays `"Your cart is empty."` and the proceed button is hidden/disabled.
12. **TC-C2.2: Invalid/Missing Phone Format**
    - **Description**: Verify that the checkout button requires a valid contact number format.
    - **Action**: On details checkout page, enter invalid telephone input (e.g. `"abc"` or empty) and try to submit.
    - **Assertion**: Pay & Confirm button remains disabled or validation error is triggered.
13. **TC-C2.3: Home Delivery without House/Flat Number**
    - **Description**: Verify home delivery checkout is blocked if delivery address fields are incomplete.
    - **Action**: Select "Home Delivery", enter contact number, but leave "House / Flat / Block No." field empty.
    - **Assertion**: Pay & Confirm button remains disabled.
14. **TC-C2.4: Out of Delivery Range Location**
    - **Description**: Verify behavior when selected location is outside delivery radius.
    - **Action**: Select an address that calculates distanceKm as too far or results in distance calculation error.
    - **Assertion**: Distance error text appears ("distance error" or branch distance 999km) and checkout is restricted/adjusted.
15. **TC-C2.5: Invalid Coupon Code Application**
    - **Description**: Verify coupon validation rejects incorrect codes.
    - **Action**: Enter coupon code "FAKECD10" and click "APPLY".
    - **Assertion**: Show alert dialog with "Invalid or expired coupon code", discount amount remains 0, and total price is unchanged.
16. **TC-C2.6: Extreme Quantity Bounds**
    - **Description**: Verify that quantity field prevents zero or negative values.
    - **Action**: Click decrement button when quantity is 1.
    - **Assertion**: Quantity remains 1, decrement is blocked.

#### Feature B: Staff Authentication Boundary Cases
17. **TC-S2.1: Incorrect PIN Verification**
    - **Description**: Verify authentication failure when incorrect PIN is supplied.
    - **Action**: Select role, branch, profile, enter incorrect 4-digit PIN.
    - **Assertion**: Error message "Invalid PIN." is displayed, PIN is cleared, and user remains on PIN entry screen.
18. **TC-S2.2: Partial PIN Input and Delete Action**
    - **Description**: Verify backspace button works to clear partially entered PIN.
    - **Action**: Enter 2 digits of PIN, click backspace/Delete button.
    - **Assertion**: Number of active PIN dots decreases to 1.
19. **TC-S2.3: Unauthenticated Access Redirect to Callback**
    - **Description**: Verify middleware blocks unauthorized access to staff routes.
    - **Action**: Open browser incognito, directly navigate to `/admin/orders`.
    - **Assertion**: Redirected to `/login?callbackUrl=%2Fadmin%2Forders`.
20. **TC-S2.4: Cross-Role Middleware Hijack Prevention**
    - **Description**: Verify a logged-in staff member cannot access portals of higher privilege.
    - **Action**: Login as Chef. Manually enter `/admin` in the browser address bar.
    - **Assertion**: Redirected back to `/chef` by middleware.
21. **TC-S2.5: Fallback for Empty Staff Profiles**
    - **Description**: Verify UI behavior when no staff profiles match role/branch filters.
    - **Action**: Navigate role/branch to a combination with zero employees.
    - **Assertion**: UI shows "No staff found for this selection."

---

### Tier 3: Cross-Feature Combinations (Pairwise matrix)

| ID | Fulfillment | Branch | Coupon | Surprise | Time Target | Expected Results |
|---|---|---|---|---|---|---|
| **TC-X3.1** | Delivery | Khanderao HQ | `GOPAL10` (10%) | Yes | +2 hours | 10% discount, Delivery Fee active, Surprise info saved, Khanderao kitchen assigned |
| **TC-X3.2** | Store Pickup | Elora Park | `WELCOME20` (20%) | No | +24 hours | 20% discount, Delivery Fee = 0, Pickup location Elora Park |
| **TC-X3.3** | Delivery | Uma Branch | None | No | +48 hours | Standard price + Delivery Fee calculated from map picker, assigned to Uma Branch |
| **TC-X3.4** | Store Pickup | Uma Branch | `GOPAL10` (10%) | Yes | +3 hours | 10% discount, Delivery Fee = 0, Surprise info saved, Uma Branch pickup |
| **TC-X3.5** | Delivery | Elora Park | None | Yes | +5 hours | Standard price + Delivery Fee active, Surprise info saved, Elora Park kitchen assigned |

- **TC-X3.6: Client Order Creation and Admin Live Orders List Updates**
  - **Description**: Verify that placing a customer order immediately updates the Admin Live Orders board.
  - **Action**: Place an order as a guest. Intercept order ID. Log in as Admin. Navigate to `/admin/orders`.
  - **Assertion**: Order placed by customer appears in real-time on `/admin/orders` dashboard under "New & Quotes" column.

---

### Tier 4: Real-world Application Scenarios (Multiphase E2E)

22. **TC-R4.1: Customer E2E Happy Path Delivery & Tracking**
    - **Goal**: Verify a full customer order lifecycle.
    - **Steps**:
      1. Customer browses `/menu` -> selects a cake.
      2. Configures: `1kg`, `Butterscotch` flavour, Name: `"Happy Birthday Priya"`, Date: tomorrow, Time: `18:00`.
      3. Selects `Home Delivery`, calculates location address, enters contact.
      4. Applies coupon `WELCOME20` (recalculation of 20% discount verified).
      5. Clicks `"Pay & Confirm"`.
    - **Assertion**: Redirected to `/order/[orderId]`, status banner shows "Order Confirmed!", timeline contains event `"waiting_for_chef"`.

23. **TC-R4.2: Staff Fulfillment Pipeline & Live Socket.io Status Sync**
    - **Goal**: Verify Socket.io event broadcast updates client state in real-time without reloading.
    - **Steps**:
      1. Customer places order for Uma branch, ends up on tracking page `/order/[orderId]`.
      2. Open a second browser context. Log in as Chef for Uma branch.
      3. Navigate to Chef board, locate order, click `"Accept Order"`.
      4. Move order to `"Preparing"` and then `"Ready for Pickup"`.
    - **Assertion**: First browser context (customer tracking page) automatically updates live status banner to `"Ready for Dispatch!"` and appends timeline events in real-time.

24. **TC-R4.3: Custom Design Quote Request, Sales Review, & Customer Payment Flow**
    - **Goal**: Verify the price negotiation flow.
    - **Steps**:
      1. Customer fills product page but clicks `"Request Quote"` instead of pay.
      2. Tracking page `/order/[orderId]` displays `"Bargain Review in Progress"`.
      3. Admin/Sales logs in, opens `/admin/orders`, searches for order, edits and applies discount/sends quote (status updates to `quote_sent`).
      4. Customer tracking page updates in real-time, displaying `"New Negotiated Quote Ready!"` and a `"Pay 50% Advance"` button.
      5. Customer clicks Pay button -> status updates to `waiting_for_chef`.
    - **Assertion**: All timeline states (`quote_requested` -> `quote_sent` -> `waiting_for_chef`) and financial amounts update correctly.

25. **TC-R4.4: Driver Assignment & Dispatch Lifecycle**
    - **Goal**: Verify delivery dispatch lifecycle.
    - **Steps**:
      1. Customer places delivery order -> Chef prepares and marks ready (`ready_for_pickup`).
      2. Manager logs in, assigns driver -> status changes to `assigned_to_driver`.
      3. Driver logs in / status updates -> `picked_up_by_driver` -> `on_the_way` -> `delivered`.
    - **Assertion**: Timeline events are appended correctly at each step with actor names.

26. **TC-R4.5: Multi-Branch Isolation and Order Visibility**
    - **Goal**: Verify data isolation between branches.
    - **Steps**:
      1. Place order A for Uma Branch.
      2. Place order B for Elora Park Branch.
      3. Log in as Chef for Elora Park Branch.
    - **Assertion**: Elora Park Chef only sees order B in their queue, order A is invisible to them, confirming proper data scoping.

---

## 4. Draft Layout of TEST_INFRA.md

Below is the design layout for the test infrastructure configuration document:

```markdown
# TEST_INFRA.md — Playwright Testing Infrastructure

This document details the configuration, seeding mechanics, and execution parameters for the Gopal Cake Shop E2E test suite.

## 1. Directory Structure

```text
e2e/
├── config/
│   └── playwright.config.ts    # E2E test runner configuration
├── fixtures/
│   ├── mock_database.ts       # Seeding scripts for test data
│   └── auth_states.ts         # Pre-saved auth state JSON files
├── selectors/
│   └── elements.ts            # Centralized dictionary of element selectors
└── specs/
    ├── customer/
    │   ├── order_flow.spec.ts # Customer order flow tests (Tiers 1 & 2)
    │   └── checkout.spec.ts
    ├── staff/
    │   ├── auth.spec.ts       # Staff login & access tests (Tiers 1 & 2)
    │   └── orders.spec.ts     # Order management & status changes
    └── integration/
        ├── sync.spec.ts       # WebSocket real-time sync (Tier 4)
        └── pairwise.spec.ts   # Pairwise combinations (Tier 3)
```

## 2. Configuration (`playwright.config.ts`)

- **Base URL**: `http://localhost:3000` (development server) or custom environmental variable.
- **Workers**: Set to `1` to avoid database race conditions during concurrent test executions.
- **Global Setup**: A script that runs before testing to seed test users, branches, and sample products into Supabase.
- **Global Teardown**: Cleans up test-generated orders to restore database cleanliness.
- **Trace Viewer**: Configured to capture screenshots, console logs, and network logs on test failure.

## 3. Database State Seeding & Cleanup

To ensure test repeatability, a dedicated seeding file `e2e/fixtures/mock_database.ts` is implemented:
- **Seed Users**: Creates standard logins for Admin, Chef (Uma), Manager (Elora), and Sales (Khanderao) with known PINs.
- **Seed Branches**: Khanderao Market, Elora Park, Uma Branch.
- **Seed Products**: Premium Custom Cake, Anniversary Roses, Black Forest.
- **Reset Script**: Truncates the `orders` table before every E2E run using `supabaseAdmin`.

## 4. Socket.io Mocking / Real-time Sync Testing Strategy

For real-time Socket.io assertions:
- We initiate a mock client inside the test runner using `socket.io-client`.
- Alternatively, we launch two parallel browser contexts in the same Playwright test:
  1. Context A (Customer) loaded at `/order/[orderId]`.
  2. Context B (Staff) logged in at `/chef` or `/admin/orders`.
- Direct UI clicks in Context B trigger status updates. Context A verifies elements react without page reloads.

## 5. Running the Tests

- **Run all tests**: `npx playwright test`
- **Run specific tier**: `npx playwright test --grep "@tier1"`
- **Run UI mode**: `npx playwright test --ui`
```

---

## 5. Implementation Roadmap for Testing Team

1. **Phase 1: Environment & Setup**
   - Install `@playwright/test` and `socket.io-client` packages.
   - Write `playwright.config.ts` and set environment variables (`NEXTAUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`).
   - Create database seed/reset helper functions in `e2e/fixtures/mock_database.ts`.

2. **Phase 2: Core Selector Constants**
   - Populate `e2e/selectors/elements.ts` with all tested CSS and XPath selectors.

3. **Phase 3: Tier 1 & Tier 2 Development**
   - Implement basic customer checkout and staff authentication scripts.
   - Code form boundary validations and invalid PIN checks.

4. **Phase 4: Real-time & Multi-User Flows**
   - Setup dual-browser contexts in Playwright to verify Socket.io broadcasts.
   - Script the quote-negotiation state transition flow.
