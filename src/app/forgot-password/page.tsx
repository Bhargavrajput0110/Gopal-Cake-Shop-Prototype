"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sms, Lock1, Send2, TickCircle } from "iconsax-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    // Simulate API call for password reset link
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[2rem] p-8 md:p-12 relative z-10"
      >
        <Link href="/login" className="absolute top-8 left-8 p-2 bg-secondary rounded-full hover:bg-border transition-colors z-20 group">
          <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
        </Link>

        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-amber-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/30 mb-4 transform -rotate-3">
            <Lock1 className="w-8 h-8 text-white rotate-3" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Reset PIN</h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium">We'll send you instructions to reset it.</p>
        </div>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.form 
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Sms className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="manager@gopalcakeshop.com"
                    className="w-full pl-11 pr-4 py-4 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium text-foreground placeholder:text-muted-foreground/40 shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <>
                    <Send2 className="w-5 h-5" />
                    Send Reset Link
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 bg-emerald-50 rounded-2xl border border-emerald-100"
            >
              <TickCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-emerald-900 mb-2">Check Your Email</h2>
              <p className="text-emerald-700/80 text-sm px-6">
                If <strong>{email}</strong> is registered, you will receive a reset link shortly.
              </p>
              
              <div className="mt-8">
                <Link href="/login" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest">
                  Back to Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
