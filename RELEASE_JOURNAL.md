# Release Journal

This document tracks major feature integration milestones for the production environment.

## Priority #0 - Prerequisites Cleanup
**Status:** Completed  
**Branch:** `integration/p0-cleanup`  
**Merge Date:** 2026-07-18

### Implementation Details
- **What was implemented:**
  - Removed all legacy mock data injections (`injectMockOrder`) from `OrderContext` and UI elements.
  - Standardized branch ID resolution, wrapping all request branch references with `toBranchId()` to convert aliases to canonical DB IDs.
  - Wired optimistic `updateOrderFields` to the real REST API.
- **APIs Changed:**
  - `PATCH /api/v1/orders/[id]/edit` is now actively used.
- **Database Migrations:** None
- **Breaking Changes:** Yes. Removed `injectMockOrder`. Any stray frontend components using it will throw, but compiler checks passed cleanly.
- **Testing:** 
  - `npm run build` and `npx tsc --noEmit` verified full type safety across the monorepo. No runtime regressions observed.

---

## Priority #1 - Customer Product Browsing & Filtering
**Status:** Completed  
**Branch:** `integration/p1-product-browsing`  
**Merge Date:** 2026-07-19

### Implementation Details
- **What was implemented:**
  - Migrated Product Browsing from a client-side filter model to a server-side query model.
  - Added URL synchronization via `useRouter` and `useSearchParams` (`?category=x&search=y&sort=z&page=1`) for shareability.
  - Added Sort Dropdown UI and native Pagination UI.
  - Added strict backend parameter validation and API Error states.
- **APIs Changed:**
  - `GET /api/v1/public/products`: Added support for `category`, `search`, `sort`, `page`, and `limit` query parameters with safe fallbacks and bounds checking.
- **Database Migrations:** None
- **Breaking Changes:** No
- **Testing:**
  - Build and TS checks passed cleanly.
  - Confirmed 300ms debounce prevents API spam.
  - Confirmed edge case handling: empty search, negative pages, string limits, and bad sorts safely fall back.

---

## Priority #2 - POS Checkout Verification
**Status:** Completed  
**Branch:** `integration/p2-pos-checkout`
**Merge Date:** 2026-07-19

### Implementation Details
- **What was implemented:**
  - Verified and integrated PosCheckoutSchema into the frontend POS component (PaymentDialog.tsx).
  - Removed mock setTimeout checkout and wired real etch('/api/v1/pos/checkout') API.
  - Extended CheckoutContext and CheckoutPayload in StorefrontEngine.ts to support manual POS discounts (overrideDiscount) and isPriority flags, respecting user roles (ADMIN/MANAGER).
  - Updated the receipt generation hook (ReceiptStub.tsx) to pull live order data, and updated the related GET /api/v1/orders/[id] endpoint to include payments and media (for items) relations.
- **APIs Changed:**
  - POST /api/v1/pos/checkout: Mapped new overrideDiscount and isPriority payload fields to the StorefrontEngine.
  - GET /api/v1/orders/[id]: Added payments and items: { include: { media: true } } inclusions.
- **Payload Schema Changes:**
  - PosCheckoutSchema: Added optional overrideDiscount and isPriority fields (without strict defaults to ensure clean TS typing for z.infer).
- **Database Migrations:** None
- **Breaking Changes:** No
- **Testing:**
  - 
pm run build and 
px tsc --noEmit verified full type safety.

---

## Priority #3 - Customer Order History
**Status:** Completed  
**Branch:** `integration/p3-customer-order-history`
**Merge Date:** 2026-07-19

### Implementation Details
- **What was implemented:**
  - Removed the insecure frontend Supabase order query from CustomerOrdersPage.
  - Created a secure backend endpoint for fetching the authenticated customer's own orders.
  - Implemented pagination state and UI controls (Next/Prev) for browsing order history.
- **APIs Changed:**
  - GET /api/v1/customers/me/orders [NEW]: Fetches paginated orders strictly scoped to the authenticated user's CRM ID.
- **Database Migrations:** None
- **Breaking Changes:** No
- **Testing:**
  - 
pm run build and 
px tsc --noEmit verified full type safety.

---

## Priority #4 - Order Tracking Timeline Verification
**Status:** Completed  
**Branch:** `integration/p4-order-tracking`
**Merge Date:** 2026-07-19

### Implementation Details
- **What was implemented:**
  - Verified GET /api/v1/public/orders/[trackingId] correctly filters internal data and only exposes a public schema.
  - Handled the CONFIRMED state dynamically from the Master Order State Machine.
  - Mapped public ERP statuses directly to UI Stages (0 through 4) without altering visual animations or component layout.
  - Rendered true database timestamps (if available) into the visual progress stepper.
- **APIs Changed:**
  - GET /api/v1/public/orders/[trackingId]: Added CONFIRMED case and 	imeTarget export.
- **Database Migrations:** None
- **Breaking Changes:** No
- **Testing:**
  - 
pm run build and 
px tsc --noEmit verified full type safety.

---

## Priority #5 - Sales Orders Pagination
**Status:** Completed  
**Branch:** `integration/p5-sales-orders-pagination`
**Merge Date:** 2026-07-19

### Implementation Details
- **What was implemented:**
  - Shifted Sales Orders table from heavy client-side filtering (via \useOrders\ socket context) to server-side query-based pagination.
  - Updated \GET /api/v1/orders\ to securely process filtering (\status\, \ranch\), date ranges (\startDate\, \endDate\), full-text search (\search\), and stable sorting.
  - Re-implemented the \SalesDashboardContent\ list to track \page\ state and fetch data via \etchClient\.
  - Guaranteed deterministic ordering by chaining \id: 'desc'\ behind \createdAt\ defaults.
- **APIs Changed:**
  - \GET /api/v1/orders\: Exposed \startDate\, \endDate\, \sortField\, and \sortOrder\ schema.
- **Database Migrations:** None
- **Breaking Changes:** No
- **Testing:**
  - \
pm run build\ and \
px tsc --noEmit\ passed.

---

## Priority #6 - Order Edit Modal
**Status:** Completed  
**Branch:** `integration/p6-order-edit-modal`
**Merge Date:** 2026-07-19

### Implementation Details
- **What was implemented:**
  - Hardened the PATCH /api/v1/orders/[id]/edit API route to validate field-level edits against the Master Integration Document.
  - Implemented secure updates for \customerName\, \customerPhone\, \customerNotes\, \	argetDate\, and nested \items\ (supporting REFERENCE and PRODUCTION image attachments via \OrderItemMedia\).
  - Checked that the order is not locked (e.g. past \WAITING_FOR_CHEF\) before allowing edits.
  - Added full audit trail tracking: each changed field triggers an \AuditLog\ entry recording \oldValue\ and \
ewValue\.
  - Updated \OrderContext.tsx\ and \OrderService.ts\ to reliably relay the \id\ of \items\ so that the API can uniquely map media updates to the correct \OrderItem\.
  - Kept all existing frontend animations, modals, and RBAC rules intact.
- **APIs Changed:**
  - \PATCH /api/v1/orders/[id]/edit\: Expanded payload schema to safely handle relational updates.
- **Database Migrations:** None
- **Breaking Changes:** No
- **Testing:**
  - \
pm run build\ and \
px tsc --noEmit\ passed.

---

## Priority #7 - Vendor Coordination Board
**Status:** Completed  
**Branch:** `integration/p7-vendor-coordination`
**Merge Date:** 2026-07-19

### Implementation Details
- **What was implemented:**
  - Expanded the /api/v1/vendor/tasks endpoint to allow ADMIN, MANAGER, and SALESPERSON roles to query all active vendor tasks globally.
  - Maintained authorization boundary: Vendors (VENDOR_*) still only see their assigned tasks.
  - Refactored src/app/sales/vendors/page.tsx into a Client Component to dynamically fetch and display tasks grouped by VENDOR_PHOTO, VENDOR_FLORIST, and VENDOR_ACRYLIC.
  - Implemented loading, empty, and error states with a manual refresh button.
  - Successfully replaced all mock data while preserving the existing UI design and layouts.
- **APIs Changed:**
  - GET /api/v1/vendor/tasks: Added staff authorization and nested vendor role mapping.
- **Database Migrations:** None
- **Breaking Changes:** No
- **Testing:**
  - 
pm run build and 
px tsc --noEmit passed flawlessly.

---

## Priority #8 - Delivery Dispatch
**Status:** Completed  
**Branch:** `integration/p8-delivery-dispatch`
**Merge Date:** 2026-07-19

### Implementation Details
- **What was implemented:**
  - Hooked the Delivery Assignment UI directly to /api/v1/admin/drivers/assign via a refactored ssignDriverToOrder context method.
  - Completely removed the static DRIVERS array and replaced it with a dynamic fetch from /api/v1/admin/drivers/workload.
  - Ensured the SALESPERSON role is fully authorized by modifying RBAC logic on both ssign and workload endpoints.
  - Connected loading, success, and failure assignment states smoothly on the frontend.
  - Preserved the existing frontend layout, styling, animations, and cross-branch overload logic.
- **APIs Changed:**
  - POST /api/v1/admin/drivers/assign: Now permits SALESPERSON.
  - GET /api/v1/admin/drivers/workload: Now permits SALESPERSON and returns the mapped driver ranch name to accurately warn against cross-branch assignments.
- **Database Migrations:** None
- **Breaking Changes:** No
- **Testing:**
  - 
pm run build and 
px tsc --noEmit passed flawlessly.

---

## Priority #9 - Driver Task Synchronization
**Status:** Completed  
**Branch:** `integration/p9-driver-sync`
**Merge Date:** 2026-07-19

### Implementation Details
- **What was implemented:**
  - Replaced the hardcoded Driver Dashboard mocks with a live fetch to /api/v1/driver/deliveries.
  - Adapted the useQuery hook to request tasks isolated purely to the active driver session (e.g. ?driverId=X).
  - Swapped out mock status actions with live API calls to /api/v1/driver/deliveries/[id]/status and /vendor-status.
  - Retained the offline queueing and optimistic UI state management for snappy transitions while handling network inconsistencies.
  - Maintained full UI presentation and layout exactly as frozen.
- **Transaction Audit (Pre-P9):** Addressed the P8 ssign transaction feedback prior to proceeding by wrapping the driver assignment and timeline creation in a Prisma $transaction stringently avoiding partial assignments.
- **APIs Changed:**
  - Connected src/app/driver/page.tsx directly to existing driver endpoints.
- **Database Migrations:** None
- **Breaking Changes:** No
- **Testing:**
  - 
pm run build and 
px tsc --noEmit passed flawlessly.

---

## Priority #10 - Vendor Task Status Synchronization
**Status:** Completed  
**Branch:** `integration/p10-vendor-sync`
**Merge Date:** 2026-07-19

### Implementation Details
- **What was implemented:**
  - Connected the Vendor Dashboard UI directly to /api/v1/vendor/tasks and /api/v1/vendor/tasks/[id] endpoints.
  - Erased the mock tasks and the dummy status update logic within the client.
  - Synchronized Vendor Task lifecycle with actual OrderItem statuses within Prisma (CHEF_ACCEPTED, MAKING, READY_FOR_PICKUP).
  - Enforced vendor ownership validation fully server-side.
  - Generated timeline events mapping to vendor progression.
  - Preserved the optimistic update logic inside src/app/vendor/page.tsx offering instant visual feedback with robust rollback capability on network failure.
- **Pre-requisite (Driver Status Check P9):**
  - Validated that PATCH /api/v1/driver/deliveries/[orderId]/status safely limits updates solely to the uniquely assigned driver (ppRole === 'DELIVERY' && order.driverId !== user.id).
  - Introduced strong idempotency into both Driver Delivery Status and Driver Vendor Pickup Status endpoints; duplicate network calls natively short-circuit without emitting duplicate Timeline entries.
- **APIs Changed:**
  - GET /api/v1/vendor/tasks: Supported query override endorId exclusively for staff members simulating the Vendor UX in prototypes.
  - PATCH /api/v1/driver/deliveries/[orderId]/status: Added idempotency.
  - PATCH /api/v1/driver/deliveries/[orderId]/vendor-status: Added idempotency.
- **Database Migrations:** None
- **Breaking Changes:** No
- **Testing:**
  - 
pm run build and 
px tsc --noEmit passed cleanly.

