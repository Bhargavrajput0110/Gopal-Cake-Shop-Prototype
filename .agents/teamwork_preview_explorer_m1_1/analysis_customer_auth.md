# Milestone 1: Customer Authentication - Design & Implementation Strategy

This document provides a comprehensive analysis and implementation strategy for introducing Customer Authentication to the Gopal Cake Shop platform using client-side Supabase Auth.

---

## 1. Supabase Client Initialization

Supabase is initialized in `src/lib/supabase.ts`. The file exports two clients:
- **`supabase`**: The default client for browser/client-side usage. This client respects Row-Level Security (RLS) policies.
- **`supabaseAdmin`**: The service role client, which bypasses RLS and is used exclusively on the server side (API routes).

### Code Reference (`src/lib/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

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

For customer authentication in `CustomerLoginClient.tsx`, we will import and use the browser-safe client:
```typescript
import { supabase } from "@/lib/supabase";
```

---

## 2. Current Staff Authentication Setup

Staff members (Admins, Chefs, Sales, Managers, Drivers) log in using a 4-digit PIN code via NextAuth.js. 

### Key Components:
1. **NextAuth Handler (`src/auth.ts`)**:
   Uses a custom `CredentialsProvider` named `"PIN"`. It queries the `users` table in Supabase via `supabaseAdmin` to match the selected employee code/ID with their PIN.
2. **NextAuth Configuration (`src/auth.config.ts`)**:
   Defines the session strategy (`jwt`), expiration (30 days), and callbacks to map user fields (`id`, `role`, `branchId`) from JWT tokens to the NextAuth session object.
3. **Middleware Protection (`src/middleware.ts`)**:
   Protects route segments starting with `/admin`, `/manager`, `/chef`, and `/sales`. If an unauthenticated user requests these paths, they are redirected to `/login` (the staff portal).
4. **Staff Login Page (`src/app/login/page.tsx` & `LoginClient.tsx`)**:
   A step-based login page allowing the user to select their role, branch, name, and input a 4-digit PIN.

---

## 3. Middleware, Layout, & Next-Auth Integration Check

To ensure that customer authentication functions independently of staff authentication, we evaluated the layout, middleware, and Next-Auth dependencies:

### A. Next-Auth Middleware (`src/middleware.ts`)
- **Interference**: **None**.
- **Analysis**: The middleware restricts access to `protectedRoutes = ["/admin", "/manager", "/chef", "/sales"]` and intercepts the auth route `/login`.
- **Behavior**: `/customer/*` routes are not in the protected list, and `/customer/login` is distinct from `/login`. Therefore, the Next-Auth middleware will ignore customer routes and allow requests to pass through without redirects.
- **Cookies**: Next-Auth cookies (`next-auth.session-token`) do not conflict with Supabase cookies (`sb-*-auth-token`).

### B. Global Layout Wrapper (`src/components/layout/HeaderFooterWrapper.tsx`)
- **Interference**: **Minor UI consideration**.
- **Analysis**: The `HeaderFooterWrapper` displays the shop header and footer globally unless the route is matched in `isStandaloneApp`.
- **Behavior**: By default, `/customer/login` is NOT in the `isStandaloneApp` list. This means the standard shop Navbar, Cart Drawer, and Footer will display.
- **Recommendation**: This is desirable because it maintains the customer storefront context (allowing customers to navigate back to the menu or cart). However, if a clean, full-screen login card is preferred (like the staff page), we should add `pathname?.startsWith("/customer/login")` to `isStandaloneApp`.

### C. Navbar Redirection (`src/components/layout/Navbar.tsx`)
- **Interference**: **Defect in current layout**.
- **Analysis**: Both the desktop header user button (line 76) and mobile bottom nav user button (line 113) point to `/login` (the internal staff portal).
- **Recommendation**: Modify `Navbar.tsx` so the user buttons point to `/customer/login` instead of `/login`. Additionally, they should ideally check if a Supabase user is logged in and link to `/customer/profile` (or show a profile dropdown) if authenticated.

---

## 4. Proposed UI Design & Implementation Plan

We propose a unified, responsive login/signup interface styled to match Gopal Cake Shop's branding:
- **Typography**: `font-sans` (Inter) and `font-heading` (Cormorant Garamond).
- **Color Scheme**: Warm cream (`bg-[#FDFBF7]`), rich dark brown (`#2C1A14`), and soft gold (`#D4AF37`).
- **Layout**: Centered card with glassmorphism effects (`bg-white/80 backdrop-blur-2xl border-white/50`).

### Features:
1. **Log In Tab**: Email & Password inputs.
2. **Sign Up Tab**: Full Name, Phone Number, Email, and Password inputs. During signup, full name and phone number are saved into the Supabase user metadata. It will also trigger a POST call to `/api/customers` to upsert the profile in the CRM database.
3. **Magic Link / OTP Options**: An option to log in passwordless by requesting a magic link.
4. **Auth Callback Route**: Exposes a path to exchange temporary OTP codes/tokens for standard sessions.

---

## 5. Code Templates

### A. Customer Login Page (`src/app/customer/login/page.tsx`)
```typescript
import { Metadata } from "next";
import CustomerLoginClient from "./CustomerLoginClient";

export const metadata: Metadata = {
  title: "Customer Login & Sign Up | Gopal Cake Shop",
  description: "Log in or create a customer account to place and track cake orders.",
};

export default function CustomerLoginPage() {
  return <CustomerLoginClient />;
}
```

### B. Customer Login Client Component (`src/app/customer/login/CustomerLoginClient.tsx`)
```typescript
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Phone, User, KeyRound, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthMode = "login" | "signup" | "magic-link";

export default function CustomerLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Auto-CRM ID generator matching internal ERP format
  const generateCustomerId = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return `CUST-${digits.slice(-8)}`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push(callbackUrl);
        router.refresh();
      } else if (mode === "signup") {
        if (!fullName || !phoneNumber) {
          throw new Error("Full name and Phone number are required.");
        }

        // 1. Sign up user via Supabase Auth (metadata stored under options.data)
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phoneNumber,
            },
          },
        });
        if (signUpError) throw signUpError;

        // 2. Sync to the public 'customers' database table
        const customerId = generateCustomerId(phoneNumber);
        const syncResponse = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: customerId,
            name: fullName,
            phone: phoneNumber,
          }),
        });

        if (!syncResponse.ok) {
          console.error("Failed to sync customer profile to database");
        }

        if (data.session) {
          // Immediately logged in
          router.push(callbackUrl);
          router.refresh();
        } else {
          setMessage("Verification email sent! Please check your inbox.");
        }
      } else if (mode === "magic-link") {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/customer/auth/callback`,
          },
        });
        if (otpError) throw otpError;
        setMessage("Magic login link sent! Please check your email.");
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#2C1A14]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[2rem] p-8 relative z-10">
        <div className="text-center mb-8">
          <span className="font-heading text-2xl md:text-3xl font-black tracking-tight text-[#2C1A14]">
            GOPAL <span className="text-[#D4AF37] font-light italic">Cakes</span>
          </span>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2">
            {mode === "login" && "Customer Portal Log In"}
            {mode === "signup" && "Create Customer Account"}
            {mode === "magic-link" && "Passwordless Sign In"}
          </p>
        </div>

        {/* Tab Selection */}
        {mode !== "magic-link" && (
          <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); setMessage(""); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                mode === "login" ? "bg-white text-[#2C1A14] shadow-sm" : "text-[#2C1A14]/60 hover:text-[#2C1A14]"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                mode === "signup" ? "bg-white text-[#2C1A14] shadow-sm" : "text-[#2C1A14]/60 hover:text-[#2C1A14]"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Sign Up Fields */}
          {mode === "signup" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#2C1A14]/70">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#2C1A14]/15 bg-white/50 text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#2C1A14]/70">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#2C1A14]/15 bg-white/50 text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Field (All modes) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#2C1A14]/70">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#2C1A14]/15 bg-white/50 text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
            </div>
          </div>

          {/* Password Field (Only Password Login & Signup) */}
          {mode !== "magic-link" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#2C1A14]/70">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#2C1A14]/15 bg-white/50 text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>
            </div>
          )}

          {/* Alerts */}
          {error && <p className="text-rose-500 text-xs font-semibold text-center mt-2">{error}</p>}
          {message && <p className="text-emerald-600 text-xs font-semibold text-center mt-2">{message}</p>}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-4 bg-[#2C1A14] text-white hover:bg-[#D4AF37] hover:text-[#2C1A14] hover:shadow-lg transition-all duration-300 font-bold uppercase tracking-widest text-xs rounded-xl disabled:opacity-50"
          >
            {isLoading ? "Processing..." : mode === "login" ? "Log In" : mode === "signup" ? "Create Account" : "Send Magic Link"}
          </Button>
        </form>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-[#2C1A14]/5 text-center space-y-2">
          {mode === "login" && (
            <button
              onClick={() => { setMode("magic-link"); setError(""); setMessage(""); }}
              className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" /> Log in via Magic Link / OTP
            </button>
          )}
          {mode === "magic-link" && (
            <button
              onClick={() => { setMode("login"); setError(""); setMessage(""); }}
              className="text-xs font-bold text-[#2C1A14]/60 hover:text-[#2C1A14] hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <KeyRound className="w-3.5 h-3.5" /> Back to Password Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### C. Client-side Auth Callback (`src/app/customer/auth/callback/page.tsx`)
```typescript
"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function CustomerAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // The client-side Supabase client automatically handles PKCE code verification on mount.
    // We check for a session and redirect the user back to storefront.
    const verifyAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      } else {
        router.push("/customer/login?error=Verification failed. Please try logging in again.");
      }
    };

    verifyAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-heading text-lg italic text-[#2C1A14]">Authenticating your session...</p>
      </div>
    </div>
  );
}
```

---

## 6. Recommendations & Code Layout

We recommend the following exact files to create and modify:

### Files to Create:
1. **`src/app/customer/login/page.tsx`**:
   Serves as the server-side entry point for the customer login route. Defines appropriate metadata.
2. **`src/app/customer/login/CustomerLoginClient.tsx`**:
   The interactive customer authentication form client component. Contains Supabase integration for Email/Password Signup & Log In, OTP/Magic Link, and updates user metadata + syncs to public database `customers` table.
3. **`src/app/customer/auth/callback/page.tsx`**:
   A simple router callback handler to finalize auth sessions (like email OTP verification & Magic Links) entirely on the client side.

### Files to Modify:
1. **`src/components/layout/Navbar.tsx`**:
   Update both Desktop and Mobile user navigation links (lines 76 and 113) to point to `/customer/login` instead of the internal staff `/login` route.
   - *Desktop navbar block*:
     ```typescript
     // Change this:
     <Link href="/login" className="hidden md:block">
     // To this:
     <Link href="/customer/login" className="hidden md:block">
     ```
   - *Mobile bottom navbar block*:
     ```typescript
     // Change this:
     <Link href="/login" className="flex flex-col items-center justify-center w-full h-full text-[#2C1A14]/70 hover:text-[#D4AF37] transition-colors">
     // To this:
     <Link href="/customer/login" className="flex flex-col items-center justify-center w-full h-full text-[#2C1A14]/70 hover:text-[#D4AF37] transition-colors">
     ```
2. **`src/components/layout/HeaderFooterWrapper.tsx`**:
   *(Optional design recommendation)* Add `/customer/login` to `isStandaloneApp` if a clean, full-screen portal login is preferred over showing the standard storefront navbar/footer:
   ```typescript
   const isStandaloneApp = pathname?.startsWith("/chef") || 
                           pathname?.startsWith("/delivery") || 
                           pathname?.startsWith("/admin") || 
                           pathname?.startsWith("/sales") || 
                           pathname?.startsWith("/manager") || 
                           pathname?.startsWith("/vendor") || 
                           pathname?.startsWith("/customer/login") || // Optional: hides global header/footer
                           pathname?.startsWith("/login");
   ```
