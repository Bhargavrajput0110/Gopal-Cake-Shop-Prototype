"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, User, ShieldCheck, ArrowRight, Activity, ChefHat, Truck, HeadphonesIcon, Settings } from "lucide-react";


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate network delay
    setTimeout(() => {
      // Fake Auth Logic
      let role = "";
      if (email === "admin@gopal.com" && password === "admin123") role = "admin";
      else if (email === "sales@gopal.com" && password === "sales123") role = "sales";
      else if (email === "chef@gopal.com" && password === "chef123") role = "chef";
      else if (email === "delivery@gopal.com" && password === "delivery123") role = "delivery";

      if (role) {
        document.cookie = `gopal_dummy_role=${role}; path=/; max-age=86400`; // 1 day expiration
        router.push(`/${role}`);
      } else {
        setError("Invalid email or password.");
        setIsLoading(false);
      }
    }, 800);
  };

  const quickLogin = (role: string) => {
    setEmail(`${role}@gopal.com`);
    setPassword(`${role}123`);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[2rem] p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-amber-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/30 mb-4 transform rotate-3">
            <Lock className="w-8 h-8 text-white -rotate-3" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Gopal Cake Shop</h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium mb-4">Internal Staff Portal</p>
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-amber-600 transition-colors bg-primary/10 px-3 py-1.5 rounded-full">
            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Public Website
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all font-medium"
                placeholder="staff@gopal.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-black text-lg shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <Activity className="w-6 h-6 animate-spin" />
            ) : (
              <>Secure Login <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        {/* PROTOTYPE ONLY: Quick Access Buttons */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs font-bold text-muted-foreground text-center uppercase tracking-widest mb-4">
            Prototype Quick Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => quickLogin('admin')} className="p-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
              <Settings className="w-3.5 h-3.5" /> Admin
            </button>
            <button onClick={() => quickLogin('sales')} className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
              <HeadphonesIcon className="w-3.5 h-3.5" /> Sales
            </button>
            <button onClick={() => quickLogin('chef')} className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
              <ChefHat className="w-3.5 h-3.5" /> Chef
            </button>
            <button onClick={() => quickLogin('delivery')} className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
              <Truck className="w-3.5 h-3.5" /> Delivery
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
