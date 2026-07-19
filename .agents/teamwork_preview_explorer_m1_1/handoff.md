# Handoff Report - Prisma Schema additions & Customer Auth Investigation

## 1. Observation

### A. Prisma Schema (`prisma/schema.prisma`)
The existing schema defines three primary models of interest:
* **`User`** (lines 38-55):
  ```prisma
  model User {
    id            String    @id @default(cuid())
    name          String
    email         String?   @unique
    username      String?   @unique
    password      String    // Hashed
    phone         String?   @unique
    role          Role      @default(CUSTOMER)
    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt
    // ... relations ...
  }
  ```
* **`Product`** (lines 82-96):
  ```prisma
  model Product {
    id            String    @id @default(cuid())
    name          String
    slug          String    @unique
    description   String?
    basePrice     Float
    images        String[]  // Cloudinary URLs
    categoryId    String
    category      Category  @relation(fields: [categoryId], references: [id])
    isActive      Boolean   @default(true)
    // ...
  }
  ```
* **`Order`** (lines 98-131):
  ```prisma
  model Order {
    id            String    @id @default(cuid())
    orderNumber   String    @unique
    customerId    String
    customer      User      @relation("CustomerOrders", fields: [customerId], references: [id])
    // ...
  }
  ```

### B. Seeds (`src/app/api/admin/seed/route.ts` and `scripts/seed_orders.ts`)
* **`src/app/api/admin/seed/route.ts`**:
  * Implements `POST` (lines 98-214) to upsert dummy data into PostgreSQL via `supabaseAdmin`.
  * Branches: Khanderao Market (`khanderao`), Uma (`uma`), Varasiya (`varasiya`), Elora (`elora`).
  * Users: Seeded with 7 staff members (`usr_admin`, `usr_manager_khm`, `usr_sales_khm`, `usr_chef_khm`, etc.) with role and PIN credentials.
  * Categories: 62 product categories defined (lines 21-84) (e.g. `butter-cream`, `fresh-cream`, `wedding`).
  * Products: 8 predefined product objects (lines 127-192) including `Classic Chocolate Cake` (price `450`, category `birthday`), `Premium Red Velvet Cake` (price `650`, category `anniversary`).
* **`scripts/seed_orders.ts`**:
  * Seeds three sample order items (Custom Cake, Photo Cake, Walk-in POS) into the `orders` table (lines 15-136).
* **`package.json`**:
  * Contains a seed script entry: `"seed": "npx tsx scripts/seed.ts"` (line 10), but `scripts/seed.ts` is not present in the workspace. Seeding is triggered via `POST /api/admin/seed` or running `tsx scripts/seed_orders.ts`.

### C. Customer Authentication (`src/context/CustomerAuthContext.tsx` and `src/app/customer/orders/page.tsx`)
* **Authentication Method**:
  * Handled client-side using **Supabase Auth** (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`, `supabase.auth.signInWithOtp` in `CustomerAuthContext.tsx` lines 54-85).
  * Exposes the authenticated `user` and `session` objects globally via `useCustomerAuth()` hook (lines 109-115).
* **User ID Retrieval**:
  * In `src/app/customer/orders/page.tsx` (lines 53, 101-108, 152):
    ```typescript
    const { user, loading, logout } = useCustomerAuth();
    // ...
    const phone = user.user_metadata?.phone || user.phone;
    ```
    The logged-in customer's primary identifier is the Supabase auth UUID stored in `user.id`.
  * Orders are currently queried in `fetchOrders` (line 72) by matching the phone number:
    ```typescript
    const { data, error: dbError } = await supabase
      .from("orders")
      .select("*")
      .or(`customerPhone.eq.${phoneNum},customerPhone.eq.${cleaned}`)
    ```

### D. Prisma 7.x Validation Error
Running `npx prisma validate` on the existing codebase fails with:
```
error: The datasource property `url` is no longer supported in schema files. Move connection URLs for Migrate to `prisma.config.ts`...
```
This is because `prisma.config.ts` has been generated for Prisma v7.x, but the `schema.prisma` file still contains `url = env("DATABASE_URL")` on line 7.

---

## 2. Logic Chain

1. **Mapping Customer Auth to Schema**:
   * Since customer authentication is powered by Supabase Auth, the customer's unique user ID is their Supabase Auth UUID (`user.id`).
   * In the existing Prisma schema, the `User` model represents all system actors, including customers (via `role: Role @default(CUSTOMER)`).
   * To link a `Review` or `PushSubscription` to a customer, we should relate it to the `User` model. This requires that when a customer registers via `CustomerAuthContext.tsx`, their Supabase Auth UUID is inserted as the `id` of a `User` record with role `CUSTOMER` in the database.
   * This bridges client-side auth state (`user.id`) directly with the Prisma-backed `User` model, maintaining full relational integrity.

2. **`Review` Model Relations**:
   * The `Review` model needs to represent a product feedback.
   * It requires a relation to `Product` (`productId` references `Product.id`).
   * It requires a relation to `User` / Customer (`customerId` references `User.id`).
   * It requires a relation to `Order` to trace purchase history / verified reviews. Since guest checkouts exist or reviews could be submitted without a verified order, the `orderId` relation should be optional (`orderId String?` and `order Order?`).

3. **`PushSubscription` Model Relations & Keys**:
   * The `PushSubscription` model stores browser subscription payloads.
   * It requires a relation to a logged-in Customer (`customerId` references `User.id`) or a specific guest/auth Order (`orderId` references `Order.id`). Because a subscriber could be a logged-in user OR an anonymous guest tracking a single order, both `customerId` and `orderId` must be optional.
   * Browser push subscriptions contain `endpoint` (String), `p256dh` (String key), and `auth` (String key). We can store these as separate fields (`p256dh String`, `auth String`) or combine them into a single `keys Json` field for postgres. Both designs are detailed below.

---

## 3. Caveats

* **Authentication Sync Trigger**: The codebase currently does not automatically insert a `User` row into the public schema when a client signs up via client-side Supabase Auth. A database trigger (e.g. `after insert on auth.users`) or a public API call on successful registration must be added to replicate customer users from `auth.users` to the public `User` table.
* **Pluralized Table Names**: Supabase client queries use lowercase plurals (e.g. `from('users')`, `from('orders')`, `from('customers')`). If the Prisma schema is migrated directly to PostgreSQL, tables will default to singular capitalization (e.g. `User`, `Order`), unless mapped explicitly with `@@map`.
* **Prisma v7 datasource requirement**: In Prisma 7, `url` must be deleted from `prisma/schema.prisma` and managed solely via `prisma.config.ts`.

---

## 4. Conclusion

### A. Exact Prisma Schema Additions

To resolve the validate error and add the models, we recommend updating the `datasource db` block and appending the new models to `prisma/schema.prisma`:

```prisma
// Modified Datasource Block for Prisma 7.x Compatibility
datasource db {
  provider = "postgresql"
}

// ==========================================
// NEW MODELS added for Milestone 1
// ==========================================

model Review {
  id          String   @id @default(cuid())
  rating      Int      // e.g. 1 to 5 stars
  comment     String?
  approved    Boolean  @default(false) // Approval status for moderation
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  customerId  String
  customer    User     @relation("CustomerReviews", fields: [customerId], references: [id], onDelete: Cascade)

  orderId     String?
  order       Order?   @relation("OrderReviews", fields: [orderId], references: [id], onDelete: SetNull)
}

// Option A: Storing Web Push keys as separate String fields
model PushSubscription {
  id         String   @id @default(cuid())
  endpoint   String   @unique
  p256dh     String   // browser subscription public key
  auth       String   // browser subscription auth secret
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  customerId String?
  customer   User?    @relation("CustomerPushSubscriptions", fields: [customerId], references: [id], onDelete: Cascade)

  orderId    String?
  order      Order?   @relation("OrderPushSubscriptions", fields: [orderId], references: [id], onDelete: Cascade)
}

// Option B (Alternative): Storing Web Push keys as a JSON object
// model PushSubscription {
//   id         String   @id @default(cuid())
//   endpoint   String   @unique
//   keys       Json     // contains auth and p256dh fields
//   createdAt  DateTime @default(now())
//   updatedAt  DateTime @updatedAt
//
//   customerId String?
//   customer   User?    @relation("CustomerPushSubscriptions", fields: [customerId], references: [id], onDelete: Cascade)
//
//   orderId    String?
//   order      Order?   @relation("OrderPushSubscriptions", fields: [orderId], references: [id], onDelete: Cascade)
// }
```

### B. Modifications to Existing Models
The following back-relations must be added to the existing models in `prisma/schema.prisma`:

1. **Modify `User` model**:
   ```prisma
   model User {
     // ... (existing fields) ...

     reviews           Review[]           @relation("CustomerReviews")
     pushSubscriptions PushSubscription[] @relation("CustomerPushSubscriptions")
   }
   ```
2. **Modify `Product` model**:
   ```prisma
   model Product {
     // ... (existing fields) ...

     reviews           Review[]
   }
   ```
3. **Modify `Order` model**:
   ```prisma
   model Order {
     // ... (existing fields) ...

     reviews           Review[]             @relation("OrderReviews")
     pushSubscriptions PushSubscription[]   @relation("OrderPushSubscriptions")
   }
   ```

---

## 5. Verification Method

To verify these database models and the authentication flow:
1. **Validate Prisma Schema Syntax**:
   After removing `url = env("DATABASE_URL")` from `prisma/schema.prisma`, run the Prisma CLI validator from the workspace root:
   ```powershell
   npx prisma validate
   ```
2. **Verify Client-Side Auth State**:
   Inspect the browser state or React DevTools on the `/customer/orders` page. Ensure `useCustomerAuth()` populates the `user` object with the UUID from Supabase.
3. **Re-run Seeds**:
   Trigger the seed API with a POST to `/api/admin/seed` to ensure no database constraint issues exist for current seeded categories, products, or users.
