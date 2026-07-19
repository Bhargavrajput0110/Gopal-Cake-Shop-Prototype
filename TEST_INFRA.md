# Playwright E2E Test Infrastructure

This document outlines the Playwright setup, configuration details, 4-tier test case mapping, and select list selectors used to test Gopal Cake Shop.

## 🛠️ Playwright Setup & Config
Playwright is installed as a `devDependency` and runs tests in Chrome (Chromium).
- **Configuration File**: `playwright.config.ts`
- **Main Config Parameters**:
  - `baseURL`: `http://localhost:3000`
  - `testDir`: `./tests/e2e`
  - `webServer`: Runs `npm run dev` locally at `http://localhost:3000` (timeout 120s)
  - `workers`: `1` (sequenced runs for state consistency)
  - `retries`: `1` (on CI: `2` retries, locally: `1` retry)
  - `trace`: `on-first-retry`
  - `screenshot`: `only-on-failure`

## 🧩 4-Tier Test Case Mapping

### Tier 1: Feature Coverage (>=5 test cases per feature)
* **Customer Order Flow features**:
  1. **Store Pickup Checkout**: Selects size (1kg), flavor (Pineapple), sets tomorrow's date and contact, submits via Store Pickup.
  2. **Home Delivery Checkout**: Selects size (500g), flavor (Biscoff), sets tomorrow's date, mocks OSM address query (`Uma Char Rasta`), enters house number, and submits.
  3. **Checkout with Message on Cake**: Enters a custom text message (`Happy Anniversary Mom & Dad`) in the Message input field and completes checkout.
  4. **Checkout with Surprise Option**: Toggles "Make it a Surprise" option, fills the recipient's name field (`Aarav Mehta`), and completes checkout.
  5. **Checkout with Custom Quantity**: Increases quantity from `1` to `3` using the keypad buttons and completes checkout.
* **Staff Authentication features (Login via custom PIN keypad)**:
  1. **Admin Login**: Log in as `usr_admin` using PIN `0000` -> redirects to `/admin`.
  2. **Sales Login**: Log in as `usr_sales_khm` using PIN `2222` -> redirects to `/sales`.
  3. **Chef Login**: Log in as `usr_chef_khm` using PIN `3333` -> redirects to `/chef`.
  4. **Driver Login**: Log in as `usr_driver_khm` using PIN `4444` -> redirects to `/delivery`.
  5. **Manager Login**: Log in as `usr_manager_khm` using PIN `1111` -> redirects to `/manager`.

### Tier 2: Boundary & Corner Cases (>=5 test cases per feature)
* **Customer Flow boundaries**:
  1. **Checkout Form Validation (Missing Date)**: Verifies "Pay & Confirm" button is disabled if date is not specified.
  2. **Invalid Phone Format (Empty/Missing)**: Verifies "Pay & Confirm" button is disabled if phone number is empty.
  3. **Extreme Weight Values (10kg)**: Selects extreme weight (10kg) and asserts that the calculated price updates to ₹9200 (Mock prices).
  4. **Invalid Coupon Code**: Types `INVALID_COUPON` and verifies the error message `Invalid coupon code.` is shown.
  5. **Date Input Min Constraint**: Asserts that the `min` attribute of the date input matches today's date.
* **Staff Login boundaries**:
  1. **Incorrect PIN Entry**: Enters wrong PIN `9999` for Admin and verifies `Invalid PIN.` error message is displayed.
  2. **Short PIN Entry**: Enters two digits (`12`) and verifies it does not automatically submit.
  3. **Keypad Back/Delete Button**: Enters digits, uses delete (`Delete`) button to remove last digit, and uses back button to return to role selection.
  4. **Route Protection Redirect**: Attempts to access `/admin` directly and asserts redirection to `/login?callbackUrl=%2Fadmin`.

### Tier 3: Combinations (Pairwise Matrix)
* **Combo 1**: Store Pickup + Surprise Off + Khanderao Branch + Coupon Applied (`GOPAL10`)
* **Combo 2**: Home Delivery + Surprise On + Uma Branch + Coupon Applied (`WELCOME50`)

### Tier 4: Real-world Scenarios
* **Complete Order Lifecycle**:
  1. Customer goes to `/custom` and places a 1kg Pineapple cake order for Store Pickup.
  2. Customer is redirected to `/order/[orderId]` (verifies initial state is `waiting_for_chef` / "Order Confirmed!").
  3. Staff opens a new context, logs in as Chef (`usr_chef_khm` / `3333`) and accepts the order.
  4. Chef checks the two QC checkboxes ("Cake matches customer order" and "Cake packed and ready for pickup") and clicks "READY FOR DISPATCH".
  5. Customer tracking page is reloaded, and status is asserted to have updated to "Ready for Dispatch" / `ready_for_pickup`.

---

## 🎯 Selectors Used in Tests
- **Weight buttons**: `page.getByRole('button', { name: '1kg', exact: true })`
- **Flavour buttons**: `page.getByRole('button', { name: 'Pineapple', exact: true })`
- **Date input**: `page.locator('input[type="date"]')`
- **Phone input**: `page.locator('input[type="tel"]')`
- **Role buttons**: `page.getByRole('button', { name: 'Admin', exact: true })`
- **Branch selection**: `page.getByRole('button', { name: 'Khanderao Branch (HQ)', exact: true })`
- **Profile selection**: `page.getByRole('button', { name: 'Chef KHM', exact: true })`
- **Keypad digits**: `page.getByRole('button', { name: '0', exact: true })`
- **Pay button**: `page.getByRole('button', { name: /Pay ₹\d+ & Confirm/ })`
