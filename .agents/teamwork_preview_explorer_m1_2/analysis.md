# Analysis & Recommendation: Customer Authentication Integration (Milestone 1)

This report details the architectural analysis, proposed UI design, and client-side implementation strategy for integrating Supabase Customer Authentication into Gopal Cake Shop storefront.

---

## 1. Supabase Initialization (`src/lib/supabase.ts`)
The client-side Supabase client is already initialized in `src/lib/supabase.ts`. 

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

- **Client usage**: We will import the public `supabase` client for client-side authentication.
- **Service role**: `supabaseAdmin` is strictly server-side and will continue to be used in API routes and Next-Auth.

---

## 2. Current Authentication Setup & Interference Analysis
Currently, Gopal Cake Shop uses **Next-Auth v5 (Auth.js)** for staff authentication (Admin, Sales, Chef, Delivery, Manager).

### Next-Auth Structure:
- `src/auth.config.ts` defines JWT callbacks, session configuration, and the staff `/login` page redirect.
- `src/auth.ts` configures a `CredentialsProvider` that accepts User ID and PIN and verifies them against the `users` table via `supabaseAdmin`.
- `src/middleware.ts` runs on all routes (except static files, favicon, etc.). It restricts staff routes based on the Next-Auth session:
  - Protected paths: `/admin`, `/manager`, `/chef`, `/sales`.
  - Auth path: `/login` (staff login).

### Interference Assessment:
- **No Route Conflict**: The customer authentication routes (e.g., `/customer/login`, `/customer/auth/callback`) do NOT start with `/login` or the protected prefixes `/admin`, `/manager`, `/chef`, `/sales`. Therefore, the Next-Auth middleware will let customer requests pass through unhindered.
- **Separate Session Storages**: Next-Auth stores its session in cookies (encrypted JWT). Client-side Supabase Auth stores its session in `localStorage` under `sb-[project-ref]-auth-token` (managed automatically by `@supabase/supabase-js`). They operate in parallel without state collision.
- **Layout Adjustments**:
  - The root layout `src/app/layout.tsx` uses `HeaderFooterWrapper` to dynamically show/hide the global `Navbar` and `Footer`.
  - Currently, `HeaderFooterWrapper` hides them for paths starting with `/chef`, `/delivery`, `/admin`, `/sales`, `/manager`, `/vendor`, and `/login`.
  - For `/customer/login`, we have two design options:
    1. **E-Commerce Integrated (Recommended)**: Keep the storefront `Navbar` and `Footer` visible so that customers can easily navigate back to the product catalog.
    2. **Clean Standalone Card**: Add `/customer/login` to `isStandaloneApp` in `src/components/layout/HeaderFooterWrapper.tsx` to render a clean, full-screen login card similar to the staff login.

---

## 3. Recommended Code Layout & Files

We recommend creating/modifying the following files:

### A. New Files to Create:
1. `src/context/CustomerAuthContext.tsx`
   - Exposes client-side Supabase Auth session, user, loading status, and `signOut` helper via a React Context.
2. `src/app/customer/login/page.tsx`
   - Server page component setting metadata (e.g. `Customer Authentication | Gopal Cakes`).
3. `src/app/customer/login/CustomerLoginClient.tsx`
   - Client component containing the interactive login, signup, and OTP forms.
4. `src/app/customer/auth/callback/page.tsx`
   - Client callback component for Magic Link handling.

### B. Existing Files to Modify:
1. `src/app/layout.tsx`
   - Wrap the children in the new `CustomerAuthProvider`.
2. `src/components/layout/Navbar.tsx`
   - Check customer session status and display user profile actions or name initials.
3. `src/components/layout/HeaderFooterWrapper.tsx`
   - Ensure the layout wrapper correctly handles storefront headers/footers for `/customer` subroutes.

---

## 4. Database Sync Design (Syncing Supabase Auth to Prisma User table)
In `prisma/schema.prisma`, customer orders are linked to the `User` model (`customerId` foreign key). 
Since Supabase Auth creates users in the private `auth.users` schema, we must sync them to the public `User` table with `role: CUSTOMER` so that orders can be placed.

### Database Trigger Sync Method (Recommended)
Add a PostgreSQL trigger on the database that fires whenever a user is inserted in `auth.users`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (id, name, email, phone, role, password, "createdAt", "updatedAt")
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Customer'),
    new.email,
    new.raw_user_meta_data->>'phone',
    'CUSTOMER',
    '', -- Empty password since they authenticate via Supabase Auth
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_customer_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer();
```

---

## 5. Proposed Code Implementations

### A. `src/context/CustomerAuthContext.tsx`
```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface CustomerAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <CustomerAuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}
```

### B. `src/app/customer/login/page.tsx`
```typescript
import { Metadata } from "next";
import CustomerLoginClient from "./CustomerLoginClient";

export const metadata: Metadata = {
  title: "Customer Authentication | Gopal Cakes",
  description: "Sign in or create an account to track and manage your gourmet orders.",
};

export default function CustomerLoginPage() {
  return <CustomerLoginClient />;
}
```

### C. `src/app/customer/auth/callback/page.tsx`
```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      } else {
        router.push("/customer/login?error=Session initialization failed");
      }
    };
    handleCallback();
  }, [router]);

  return (
    <div className="theme-public min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#B67A7E] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#3E2723]">Completing Sign In...</h2>
        <p className="text-sm text-[#795548] mt-1">Please wait while we set up your session.</p>
      </div>
    </div>
  );
}
```

### D. `src/app/customer/login/CustomerLoginClient.tsx`
This implementation integrates email/password auth, OTP, and user metadata storing.

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, User, Phone, KeyRound, ArrowRight, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "login" | "signup";
type Method = "password" | "otp";

export default function CustomerLoginClient() {
  const [mode, setMode] = useState<Mode>("login");
  const [method, setMethod] = useState<Method>("password");
  
  // Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpToken, setOtpToken] = useState("");
  
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        window.location.href = "/";
      } else {
        // Sign up with user metadata
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        });
        if (err) throw err;
        setMessage("Check your email for confirmation link!");
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/customer/auth/callback`,
        },
      });
      if (err) throw err;
      setOtpSent(true);
      setMessage("Verification code sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const { error: err } = await supabase.auth.verifyOtp({
        email,
        token: otpToken,
        type: "email",
      });
      if (err) throw err;
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-public min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Visual background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#B67A7E]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#EED6B9]/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-[#E8D3D6] shadow-2xl rounded-3xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-black tracking-tight text-[#3E2723]">
            GOPAL <span className="text-[#B67A7E] font-light italic">Cakes</span>
          </h1>
          <p className="text-[#795548] text-sm mt-2 font-medium">Customer Portal</p>
        </div>

        {/* Auth mode tabs */}
        {!otpSent && (
          <div className="flex border-b border-[#E8D3D6] mb-6">
            <button
              onClick={() => { setMode("login"); clearMessages(); }}
              className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                mode === "login" ? "text-[#B67A7E] border-b-2 border-[#B67A7E]" : "text-[#795548]/60"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); clearMessages(); setMethod("password"); }}
              className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                mode === "signup" ? "text-[#B67A7E] border-b-2 border-[#B67A7E]" : "text-[#795548]/60"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Method Toggles (Only for Sign In) */}
        {mode === "login" && !otpSent && (
          <div className="grid grid-cols-2 gap-2 bg-[#F6DDE1]/40 p-1 rounded-full mb-6">
            <button
              onClick={() => { setMethod("password"); clearMessages(); }}
              className={`py-1.5 text-xs font-bold rounded-full transition-all ${
                method === "password" ? "bg-white text-[#B67A7E] shadow-sm" : "text-[#795548]"
              }`}
            >
              Password
            </button>
            <button
              onClick={() => { setMethod("otp"); clearMessages(); }}
              className={`py-1.5 text-xs font-bold rounded-full transition-all ${
                method === "otp" ? "bg-white text-[#B67A7E] shadow-sm" : "text-[#795548]"
              }`}
            >
              OTP / Magic Link
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Display general notifications */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4 font-semibold"
            >
              {error}
            </motion.div>
          )}
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl p-3 mb-4 font-semibold flex items-start gap-2"
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </motion.div>
          )}

          {/* Form logic */}
          {otpSent ? (
            /* OTP Verification Step */
            <motion.form
              key="otp-verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#3E2723] uppercase mb-1">Enter Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795548]/50" />
                  <input
                    type="text"
                    required
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full pl-10 pr-4 py-3 bg-[#FDFBF7] border border-[#E8D3D6] rounded-xl text-[#3E2723] focus:border-[#B67A7E] focus:outline-none transition-colors font-bold text-center tracking-widest text-lg"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#B67A7E] hover:bg-[#B67A7E]/90 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Continue"}
              </Button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); clearMessages(); }}
                className="w-full text-center text-xs text-[#B67A7E] font-bold hover:underline"
              >
                Back to Sign In
              </button>
            </motion.form>
          ) : method === "otp" ? (
            /* OTP / Magic Link Request */
            <motion.form
              key="otp-request"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSendOtp}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#3E2723] uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795548]/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#FDFBF7] border border-[#E8D3D6] rounded-xl text-[#3E2723] focus:border-[#B67A7E] focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#B67A7E] hover:bg-[#B67A7E]/90 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Magic Link / Code"}
              </Button>
            </motion.form>
          ) : (
            /* Email & Password Authentication */
            <motion.form
              key={`${mode}-password`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handlePasswordAuth}
              className="space-y-4"
            >
              {mode === "signup" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#3E2723] uppercase mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795548]/50" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 bg-[#FDFBF7] border border-[#E8D3D6] rounded-xl text-[#3E2723] focus:border-[#B67A7E] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3E2723] uppercase mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795548]/50" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full pl-10 pr-4 py-3 bg-[#FDFBF7] border border-[#E8D3D6] rounded-xl text-[#3E2723] focus:border-[#B67A7E] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-[#3E2723] uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795548]/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#FDFBF7] border border-[#E8D3D6] rounded-xl text-[#3E2723] focus:border-[#B67A7E] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3E2723] uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795548]/50" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-[#FDFBF7] border border-[#E8D3D6] rounded-xl text-[#3E2723] focus:border-[#B67A7E] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#B67A7E] hover:bg-[#B67A7E]/90 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 shadow-lg" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Sign Up"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
```

---

## 6. Integration With Storefront Components

### A. Wrapping the Root Layout (`src/app/layout.tsx`)
```typescript
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CustomerAuthProvider>
          <CartProvider>
            <OrderProvider>
              <SmoothScroller>
                <HeaderFooterWrapper>{children}</HeaderFooterWrapper>
              </SmoothScroller>
            </OrderProvider>
          </CartProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
```

### B. Navbar Dynamic User Profile (`src/components/layout/Navbar.tsx`)
Update the `User` account icon behavior to check if a customer is authenticated:

```typescript
import { useCustomerAuth } from "@/context/CustomerAuthContext";

export function Navbar() {
  const { user, signOut } = useCustomerAuth();
  
  // Render details...
  
  return (
    // In Navbar JSX:
    // Replace the simple Link to "/login" with a dynamic check:
    {user ? (
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#2C1A14]">
          Hi, {user.user_metadata?.full_name || "Customer"}
        </span>
        <Button onClick={signOut} variant="ghost" className="text-xs text-[#B67A7E]">
          Logout
        </Button>
      </div>
    ) : (
      <Link href="/customer/login">
        <Button variant="ghost" size="icon" className="...">
          <User className="h-4 w-4" />
        </Button>
      </Link>
    )}
  );
}
```

