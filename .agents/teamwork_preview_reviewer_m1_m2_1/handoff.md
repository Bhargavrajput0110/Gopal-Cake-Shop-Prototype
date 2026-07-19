# Handoff Report — Milestones 1 & 2 Customer Auth and Orders Review

## 1. Observation

Direct observations made during the review process:
* **Observation 1 (Insecure Order Fetch & Filtering)**: In `src/app/customer/orders/page.tsx` (lines 71-74, 79-82), the client queries all orders and filters them locally:
  ```typescript
  const { data, error: dbError } = await supabase
    .from("orders")
    .select("*")
    .order("createdAt", { ascending: false });
  ...
  const userOrders = (data || []).filter((order: any) => {
    const orderPhone = cleanPhone(order.customerPhone || "");
    return orderPhone.includes(cleaned) || cleaned.includes(orderPhone);
  });
  ```
* **Observation 2 (ESLint Failures)**: Running `npx eslint src/context/CustomerAuthContext.tsx src/app/layout.tsx src/app/customer/login/page.tsx src/app/customer/login/CustomerLoginClient.tsx src/app/customer/auth/callback/page.tsx src/app/customer/orders/page.tsx src/components/layout/Navbar.tsx` returned **14 errors** and **2 warnings**:
  * `src/app/customer/orders/page.tsx:100:11`: `Avoid calling setState() directly within an effect` (`react-hooks/set-state-in-effect`).
  * `src/app/customer/orders/page.tsx:106:6`: `React Hook useEffect has a missing dependency: 'fetchOrders'`.
  * `src/app/customer/orders/page.tsx:213:86` and `293:114`: `react/no-unescaped-entities` (unescaped quotes/apostrophes in JSX).
  * `src/context/CustomerAuthContext.tsx:11,12,13`: `Unexpected any. Specify a different type` (`@typescript-eslint/no-explicit-any`).
* **Observation 3 (Specification Divergence)**: In `SPEC.md` (lines 30, 60), it explicitly states:
  > `⛔ NO customer login. NO /my-orders. NO customer accounts. Customers are identified only by phone number stored on the order.`
* **Observation 4 (Co-located Supabase Client)**: In `src/lib/supabase.ts`, `supabaseAdmin` is exported in the same file as `supabase` browser client which is imported by client-side code:
  ```typescript
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  ...
  export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, ...);
  ```

---

## 2. Logic Chain

1. From **Observation 1**, querying `supabase.from("orders").select("*")` causes Next.js client-side code to fetch all orders from the database.
2. If the user's browser receives the complete dataset of all orders, then anyone with access to the browser console can inspect the network response and extract other customers' personal and order details (names, phone numbers, delivery addresses, notes, and items). This constitutes a major **Information Disclosure / Security Leak**.
3. From **Observation 1**, filtering phone numbers using `.includes` check leads to a logic bug where a short phone number (e.g. `9876`) matches a longer phone number (e.g. `9876543210`) in both directions. This causes cross-user data leakage.
4. From **Observation 2**, the project fails ESLint checks on `src/app/customer/orders/page.tsx` and `src/context/CustomerAuthContext.tsx`. This indicates that the implementation has unhandled React hook rendering patterns (such as calling `setState` directly in `useEffect` causing cascading renders) and typing issues.
5. From **Observation 3**, the implementation directly contradicts the locked spec decision that customer accounts and customer login should not exist. This indicates an architectural misalignment between the code changes and `SPEC.md`.
6. From **Observation 4**, importing a file that instantiates a client with a service role key into `use client` files creates a minor risk of bundling or leaking server-only credentials.

---

## 3. Caveats

* **RLS Policies**: We did not verify the actual RLS policies enabled on the Supabase database. If RLS is properly set up to reject `.select("*")` from unauthenticated or regular customer accounts, the security leak might be partially mitigated at the database layer (returning an empty array or restricted rows). However, the query itself remains insecure and poorly optimized.
* **Metadata Presence**: We assumed that users logging in via magic link might not have phone number metadata unless they go through the signUp page first, which is a common edge case for passwordless flows.

---

## 4. Conclusion

The implementation for Milestones 1 and 2 has a verdict of **REQUEST_CHANGES**. The critical security vulnerability in the orders page, the overlapping phone matching flaw, the linting failures, and the architectural misalignment with `SPEC.md` must be addressed before the changes can be approved.

---

## 5. Verification Method

To independently verify the findings:
1. Run `npx eslint src/context/CustomerAuthContext.tsx src/app/layout.tsx src/app/customer/login/page.tsx src/app/customer/login/CustomerLoginClient.tsx src/app/customer/auth/callback/page.tsx src/app/customer/orders/page.tsx src/components/layout/Navbar.tsx` to observe the lint errors.
2. Run `npm run build` to confirm the compilation completes.
3. Open `src/app/customer/orders/page.tsx` and inspect lines 71-82 to verify the insecure `select("*")` and `.includes()` phone filtering logic.
