"use client";

import { useState } from "react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useRouter } from "next/navigation";
import { Lock1, Sms, User, Call, ArrowRight, MagicStar, TickCircle, Danger } from "iconsax-react";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "login" | "signup" | "magic-link";

export default function CustomerLoginClient() {
  const { login, signUp, signInWithOtp } = useCustomerAuth();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    clearMessages();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const { data, error } = await login(email, password);
      if (error) {
        setError(error.message);
      } else if (data?.user) {
        setSuccess("Logged in successfully! Redirecting...");
        setTimeout(() => {
          router.push("/customer/orders");
          router.refresh();
        }, 1500);
      } else {
        setError("Unable to authenticate. Please check your credentials.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during login.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !phone) {
      setError("Please fill out all fields.");
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const { data, error } = await signUp(email, password, name, phone);
      if (error) {
        setError(error.message);
      } else if (data?.user) {
        const identities = data.user.identities || [];
        if (identities.length === 0) {
          setSuccess("Account already exists or email is taken. Please log in.");
        } else {
          setSuccess("Account created! Check your email to confirm your account and log in.");
          setEmail("");
          setPassword("");
          setName("");
          setPhone("");
        }
      } else {
        setError("Sign up failed. Please try again.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during registration.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const { error } = await signInWithOtp(email);
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Magic Link sent! Please check your email inbox to sign in.");
        setEmail("");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred sending Magic Link.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 pt-24 pb-16 relative overflow-hidden">
      
      {/* Premium Minimal Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-6">
            <MagicStar className="w-5 h-5 text-primary" />
          </div>

          <h1 className="font-serif text-4xl font-bold text-foreground leading-[1.1]">
            {mode === "login" && "Welcome Back"}
            {mode === "signup" && "Join the Family"}
            {mode === "magic-link" && "Magic Sign In"}
          </h1>
          <p className="font-serif italic text-foreground/60 text-lg mt-3">
            {mode === "login" && "Sign in to manage your artisanal orders"}
            {mode === "signup" && "Create an account to start your journey"}
            {mode === "magic-link" && "We'll email you a passwordless login link"}
          </p>
        </div>

        {/* Status Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-700 text-sm font-medium">
                <Danger className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 text-emerald-700 text-sm font-medium">
                <TickCircle className="w-5 h-5 shrink-0" />
                <span>{success}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignUp : handleMagicLink} className="space-y-6">
          
          {mode === "signup" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Full Name</label>
                <div className="relative">
                  <User className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                  <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} required
                    className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-3 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/30" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Phone Number</label>
                <div className="relative">
                  <Call className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                  <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading} required
                    className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-3 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/30" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Email Address</label>
            <div className="relative">
              <Sms className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} required
                className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-3 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/30" />
            </div>
          </div>

          {mode !== "magic-link" && (
            <div className="space-y-1">
              <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Password</label>
              <div className="relative">
                <Lock1 className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} required
                  className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-3 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/30" />
              </div>
            </div>
          )}

          <div className="pt-4">
            <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest py-4 px-10 rounded-full shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100">
              {isLoading ? "Please wait..." : (
                <>
                  {mode === "login" && "Log In"}
                  {mode === "signup" && "Create Account"}
                  {mode === "magic-link" && "Send Magic Link"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Tab Navigation/Toggles */}
        <div className="mt-10 pt-8 border-t border-border/40 flex flex-col gap-4 text-center">
          {mode === "login" ? (
            <>
              <div className="font-serif italic text-foreground/70 text-sm">
                Don't have an account?{" "}
                <button onClick={() => handleModeChange("signup")} className="text-secondary hover:text-primary font-bold not-italic font-sans text-[10px] uppercase tracking-widest transition-colors ml-2">Create one</button>
              </div>
              <div className="font-serif italic text-foreground/70 text-sm">
                Want to sign in passwordless?{" "}
                <button onClick={() => handleModeChange("magic-link")} className="text-secondary hover:text-primary font-bold not-italic font-sans text-[10px] uppercase tracking-widest transition-colors ml-2">Use Magic Link</button>
              </div>
            </>
          ) : mode === "signup" ? (
            <div className="font-serif italic text-foreground/70 text-sm">
              Already have an account?{" "}
              <button onClick={() => handleModeChange("login")} className="text-secondary hover:text-primary font-bold not-italic font-sans text-[10px] uppercase tracking-widest transition-colors ml-2">Log In</button>
            </div>
          ) : (
            <>
              <div className="font-serif italic text-foreground/70 text-sm">
                Remember your password?{" "}
                <button onClick={() => handleModeChange("login")} className="text-secondary hover:text-primary font-bold not-italic font-sans text-[10px] uppercase tracking-widest transition-colors ml-2">Log In with Password</button>
              </div>
              <div className="font-serif italic text-foreground/70 text-sm">
                Don't have an account?{" "}
                <button onClick={() => handleModeChange("signup")} className="text-secondary hover:text-primary font-bold not-italic font-sans text-[10px] uppercase tracking-widest transition-colors ml-2">Sign Up</button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
