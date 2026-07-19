# Handoff Report - Customer Authentication Strategy (Milestone 1)

## 1. Observation
I investigated the codebase to evaluate customer authentication integration. Key observations:
1.  **Supabase Client Initialization**: In `src/lib/supabase.ts`, Supabase client is initialized on lines 15-23:
    ```typescript
    // Client for public/browser usage (subject to RLS)
    export const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client for server-side API routes (bypasses RLS)
    export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    ```
2.  **Staff Authentication**: Next-auth is set up in `src/auth.ts` (lines 6-45) using `CredentialsProvider` checking a `pin` against the `users` table via `supabaseAdmin`.
3.  **Middleware Execution**: In `src/middleware.ts` (lines 5-56), Next-Auth restricts routes matching `["/admin", "/manager", "/chef", "/sales"]` to authenticated staff members. Customer paths (such as `/customer/*`) are not protected by this middleware.
4.  **Layout Conditionals**: In `src/components/layout/HeaderFooterWrapper.tsx` (lines 12-18), the global Navbar and Footer are hidden only for specific paths:
    ```typescript
    const isStandaloneApp = pathname?.startsWith("/chef") || 
                            pathname?.startsWith("/delivery") || 
                            pathname?.startsWith("/admin") || 
                            pathname?.startsWith("/sales") || 
                            pathname?.startsWith("/manager") || 
                            pathname?.startsWith("/vendor") || 
                            pathname?.startsWith("/login");
    ```
    This does not match `/customer/login`, which ensures the public headers/footers will remain visible.
5.  **Themes**: In `src/app/globals.css` (lines 120-139), a public customer theme class `.theme-public` defines pink/brownish variables (e.g., `--primary: #B67A7E`, `--background: #FFFFFF`).
6.  **Navbar Login Link**: In `src/components/layout/Navbar.tsx` (lines 76-81 and 113-116), the profile/login buttons route directly to `/login`.

---

## 2. Logic Chain
1.  **Requirement**: Customer authentication must support Email/Password (Login & Sign Up) and OTP/Magic Link, capturing metadata (full name and phone number) during Sign Up, and running on `/customer/login/page.tsx` client-side.
2.  **Auth Architecture Separation**: Since Next-Auth session checks are restricted to staff-only routes (`/admin`, `/manager`, etc.) per Observation 3, client-side Supabase authentication state can be managed independently for customer routes.
3.  **Client Integration**: We can import `supabase` from `src/lib/supabase.ts` (Observation 1) and invoke:
    *   `supabase.auth.signUp` with `options.data` containing `full_name` and `phone` to fulfill customer metadata storage.
    *   `supabase.auth.signInWithPassword` for email/password login.
    *   `supabase.auth.signInWithOtp` and `supabase.auth.verifyOtp` for OTP login.
4.  **UI Theme**: Since the public site uses `.theme-public` style variables (Observation 5) and the homepage mounts with `.theme-public` (Observation 6), wrapping the customer login card in a `.theme-public` container will render it with the public rose/cream theme instead of the gold/brown staff dashboard theme.
5.  **Layout Persistence**: Because `/customer/login` does not hide the headers/footers per Observation 4, the public navbar and footer will persist automatically.
6.  **Navbar Changes**: Because the current navbar redirects to `/login` (Observation 6), we must update the link to `/customer/login` for customers, and add cross-links between `/login` and `/customer/login` for convenience.

---

## 3. Caveats
*   **Post-Sign Up Database Triggers**: This proposal assume that if customer rows need to be synced from `auth.users` to the public `customers` table in the database, a Supabase DB trigger or a Webhook handles it on the server-side, or we will write an API route to handle it.
*   **Redirect Callback Route**: We assume that Magic Links require a handler at `/customer/auth/callback` to handle token exchange and session setup.
*   **Verification without backend**: Since we are in a read-only investigation role, we did not execute actual sign up/login calls against a live Supabase server.

---

## 4. Conclusion
We can safely implement customer authentication using client-side Supabase Auth at `/src/app/customer/login/page.tsx`. It will not interfere with the existing Next-Auth configuration or middleware. The design should utilize a glassmorphism style card wrapped in the `.theme-public` class, supporting Email/Password tabs, Sign Up metadata passing, and Email OTP verification.

---

## 5. Verification Method
1.  **File Inspections**: Inspect the created files (`src/app/customer/login/page.tsx`, `src/app/customer/login/CustomerLoginClient.tsx`, and `src/app/customer/auth/callback/page.tsx`).
2.  **Linting**: Run the Next.js lint command:
    ```bash
    npm run lint
    ```
3.  **Build Verification**: Run the build command to ensure TypeScript compiles correctly:
    ```bash
    npm run build
    ```
