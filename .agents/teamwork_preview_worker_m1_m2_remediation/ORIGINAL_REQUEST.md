## 2026-07-05T09:20:15Z

You are teamwork_preview_worker. Your working directory is d:\Gopal Cake Shop\.agents\teamwork_preview_worker_m1_m2_remediation.

Your objective is to fix the critical security and quality issues in the customer authentication and order history pages identified by the reviewers.

Files to modify:
1. `src/app/customer/orders/page.tsx`
2. `src/app/customer/login/CustomerLoginClient.tsx`
3. `src/context/CustomerAuthContext.tsx`
4. `src/lib/supabase.ts` (if needed to improve security / separation)

Specific Tasks:
1. **Secure Database Querying (Finding 1)**:
   In `src/app/customer/orders/page.tsx`, modify `fetchOrders` so it NEVER performs a broad `.select("*")` query without filters. Add a server-side filter `.or(customerPhone.eq.${phoneNum},customerPhone.eq.${cleaned})` or `.eq("customerPhone", phone)` to query only relevant orders from the database.
2. **Exact Phone Matching (Finding 2)**:
   Ensure that the final client-side filter (if any, as a safety check) does an exact string match (e.g. `orderPhone === cleaned`) instead of `.includes()`.
3. **Resolve useEffect Lint Error (Finding 3)**:
   Wrap `fetchOrders` in `useCallback` and list it in the dependency array of the `useEffect` hook to prevent compilation warnings.
4. **Fix JSX Unescaped Entities (Finding 4)**:
   Replace raw quotes/apostrophes (like `'` or `"`) in `CustomerLoginClient.tsx` and `page.tsx` (orders page) with proper HTML entities (e.g. `&apos;` or `&quot;`) or wrap them in braces (e.g. `{"'"}`).
5. **Clean ESLint Violations**:
   Ensure all TS types are defined correctly (avoid `any` where possible, or use proper lint overrides/specific types) to get a 100% clean `npm run build` and `npx eslint` verification.
6. **Verify Build**:
   Run `npm run build` to confirm there are no typescript or compilation errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your implementation report to d:\Gopal Cake Shop\.agents\teamwork_preview_worker_m1_m2_remediation\handoff.md and send a message when complete.
