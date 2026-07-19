# Customer Authentication Design & Implementation Strategy (Milestone 1)

## 1. Executive Summary
This analysis outlines the strategy for implementing client-side Customer Authentication using Supabase Auth in the Gopal Cake Shop application. It covers client-side initialization, existing staff authentication comparison, middleware compatibility, layout styling, and recommended code structures. Key findings show that customer authentication using Supabase is completely separate from the staff portal’s Next-Auth session, and the two systems will run side-by-side without interference.

---

## 2. Current Authentication Setup & Supabase Initialization

### 2.1 Client-Side Supabase Initialization
Supabase is initialized in `src/lib/supabase.ts`. It exports two key client instances:
*   **`supabase`**: An instance of `@supabase/supabase-js` created using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. This is intended for client-side/browser usage and is subject to Postgres Row-Level Security (RLS) rules.
*   **`supabaseAdmin`**: An instance created using the `SUPABASE_SERVICE_ROLE_KEY` (if available), designed for server-side API endpoints, which bypasses RLS rules.

### 2.2 Staff Authentication (Next-Auth)
Staff authentication is currently managed via **Next-Auth (Auth.js v5)** in:
*   `src/auth.ts`
*   `src/auth.config.ts`
*   `src/middleware.ts`

It implements a `CredentialsProvider` that prompts for a numeric PIN and user ID, queries the staff `users` table via `supabaseAdmin`, verifies the PIN, and returns a session containing the staff member's role and branch ID.

### 2.3 Middleware & Authentication Routing
The Next-Auth middleware in `src/middleware.ts` runs on all routes except static assets, checking the user’s staff login state. However, it is scoped specifically to:
1.  Redirecting staff away from `/login` if they are already logged in.
2.  Protecting routes starting with `/admin`, `/manager`, `/chef`, or `/sales` and redirecting unauthenticated users to `/login`.

Because the customer routes (`/customer/*`) are not marked as protected routes in the middleware, **Next-Auth will not block or redirect customer traffic**, allowing client-side Supabase Auth to operate independently on `/customer/*` routes.

---

## 3. Layout Dependencies & UI Theme Integration

### 3.1 Layout Wrapper (`HeaderFooterWrapper.tsx`)
The global `HeaderFooterWrapper` conditionally hides the main public Navbar and Footer on dedicated internal apps (e.g., `/admin`, `/chef`, `/sales`, `/login`). 
*   Because `/customer/login` does not start with any of the hidden paths, it will **render with the global public Navbar, Footer, and Cart Drawer**.
*   This is the desired behavior, as customers should maintain navigation access to the store while logging in or signing up.

### 3.2 Visual Theme Consistency
The customer-facing website uses the `.theme-public` CSS class to set variables for the soft cream/pink/brown color palette (defined in `src/app/globals.css`). 
*   **Recommendation**: Wrap the customer login container in the class `theme-public` to apply the public color scheme.
*   **Styling**: Use a premium glassmorphic login card styled with `bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-3xl p-8` to align with the homepage's high-end aesthetic.

---

## 4. Proposed UI Design & User Flow
We propose a single, mobile-optimized page at `/customer/login` that contains a three-tab toggle interface:

1.  **Tab 1: Log In (Email/Password)**
    *   *Fields*: Email (input), Password (input).
    *   *Action*: Logs the customer in.
2.  **Tab 2: Sign Up (Create Account)**
    *   *Fields*: Full Name (input), Email (input), Phone Number (input), Password (input).
    *   *Action*: Creates a new user in Supabase, saving the name and phone number in Supabase user metadata.
3.  **Tab 3: Passwordless OTP / Magic Link**
    *   *Fields*: Email (input).
    *   *Action*: Sends a 6-digit OTP code / Magic Link to the email address. Upon sending, a second step is shown to input the code.

### Navigation Interlinks
*   Add a link at the bottom of `/customer/login` saying: *"Are you a staff member? Access the Staff Portal"* pointing to `/login`.
*   Conversely, add a link on `/login` saying: *"Are you a customer? Back to shop"* pointing to `/customer/login`.

---

## 5. Client-Side Supabase Auth Integration Plan

### 5.1 Email/Password Sign Up
Call `supabase.auth.signUp` passing the customer's name and phone number into the user metadata via `options.data`:
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      phone: phone,
    },
  },
});
```

### 5.2 Email/Password Log In
Authenticate using `supabase.auth.signInWithPassword`:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

### 5.3 OTP / Magic Link Authentication
Send the OTP token/Magic Link using `supabase.auth.signInWithOtp`:
```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/customer/auth/callback`,
  },
});
```
If the customer wants to verify the code immediately on the screen, display a code verification input and call:
```typescript
const { data, error } = await supabase.auth.verifyOtp({
  email,
  token: otpCode,
  type: 'email',
});
```

### 5.4 State Management
Create a client-side hook or event listener on load to monitor the authentication state:
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // Set user session in context/state and redirect
      window.location.href = "/";
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

---

## 6. Recommended Code Layout & Files

We recommend creating/modifying the following files (without making direct changes to the codebase):

### 📄 `src/app/customer/login/page.tsx` (Create)
This client-side page will render the login interface.

```tsx
import { Metadata } from "next";
import CustomerLoginClient from "./CustomerLoginClient";

export const metadata: Metadata = {
  title: "Customer Login | Gopal Cake Shop",
  description: "Log in or sign up to track and manage your orders",
};

export default function CustomerLoginPage() {
  return <CustomerLoginClient />;
}
```

### 📄 `src/app/customer/login/CustomerLoginClient.tsx` (Create)
A Client Component that implements the UI tabs, forms, and handles communication with `supabase.auth`.

*Key components and elements:*
*   Uses `useClient` directive.
*   Integrates `framer-motion` for smooth tab transitions.
*   Uses standard Lucide icons (`Mail`, `Lock`, `User`, `Phone`, `Key`, `ArrowRight`).
*   State variables for `activeTab` ("login" | "signup" | "otp"), form fields (`email`, `password`, `fullName`, `phone`, `otpCode`, `isOtpSent`), and status indicators (`loading`, `error`, `success`).
*   Verification logic using `@supabase/supabase-js`.

### 📄 `src/app/customer/auth/callback/route.ts` or `/page.tsx` (Create)
A callback route/page to capture code-exchange query parameters for customers clicking a Magic Link.

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center theme-public">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground font-semibold">Completing authentication...</p>
      </div>
    </div>
  );
}
```

### 📄 `src/components/layout/Navbar.tsx` (Modify)
Change the user profile/account button link from `/login` (staff login) to the new customer login route.
*   **Before**:
    ```tsx
    <Link href="/login" className="hidden md:block">
      <Button variant="ghost" size="icon" ...>
        <User className="h-4 w-4" />
      </Button>
    </Link>
    ```
*   **After**:
    ```tsx
    <Link href="/customer/login" className="hidden md:block">
      <Button variant="ghost" size="icon" ...>
        <User className="h-4 w-4" />
      </Button>
    </Link>
    ```
*   *(Note: Apply the same change to the mobile navigation link at the bottom)*

### 📄 `src/app/login/LoginClient.tsx` (Modify)
Add a helper link to navigate to the customer login.
*   **Add link**:
    ```tsx
    <div className="text-center mt-6">
      <Link href="/customer/login" className="text-sm font-bold text-primary hover:underline">
        Are you a customer? Login here
      </Link>
    </div>
    ```
