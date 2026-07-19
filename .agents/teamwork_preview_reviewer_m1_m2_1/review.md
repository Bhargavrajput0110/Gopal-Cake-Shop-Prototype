# Review Report — Milestones 1 & 2 Customer Auth and Orders

## Review Summary

**Verdict**: **REQUEST_CHANGES**

**Summary**:
The implemented changes successfully build and run on Next.js 16. However, they contain a **critical security vulnerability** (information disclosure via client-side filtering of the entire `orders` table), an **adversarial logic flaw** in phone number matching, **compilation-blocking lint errors**, and an **architectural conflict** with the project's specification (`SPEC.md`).

---

## Findings

### [Critical] 1. Information Disclosure / Security Leak in Order History Page
- **What**: The customer orders page fetches *all* records from the database `orders` table (`.select("*")`) without any query-level filter, and performs filtering on the client side in JavaScript.
- **Where**: `src/app/customer/orders/page.tsx` (lines 71-74):
  ```typescript
  const { data, error: dbError } = await supabase
    .from("orders")
    .select("*")
    .order("createdAt", { ascending: false });
  ```
- **Why**: This leaks the private order details (customer names, phone numbers, delivery addresses, totals, items, and notes) of *every single customer* in the database to the browser of *any* logged-in customer. A malicious user can open the network tab or console to read everyone's data. It is also extremely inefficient and will cause performance to degrade as the order volume grows.
- **Suggestion**: Add a direct query filter to Supabase: `.eq("customerPhone", phoneNum)` or similar. Do not fetch unfiltered tables.

### [Major] 2. Substring Matching Logic Flaw in Phone Filtering
- **What**: The client-side phone number filter uses a substring match (`.includes`) in both directions.
- **Where**: `src/app/customer/orders/page.tsx` (lines 79-82):
  ```typescript
  const userOrders = (data || []).filter((order: any) => {
    const orderPhone = cleanPhone(order.customerPhone || "");
    return orderPhone.includes(cleaned) || cleaned.includes(orderPhone);
  });
  ```
- **Why**: Under this logic, if customer A has phone number `9876` and customer B has `9876543210`, customer A will see customer B's orders (since `9876543210` includes `9876`). Conversely, customer B will see customer A's orders. This results in cross-user data leakage.
- **Suggestion**: Use exact match (`orderPhone === cleaned`) rather than `.includes()`.

### [Major] 3. Architectural Conflict with Locked Specification
- **What**: The implementation introduces a customer authentication system (sign up, sign in, passwordless magic link, customer order history).
- **Where**: All files under review.
- **Why**: `SPEC.md` explicitly lists a "locked decision" stating: `⛔ NO customer login. NO /my-orders. NO customer accounts. Customers are identified only by phone number stored on the order.` And: `Customers are anonymous — no accounts.` The implementation directly contradicts this specification.
- **Suggestion**: Discuss with the product team or orchestrator to either revert this feature or update the locked decisions in `SPEC.md` to support customer auth.

### [Major] 4. ESLint Errors and Warnings
- **What**: Multiple linting errors block clean deployments.
- **Where**:
  - `src/app/customer/orders/page.tsx`:
    - Line 100: `react-hooks/set-state-in-effect` (calling `setState` synchronously within `useEffect` during mount triggers cascading renders).
    - Line 106: `react-hooks/exhaustive-deps` (missing dependency `fetchOrders`).
    - Line 213, 293: `react/no-unescaped-entities` (unescaped quotes/apostrophes in JSX).
  - `src/context/CustomerAuthContext.tsx`:
    - Lines 11, 12, 13: `no-explicit-any` errors on the context method signatures.
- **Why**: These issues degrade code quality, can hurt runtime performance, and block strict CI builds.
- **Suggestion**: Resolve the unescaped entities, use specific types, and wrap the fetch in `useEffect` cleanly (using `useCallback` for `fetchOrders` and listing it as a dependency).

### [Minor] 5. Client-Server Supabase Client Co-location
- **What**: Both the public browser Supabase client and the `supabaseAdmin` client (using the secret role key) are created in the same file `src/lib/supabase.ts` which is imported by client-side code.
- **Where**: `src/lib/supabase.ts`.
- **Why**: While Next.js strips server-only environment variables by replacing them with `undefined` on the client, exporting `supabaseAdmin` in a file bundled for the browser is a code smell. It creates a risk of bundling issues or unintended exposure.
- **Suggestion**: Split `src/lib/supabase.ts` into `src/lib/supabase/client.ts` (for browser client) and `src/lib/supabase/admin.ts` (for server-only administration).

---

## Verified Claims

- **Browser `supabase` client usage** → verified via `view_file` on `src/lib/supabase.ts` and `src/context/CustomerAuthContext.tsx` → **PASS** (uses public URL and anon key).
- **SignUp metadata capturing** → verified via `view_file` on `src/context/CustomerAuthContext.tsx` and `CustomerLoginClient.tsx` → **PASS** (correctly saves `name` and `phone` to `options.data`).
- **Magic Link login invokes `signInWithOtp`** → verified via `view_file` on `CustomerLoginClient.tsx` and `CustomerAuthContext.tsx` → **PASS** (invokes `signInWithOtp` with redirect URL).
- **Order History page displays orders matching `customerPhone` from metadata** → verified via `view_file` on `src/app/customer/orders/page.tsx` → **PASS** (filters correctly based on the phone number, but insecurely).
- **Navbar reflects session state** → verified via `view_file` on `src/components/layout/Navbar.tsx` → **PASS** (toggles links/buttons correctly based on presence of `user`).
- **Next.js build compilation** → verified via `run_command` (`npm run build`) → **PASS** (compiles successfully).
- **ESLint cleanliness** → verified via `run_command` (`npx eslint ...`) → **FAIL** (14 errors, 2 warnings found in reviewed files).

---

## Adversarial Stress Testing

### 1. Magic Link Email Sign In Without Phone Metadata
- **Scenario**: A user logs in via Magic Link. This auth process creates a user in `auth.users` but might not populate `phone` in `user_metadata` unless they previously signed up.
- **Failure Mode**: If they sign in passwordless using a new email directly, they bypass the Sign Up form, so their `user_metadata` will NOT have a `phone` number.
- **Actual/Predicted Behavior**: When they access `/customer/orders`, the page displays the error message: `"No phone number associated with this account. Please update your profile."` However, there is no profile update interface implemented, leaving the user permanently stuck.
- **Mitigation**: Implement a phone verification step on first login if phone metadata is missing, or require a phone number before issuing magic links.

### 2. Overlapping Phone Matches
- **Scenario**: A user with phone number `1234` and another with `1234567890` both place orders.
- **Failure Mode**: Short or overlapping phone numbers match each other due to the `includes` check.
- **Actual/Predicted Behavior**: The user logged in with phone number `1234567890` will see all orders belonging to `1234`, and vice versa.
- **Mitigation**: Enforce exact string match.

---

## Coverage Gaps

- **Row Level Security (RLS) Configuration** — risk level: **HIGH** — recommendation: **Investigate**. We did not find database migration files or SQL scripts configuring RLS for the `orders` table. If RLS is not properly configured, anyone can read or modify any order by invoking the Supabase client directly, which is particularly dangerous given the client-side `.select("*")` query.

## Unverified Items

- **Real WhatsApp Notification flow Integration** — Reason not verified: We did not test real deep-link redirections as they require manual click action in a browser.
