# Gopal Cake Shop - E2E Testing Analysis Report

This report outlines the codebase analysis for E2E testing readiness, file paths, and HTML selectors for critical user journeys.

---

## 1. Playwright Installation & Package Readiness

### Current Status
An analysis of the root `package.json`, `package-lock.json`, and `node_modules` shows that **neither `@playwright/test` nor any other Playwright packages are currently installed**.

*   `package.json` contains `"puppeteer": "^25.1.0"`, but does not mention `@playwright/test` or `playwright`.
*   `node_modules` does not contain any directory matching `playwright` or `@playwright/test`.

### Required NPM Packages
To enable robust end-to-end (E2E) testing with Playwright, the following packages and configurations are needed:

1.  **`@playwright/test`** (DevDependency):
    *   **Purpose**: The main Playwright test library and runner.
    *   **Installation Command**: `npm install --save-dev @playwright/test`
2.  **Playwright Browsers**:
    *   **Purpose**: Local browser binaries (Chromium, Firefox, WebKit) for running E2E tests.
    *   **Installation Command**: `npx playwright install` or `npx playwright install --with-deps` (to automatically install OS dependencies if needed).

---

## 2. Core Pages, Layouts, and Component File Paths

| Page / Component | Route / Access Path | Main File Path | Layout File Path | Notes / Key Features |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | `/` | `src/app/page.tsx` | `src/app/layout.tsx` | Main customer-facing page. Renders Hero, FeaturedProducts, Categories, and InteractiveCategoryExplorer. |
| **Product Detail Page** | `/product/[id]` | `src/app/product/[id]/page.tsx` | `src/app/layout.tsx` | Interactive multi-step order form for choosing weight, flavor, date/time, and delivery details. |
| **Cart Drawer** | *Overlay component* | `src/components/cart/CartDrawer.tsx` | N/A (Client component) | Global cart drawer rendered via `HeaderFooterWrapper`. |
| **Guest Checkout Form** | *Inside Cart Drawer* | `src/components/cart/CartDrawer.tsx` | N/A (Inline conditional form) | Visible inside the Cart Drawer when `isCheckoutView` is `true`. |
| **Staff Login Page** | `/login` | `src/app/login/page.tsx` (Server)<br>`src/app/login/LoginClient.tsx` (Client) | Dedicated login screen | Overrides root layout header/footer. Implements a multi-step role/branch/profile selection and custom PIN keypad. |
| **Order Tracking Page** | `/order/[orderId]` | `src/app/order/[orderId]/page.tsx` | `src/app/layout.tsx` | Displays live order status timeline, order details, and payment options for pending quotes. |

---

## 3. Exact HTML Selectors for Critical Interactive Elements

The following sections define how E2E test scripts can target and interact with the site's critical functionality.

### A. Homepage (Add to Cart & Drawer Management)
*   **Categories Explorer Category Tabs**:
    *   *Selector*: `button:has-text("Bestsellers")`, `button:has-text("Wedding")`, `button:has-text("Anniversary")`, `button:has-text("Birthday")`, `button:has-text("Designer")`
*   **Add to Cart (Items 1-3)**:
    *   *Selector*: Target the parent card containing the product name, then click the add button.
    *   *Playwright locator*: `page.locator('div.group').filter({ hasText: 'Pink Blossom Truffle' }).getByRole('button', { name: 'Add to Cart' })` or `button:has-text("Add to Cart")` inside the card.
*   **Add to Cart (Item 4 - Bottom Banner)**:
    *   *Selector*: `button:has-text("Add to Cart")` inside the banner row, or `locator('button:has-text("Add to Cart")').last()`.
*   **Open Cart Drawer (Navbar)**:
    *   *Selector*: `button:has(svg.lucide-shopping-bag)` or `getByRole('button', { name: 'Cart' })`.
*   **Close Cart Drawer**:
    *   *Selector*: `button:has(svg.lucide-x)` inside the drawer.
*   **Adjust Quantities inside Drawer**:
    *   *Minus button*: `button:has(svg.lucide-minus)`
    *   *Plus button*: `button:has(svg.lucide-plus)`
*   **Proceed to Checkout (normal Cart Drawer view)**:
    *   *Selector*: `button:has-text("Proceed to Checkout")` or `button:has(svg.lucide-arrow-right)`.

### B. Guest Checkout Form (inside Cart Drawer)
*   **Full Name Input**:
    *   *Selector*: `input[placeholder="Gopal Customer"]` or relative search `label:has-text("Full Name") + div input`.
*   **Phone Number Input**:
    *   *Selector*: `input[placeholder="+91 9876543210"]` or relative search `label:has-text("Phone Number") + div input`.
*   **Delivery Address Textarea**:
    *   *Selector*: `textarea[placeholder="123 Bakery Lane, Vadodara"]` or relative search `label:has-text("Delivery Address") + div textarea`.
*   **Select Branch Dropdown**:
    *   *Selector*: `select` or relative search `label:has-text("Select Branch") + select`.
    *   *Branch Options*: `option[value="khanderao"]` (Khanderao Branch HQ), `option[value="elora"]` (Elora Park Branch), `option[value="uma"]` (Uma Branch).
*   **Special Instructions Input**:
    *   *Selector*: `input[placeholder="e.g. Write Happy Birthday Priya"]`.
*   **Pay & Submit Order (Checkout view)**:
    *   *Selector*: `button:has-text("Pay ₹")` or `button.bg-primary` inside the checkout footer.
    *   *Crucial Logic Note*: This submit button is outside the `<form>` tag and uses a direct click handler `onClick={handleCheckout}`. This bypasses HTML5 validation, so blank required fields may result in backend error responses rather than browser tooltips.

### C. Product Detail Page & Custom Design Page (Choose Details & Order)
*   **Select Weight (Step 1)**:
    *   *Selector*: `button:has-text("1kg")` or `button:has-text("500g")` (matches labels in `WEIGHT_OPTIONS`).
*   **Search Flavours Input (Step 2)**:
    *   *Selector*: `input[placeholder="Search flavours... (e.g. Butterscotch, Mango)"]`.
*   **Select Flavour (Step 2)**:
    *   *Selector*: `button:has-text("Chocolate Truffle")` or matching flavor name.
*   **Cake Message Input (Step 3)**:
    *   *Selector*: `input[placeholder='e.g. "Happy Birthday Priya! 🎂"']`.
*   **Cake Quantity (Step 3)**:
    *   *Minus button*: `button:has-text("-")`
    *   *Plus button*: `button:has-text("+")`
*   **Date Required**:
    *   *Selector*: `input[type="date"]`.
*   **Preferred Time**:
    *   *Selector*: `input[type="time"]`.
*   **Delivery Type Toggles**:
    *   *Store Pickup*: `button:has-text("Store Pickup")`
    *   *Home Delivery*: `button:has-text("Home Delivery")`
*   **Delivery Address Details (Home Delivery only)**:
    *   *House / Flat / Block No.*: `input[placeholder="e.g. 38, Amrutnagar"]`.
    *   *Area / Road*: `input[placeholder="Fetched from map"]` (Read-only).
    *   *Landmark*: `input[placeholder="e.g. Opposite XYZ School"]`.
*   **Branch Dispatch Selector**:
    *   *Selector*: `button:has-text("Khanderao Market")` or other branch name.
*   **Surprise Toggle**:
    *   *Selector*: `button:has(div.shadow-sm)` adjacent to "Make it a Surprise".
    *   *Recipient Name*: `input[placeholder="Who is getting the cake?"]`.
*   **Contact Number**:
    *   *Selector*: `input[placeholder="+91 XXXXX XXXXX"]`.
*   **Promo Coupon Code**:
    *   *Input*: `input[placeholder="COUPON CODE"]` (Product Page) or `input[placeholder="e.g. GOPAL10"]` (Custom Page).
    *   *Apply Button*: `button:has-text("APPLY")` (Product Page) or `button:has-text("Apply")` (Custom Page).
*   **Submit Order (Pay & Confirm)**:
    *   *Selector*: `button:has-text("Confirm")` or `button:has-text("Pay ₹")` (matches string generated by selected state).
*   **Request Quote (Bargain - Custom Design Page Only)**:
    *   *Selector*: `button:has-text("Request a Quote")`.

### D. Staff Login Page
*   **Step 1: Select Role**:
    *   *Selector*: `button:has-text("Admin")`, `button:has-text("Manager")`, `button:has-text("Sales")`, `button:has-text("Chef")`.
*   **Step 2: Select Branch** (Hidden for Admins):
    *   *Selector*: `button:has-text("Branch Name")` (e.g. `button:has-text("Khanderao Market")`).
*   **Step 3: Select Profile**:
    *   *Selector*: `button:has-text("Profile Name")`.
*   **Step 4: Custom Keypad PIN Entrance**:
    *   *Selector for Digit Buttons*: `button:has-text("1")`, `button:has-text("2")`, etc.
    *   *Selector for Delete Button*: `button:has(svg.lucide-delete)`.

### E. Order Tracking Page
*   **Pay Advance (Quote Sent View)**:
    *   *Selector*: `button:has-text("Pay ₹")` or `button:has-text("Now")`.
*   **Navigation**:
    *   *Back Link*: `a:has-text("Back to Menu")`.
