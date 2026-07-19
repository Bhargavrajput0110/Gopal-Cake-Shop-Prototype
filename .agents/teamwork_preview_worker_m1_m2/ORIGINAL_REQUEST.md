## 2026-07-05T09:10:20Z

You are teamwork_preview_worker. Your working directory is d:\Gopal Cake Shop\.agents\teamwork_preview_worker_m1_m2.

Your objective is to implement Milestone 1: Customer Authentication and Milestone 2: Order History Page.

Scope Boundaries:
- Implement client-side customer authentication via Supabase Auth. Do not alter staff credentials next-auth configuration.
- Do not hardcode any test results or create dummy/facade logins.
- Apply clean UI practices matching the look and feel of the site (theme-public).

Input Information:
- Supabase is initialized in `src/lib/supabase.ts`.
- Public layouts and wrappers are in `src/app/layout.tsx` and `src/components/layout/HeaderFooterWrapper.tsx`.
- The main navigation is in `src/components/layout/Navbar.tsx`.

Output Requirements:
1. Create `src/context/CustomerAuthContext.tsx` to manage and expose user session, login, signup, and logout. Wrap it in `src/app/layout.tsx`.
2. Create `/customer/login` page: `src/app/customer/login/page.tsx` and `src/app/customer/login/CustomerLoginClient.tsx` supporting:
   - Email/password Sign Up (which captures Name and Phone Number, saving to Supabase auth user metadata using `options: { data: { name, phone } }`).
   - Email/password Log In.
   - OTP / Magic Link login using `signInWithOtp`.
3. Create callback handler at `src/app/customer/auth/callback/page.tsx` for Magic Link redirect.
4. Create secure `/customer/orders` page at `src/app/customer/orders/page.tsx` that fetches orders from the Supabase database matching the logged-in customer's phone number. Protect this page so that unauthenticated users are redirected to `/customer/login`.
5. Update `src/components/layout/Navbar.tsx` to show "Order History" and "Logout" when a customer is logged in, and "Login" link (pointing to `/customer/login`) when they are not.
6. Verify your implementation by running a production build (`npm run build`) and ensuring it builds successfully.

Verification:
- The app compiles and builds successfully.
- Customer signup, password login, and Magic Link flow work via Supabase Auth.
- Customer order history fetches database records from the `orders` table matching the logged-in user's phone number.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your implementation report to d:\Gopal Cake Shop\.agents\teamwork_preview_worker_m1_m2\handoff.md and send a message when complete.
