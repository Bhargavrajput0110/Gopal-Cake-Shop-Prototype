# Original User Request

## 2026-07-04T14:45:05Z

Simulate order traffic and stress-test the application while simultaneously implementing the new Point of Sale (POS) system and optimizing website performance.

Working directory: d:\Gopal Cake Shop
Integrity mode: development

## Requirements

### R1. Implement Point of Sale (POS)
Build the Point of Sale interface at the route `/sales/pos`. It should allow sales staff to quickly create walk-in or phone orders and process payments.

### R2. Stress Testing Script
Create a load-testing script (using a tool like `k6` or `autocannon`) that simulates different types of customers creating orders via the API. The script should run locally and output a performance report.

### R3. Performance Optimization
Identify and implement optimizations for database queries, API caching, React rendering, and image loading to ensure the application handles the simulated traffic smoothly.

## Acceptance Criteria

### POS System
- [ ] Navigating to `http://localhost:3000/sales/pos` renders the new POS interface without errors.
- [ ] A test order can be successfully created and saved to the database via the POS interface.

### Stress Testing & Optimization
- [ ] A load testing script (e.g. `scripts/load_test.js`) can be executed and successfully simulates multiple concurrent API requests for order creation.
- [ ] The load testing script outputs a clear report showing Requests Per Second (RPS) and average latency.
- [ ] The application remains responsive and does not crash during the load test execution.

## 2026-07-05T10:18:24Z

Implement the next major development phase of the Gopal Cake Shop platform, adding five key features: a customer reviews & ratings system, PWA push notifications for order status updates, a rich admin analytics dashboard, PDF invoice/receipt generation, and product detail pages with full image galleries.

Working directory: d:\Gopal Cake Shop
Integrity mode: benchmark

## Context

This is a Next.js 16 application using Supabase (PostgreSQL) as the database and Cloudinary for image storage. The existing codebase has:
- Customer-facing pages: `/`, `/menu`, `/custom`, `/order/[id]`, `/customer/login`, `/customer/orders`
- Staff portals: `/sales`, `/chef`, `/delivery`, `/admin`, `/vendor`
- Real-time order state management via Supabase Realtime
- Authentication via Supabase Auth (`CustomerAuthContext`)
- Branch system with canonical IDs: `khanderao`, `uma`, `elora`, `varasiya`

## Requirements

### R1. Customer Reviews & Ratings
Allow logged-in customers to leave a star rating (1–5) and a text review on a cake/product after their order is marked `completed`. Reviews must be displayed publicly on the product detail page and the menu page. The admin dashboard must be able to moderate (approve/hide) reviews.

### R2. PWA Push Notifications
Customers who have placed an order should receive browser push notifications when their order status changes (e.g., "Your cake is being baked!", "Your order is ready for pickup!"). This requires a service worker integration and push subscription management tied to the customer's order ID.

### R3. Admin Analytics Dashboard
Expand the `/admin` dashboard with a rich data visualization section showing: daily/weekly/monthly revenue trends (line chart), top-selling cake flavours (bar chart), orders by branch (donut chart), and a conversion funnel (new orders → accepted → completed). Use recharts or a similar charting library already compatible with the project's Next.js version.

### R4. PDF Invoice Generation
After an order is placed (or from the Order History page), customers and admins must be able to download a professionally formatted PDF invoice containing: order ID, customer details, itemized list with prices, subtotal, delivery charge, discount, grand total, and Gopal Bakery branding.

### R5. Product Detail Pages
Create rich product detail pages at `/product/[slug]` for each cake category. Each page must include: a full-width image gallery, description, ingredients/allergens section, customer reviews pulled from R1, a price range indicator, and a direct "Order This Cake" CTA linking to `/custom` with the relevant parameters pre-filled.

## Acceptance Criteria

### Reviews & Ratings
- [ ] A logged-in customer can submit a star rating and text review from their Order History page.
- [ ] Reviews are visible on the relevant product detail page.
- [ ] The admin panel has a UI to approve or hide reviews.

### Push Notifications
- [ ] The app registers a service worker for push notifications.
- [ ] A customer who grants permission receives a browser notification when their order status changes.

### Analytics Dashboard
- [ ] The `/admin` page renders at least 3 distinct chart types (line, bar, donut) with real order data from Supabase.
- [ ] Charts are responsive and render correctly on both desktop and mobile.

### PDF Invoices
- [ ] A "Download Invoice" button on the Order Tracking page (`/order/[id]`) generates and downloads a PDF.
- [ ] The PDF contains order ID, itemized costs, and Gopal Bakery branding (name/logo).

### Product Pages
- [ ] At least 6 product detail pages exist at `/product/[slug]`.
- [ ] Each page has a working image gallery and a "Order This Cake" CTA.
- [ ] Each page passes the Next.js build (`npm run build`) without errors.
