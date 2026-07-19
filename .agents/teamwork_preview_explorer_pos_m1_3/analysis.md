# POS Route & API Route Exploration Analysis

## Summary of Findings
1. **POST /api/orders Constraint Failure (Task 2)**: Posting an order from `/sales/pos` fails at the database level with a PostgreSQL check constraint error: `new row for relation "orders" violates check constraint "orders_orderType_check" (Code: 23514)`. This is because the POS client sends `orderType: "takeaway"`, but the database check constraint only accepts `'walk_in'`, `'pickup'`, or `'delivery'`.
2. **Order ID Generation Race Condition**: Order IDs are generated in the API route by counting existing orders (`select count(*)`) and adding a offset: `KHM-${10200 + count + 1}`. Under concurrent load (e.g., during stress testing), this leads to duplicate ID generation and database insertion failures due to primary key conflicts.
3. **Payload Field Mapping**: Most fields sent in the POS payload map directly to Supabase columns. While `customerInstructions` is not defined in the Prisma schema (which uses `customerNotes`), the Supabase database schema *does* contain a `customerInstructions` column which is successfully written to.

---

## 1. Checkout Implementation in `src/app/sales/pos/page.tsx`
The POS client uses local state to manage cart items and triggers `handleCheckout` when one of the payment buttons (Cash, UPI, Card) is clicked:
- **Local State**: `cartItems` holds items with `productId`, `name`, `price`, `quantity`, and optionally `image`.
- **Payload Construction**:
  ```typescript
  const payload = {
    orderType: "takeaway", // ❌ Causes database check constraint violation
    status: "waiting_for_chef",
    customerName: "Walk-in Customer",
    customerPhone: "POS-" + Date.now().toString().slice(-6),
    branch: "Khanderao Branch",
    items: cartItems.map(i => ({ name: i.name, qty: i.quantity, weight: "1kg" })),
    subtotal,
    discount: 0,
    tax,
    deliveryCharge: 0,
    grandTotal,
    advancePaid: grandTotal,
    pendingBalance: 0,
    priorityLevel: "normal",
    isSurprise: false,
    timeTarget: new Date(Date.now() + 15 * 60000).toISOString(),
    customerInstructions: `Payment: ${paymentMethod}`
  };
  ```
- **API Call**: Submits a `POST` request to `/api/orders` with JSON body payload.

---

## 2. API Route & Database Column Mapping in `src/app/api/orders/route.ts`
- **Field Mapping**: The route extracts the JSON body and spreads it directly into the database payload (`...body`), meaning all payload fields map directly to columns in the Supabase `orders` table.
- **Branch Translation**: The API normalizes human-readable branch names (e.g., `"Khanderao Branch"` maps to `"khanderao"`) before inserting.
- **Additional Appended Fields**:
  - `id`: Human-readable order ID.
  - `timeline`: Array starting with order creation timestamp.
  - `createdAt` / `updatedAt`: ISO Timestamps.

---

## 3. Order ID Generation Logic
Order IDs are generated on the server inside the POST handler using:
```typescript
const { count } = await supabaseAdmin
  .from('orders')
  .select('*', { count: 'exact', head: true });

const orderId = `KHM-${10200 + (count || 0) + 1}`;
```
- **Vulnerability**: This method relies on an application-level count query. If multiple requests are processed concurrently, they will retrieve the same count and attempt to insert the same `orderId`, resulting in a database unique-constraint conflict.

---

## 4. Constraint Analysis & Database Validation
Using a test script (`test_insert.ts`) to query and test insertions directly against the Supabase `orders` table, the following results were obtained:

| orderType tested | Database Result | Notes |
|---|---|---|
| `takeaway` | ❌ Fails (Constraint error) | Violates `orders_orderType_check` |
| `walk_in` | ✅ Success | Accepted by constraint |
| `pickup` | ✅ Success | Accepted by constraint |
| `delivery` | ✅ Success | Accepted by constraint |
| `PICKUP` | ❌ Fails (Constraint error) | Case-sensitive violation |
| `DELIVERY` | ❌ Fails (Constraint error) | Case-sensitive violation |

### Verification Error Log:
```
--- Testing orderType: "takeaway" ---
❌ Failed with error: new row for relation "orders" violates check constraint "orders_orderType_check" (Code: 23514)
--- Testing orderType: "walk_in" ---
✅ Success! Data: [...]
```

---

## Recommendations / Proposed Fixes

### A. Fix POS Order Type (Immediate Fix)
Update `src/app/sales/pos/page.tsx` line 105:
```typescript
// Before
orderType: "takeaway",

// After
orderType: "walk_in",
```

### B. Solve ID Race Condition (Architectural Improvement)
Instead of relying on `count` to generate human-readable sequential IDs at the API tier, consider:
1. Using PostgreSQL native auto-incrementing/sequence generator columns.
2. Generating a UUID at the application layer and using a separate column for display order numbers.
3. Implementing a retry loop in the API route if a duplicate key error is encountered, or using a transaction lock.
