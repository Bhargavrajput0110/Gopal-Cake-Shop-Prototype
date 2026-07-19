# Handoff Report - Customer Authentication Integration (Milestone 1)

This handoff report summarizes the findings, reasoning, and implementation strategy for client-side Supabase Customer Authentication.

---

## 1. Observation
- **Supabase Client Initialization**: In `src/lib/supabase.ts` (lines 14-15), the public client is exported as:
  ```typescript
  // Client for public/browser usage (subject to RLS)
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
  ```
- **Next-Auth Route Protection**: In `src/middleware.ts` (lines 10-11 and 26-36), the protected paths for staff next-auth sessions are declared:
  ```typescript
  const protectedRoutes = ["/admin", "/manager", "/chef", "/sales"];
  const isProtectedRoute = protectedRoutes.some(route => nextUrl.pathname.startsWith(route));
  ```
  Routes starting with `/customer` or `/` are not in `protectedRoutes` and do not trigger staff redirection.
- **Storefront Theme Styling**: In `src/app/globals.css` (lines 120-139), the storefront color variables are specified under the class `.theme-public`:
  ```css
  .theme-public {
    --background: #FFFFFF;
    --foreground: #36292C;
    --primary: #B67A7E;
    --secondary: #EED6B9;
    --muted: #F6DDE1;
    --border: #E8D3D6;
    --ring: #B67A7E;
  }
  ```
- **Prisma User Schema**: In `prisma/schema.prisma` (lines 38-47), the `User` model defines customer identifiers and roles:
  ```prisma
  model User {
    id            String    @id @default(cuid())
    name          String
    email         String?   @unique
    phone         String?   @unique
    role          Role      @default(CUSTOMER)
  ```
- **Navbar/Footer Visibility**: In `src/components/layout/HeaderFooterWrapper.tsx` (lines 12-18), the global navbar and footer are hidden for standalone routes:
  ```typescript
  const isStandaloneApp = pathname?.startsWith("/chef") || 
                          pathname?.startsWith("/delivery") || 
                          pathname?.startsWith("/admin") || 
                          pathname?.startsWith("/sales") || 
                          pathname?.startsWith("/manager") || 
                          pathname?.startsWith("/vendor") || 
                          pathname?.startsWith("/login");
  ```

---

## 2. Logic Chain
1. Since the client-side `supabase` client is initialized in `src/lib/supabase.ts` using the public anonymous key, we can directly invoke client-side auth methods (such as `supabase.auth.signUp`, `supabase.auth.signInWithPassword`, `supabase.auth.signInWithOtp`, and `supabase.auth.verifyOtp`) on customer-facing pages.
2. Next-Auth middleware (`src/middleware.ts`) only protects routes starting with `/admin`, `/manager`, `/chef`, and `/sales`, and redirects unauthenticated users to `/login`. Because customer pages are located under `/customer/*` (such as `/customer/login`), they bypass Next-Auth checks entirely.
3. Client-side Supabase Auth stores credentials in browser `localStorage`, whereas Next-Auth uses secure session cookies. Since they write to different state keys, they can run in parallel without conflicts.
4. If a customer is logged in via Supabase, components (such as `Navbar.tsx`) need access to the session. Providing a `CustomerAuthContext` wrapped at the root layout allows all storefront components to dynamically query and react to the customer state.
5. In `prisma/schema.prisma`, order records link to `User.id` via `customerId`. When a customer registers via client-side Supabase Auth (`supabase.auth.signUp`), the user record is created in the private `auth.users` database schema. To maintain foreign key integrity, we need to insert a matching row with `role: CUSTOMER` in the public `User` table. A database trigger on the `auth.users` table is the most robust and automated way to accomplish this.

---

## 3. Caveats
- **Verification Email Routing**: Email signup requires verification by default in Supabase. If email confirmation is enabled, customers must click the link sent to their email to activate their accounts. During testing, this setting should either be disabled in the Supabase Dashboard (`Confirm email` toggle under Auth Providers) or test emails should be mocked/inspected.
- **Trigger Privileges**: Creating a database trigger on the `auth.users` schema requires database owner or superuser privileges. Ensure that the database user running migrations has adequate privileges to create triggers on `auth`.

---

## 4. Conclusion
- Customer authentication can be fully integrated client-side using Supabase Auth without interfering with the existing Next-Auth staff setup.
- We recommend creating the following files:
  1. `src/context/CustomerAuthContext.tsx` (Global session provider)
  2. `src/app/customer/login/page.tsx` (Login page layout/metadata)
  3. `src/app/customer/login/CustomerLoginClient.tsx` (Tabbed form component for password signup/login and OTP verification)
  4. `src/app/customer/auth/callback/page.tsx` (Session redirection callback for Magic Links)
- We recommend modifying `src/app/layout.tsx` to wrap pages in `CustomerAuthProvider`, and `src/components/layout/Navbar.tsx` to display dynamic greeting/logout controls for authenticated customers.

---

## 5. Verification Method
- **Routing Check**: Navigate to `/customer/login`. Verify that it renders the login form and does not trigger next-auth's login redirect to `/login`.
- **Database Trigger Check**: Create a test customer account via the Sign Up form. Run:
  ```sql
  SELECT * FROM public."User" WHERE role = 'CUSTOMER';
  ```
  Ensure a record exists with the exact UUID generated in `auth.users`.
- **Sign In Flows**:
  - Test Email/Password registration and login.
  - Test OTP/Magic Link request. Verify that the redirect lands on `/customer/auth/callback` and correctly establishes the session.
