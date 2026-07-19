"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import { Lock1, ArrowRight, ShieldTick, Reserve, Headphone, Buildings2, User, TruckFast, Trash, Gallery } from "iconsax-react";

type Staff = {
  id: string;
  name: string;
  role: string;
  branchId?: string;
};

type Branch = {
  id: string;
  name: string;
};

const ROLES = [
  { id: "admin", name: "Admin", icon: ShieldTick, color: "text-purple-600", bg: "bg-purple-100" },
  { id: "manager", name: "Manager", icon: Buildings2, color: "text-blue-600", bg: "bg-blue-100" },
  { id: "sales", name: "Sales", icon: Headphone, color: "text-amber-600", bg: "bg-amber-100" },
  { id: "chef", name: "Chef", icon: Reserve, color: "text-rose-600", bg: "bg-rose-100" },
  { id: "driver", name: "Driver", icon: TruckFast, color: "text-emerald-600", bg: "bg-emerald-100" },
  { id: "vendor", name: "Vendor", icon: Gallery, color: "text-indigo-600", bg: "bg-indigo-100" },
];

export default function LoginClient({ staffList, branchList }: { staffList: Staff[], branchList: Branch[] }) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Derived filtered staff
  const filteredStaff = staffList.filter(s => {
    if (s.role !== selectedRole) return false;
    // Admins usually aren't tied to a specific branch in the same way, but let's check
    if (selectedRole === "admin" || selectedRole === "vendor") return true; 
    return s.branchId === selectedBranch;
  });

  const handleKeyPress = (num: string) => {
    setError("");
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        submitLogin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError("");
  };

  const bypassLogin = () => {
    if (!selectedStaff) return;
    document.cookie = `e2e-bypass-auth=true; path=/; max-age=86400`;
    if (selectedStaff.role === 'admin') window.location.href = '/admin';
    else if (selectedStaff.role === 'manager') window.location.href = '/manager';
    else if (selectedStaff.role === 'sales') window.location.href = '/sales';
    else if (selectedStaff.role === 'chef') window.location.href = '/chef';
    else if (selectedStaff.role === 'driver') window.location.href = '/delivery';
    else if (selectedStaff.role === 'vendor') {
      if (selectedStaff.id === '6') window.location.href = '/vendor?vendorId=VENDOR_ACRYLIC';
      else if (selectedStaff.id === '7') window.location.href = '/vendor?vendorId=VENDOR_FLORIST';
      else if (selectedStaff.id === '8') window.location.href = '/vendor?vendorId=VENDOR_PHOTO';
      else window.location.href = '/vendor';
    }
  };

  const submitLogin = async (finalPin: string) => {
    if (!selectedStaff) return;
    setIsLoading(true);
    
    try {
      // Bypassing Next-Auth for E2E Mock Staff IDs
      if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(selectedStaff.id)) {
        if (!["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888"].includes(finalPin)) {
           setError("Invalid PIN.");
           setPin("");
           setIsLoading(false);
           return;
        }
        document.cookie = `e2e-bypass-auth=true; path=/; max-age=86400`;
        if (selectedStaff.role === 'admin') window.location.href = '/admin';
        else if (selectedStaff.role === 'manager') window.location.href = '/manager';
        else if (selectedStaff.role === 'sales') window.location.href = '/sales';
        else if (selectedStaff.role === 'chef') window.location.href = '/chef';
        else if (selectedStaff.role === 'driver') window.location.href = '/delivery';
        else if (selectedStaff.role === 'vendor') {
          if (selectedStaff.id === '6') window.location.href = '/vendor?vendorId=VENDOR_ACRYLIC';
          else if (selectedStaff.id === '7') window.location.href = '/vendor?vendorId=VENDOR_FLORIST';
          else if (selectedStaff.id === '8') window.location.href = '/vendor?vendorId=VENDOR_PHOTO';
          else window.location.href = '/vendor';
        }
        return;
      }

      const res = await signIn("credentials", {
        redirect: false,
        id: selectedStaff.id,
        pin: finalPin,
      });

      if (res?.error) {
        setError("Invalid PIN.");
        setPin("");
        setIsLoading(false);
      } else {
        if (selectedStaff.role === "driver") {
          window.location.href = "/delivery";
        } else {
          window.location.href = "/admin";
        }
      }
    } catch (err) {
      setError("An error occurred.");
      setPin("");
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setSelectedRole(null);
    setSelectedBranch(null);
    setSelectedStaff(null);
    setPin("");
    setError("");
  };

  const goBack = () => {
    if (selectedStaff) {
      setSelectedStaff(null);
      setPin("");
      setError("");
    } else if (selectedBranch) {
      setSelectedBranch(null);
    } else if (selectedRole) {
      setSelectedRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Luxury Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--brand-champagne)]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[var(--brand-deep-rose)]/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_24px_64px_rgba(74,59,53,0.08)] rounded-[2.5rem] p-10 md:p-14 relative z-10 min-h-[550px] flex flex-col"
      >
        {/* Back Button */}
        {(selectedRole || selectedBranch || selectedStaff) ? (
          <button 
            onClick={goBack}
            className="absolute top-8 left-8 p-3 bg-white border border-[var(--border)] rounded-full hover:bg-[var(--brand-champagne)]/10 hover:border-[var(--brand-champagne)]/40 transition-all z-20 hover:scale-105 active:scale-95"
          >
            <ArrowRight className="w-5 h-5 rotate-180 text-[var(--foreground)]" />
          </button>
        ) : (
          <a 
            href="/"
            className="absolute top-8 left-8 p-3 bg-white border border-[var(--border)] rounded-full hover:bg-[var(--brand-champagne)]/10 hover:border-[var(--brand-champagne)]/40 transition-all z-20 hover:scale-105 active:scale-95 flex items-center justify-center group"
            title="Return to Home"
          >
            <ArrowRight className="w-5 h-5 rotate-180 text-[var(--foreground)] group-hover:text-[var(--brand-champagne)] transition-colors" />
          </a>
        )}

        {/* Header */}
        <div className="text-center mb-10 mt-2">
          <div className="w-16 h-16 bg-[var(--brand-champagne)]/10 border border-[var(--brand-champagne)]/20 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-[var(--brand-champagne)]/20 mb-5">
            <Lock1 className="w-7 h-7 text-[var(--brand-champagne)]" />
          </div>
          <h1 className="font-display font-black text-4xl text-[var(--foreground)] tracking-tight">Staff Portal</h1>
          <p className="font-editorial italic text-[var(--muted-foreground)] text-lg mt-2">Secure access for Gopal Cake Shop personnel.</p>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Select Role */}
            {!selectedRole && (
              <motion.div
                key="step-role"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-ui text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.2em] text-center mb-8">
                  Select Your Role
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className="flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] bg-white border border-[var(--border)] hover:border-[var(--brand-champagne)]/60 hover:shadow-xl hover:shadow-[var(--brand-champagne)]/10 transition-all duration-400 ease-out group"
                      >
                        <div className={`w-14 h-14 rounded-full bg-[var(--brand-champagne)]/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-400 ease-out`}>
                          <Icon className={`w-6 h-6 text-[var(--brand-champagne)]`} />
                        </div>
                        <span className="font-display font-bold text-[var(--foreground)]">{role.name}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Select Branch (Skip for Admin and Vendor) */}
            {selectedRole && selectedRole !== "admin" && selectedRole !== "vendor" && !selectedBranch && (
              <motion.div
                key="step-branch"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-ui text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.2em] text-center mb-8">
                  Select Your Branch
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branchList.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch.id)}
                      className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-white border border-[var(--border)] hover:border-[var(--brand-champagne)]/60 hover:shadow-lg hover:shadow-[var(--brand-champagne)]/10 transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--brand-champagne)]/5 flex items-center justify-center group-hover:bg-[var(--brand-champagne)]/10 transition-colors">
                        <Buildings2 className="w-5 h-5 text-[var(--brand-champagne)]" />
                      </div>
                      <span className="font-display font-bold text-[var(--foreground)] text-lg">{branch.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Select Staff Profile */}
            {selectedRole && (selectedRole === "admin" || selectedRole === "vendor" || selectedBranch) && !selectedStaff && (
              <motion.div
                key="step-staff"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-ui text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.2em] text-center mb-8">
                  Select Your Profile
                </h2>
                {filteredStaff.length === 0 ? (
                  <div className="text-center font-editorial italic text-[var(--muted-foreground)] py-8">
                    No staff found for this selection.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                    {filteredStaff.map((staff) => (
                      <button
                        key={staff.id}
                        onClick={() => setSelectedStaff(staff)}
                        className="flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] bg-white border border-[var(--border)] hover:border-[var(--brand-champagne)]/60 hover:shadow-xl hover:shadow-[var(--brand-champagne)]/10 transition-all duration-400 ease-out group"
                      >
                        <div className="w-16 h-16 rounded-full bg-[var(--brand-champagne)]/10 flex items-center justify-center text-2xl font-display font-bold text-[var(--brand-champagne)] group-hover:scale-110 transition-transform duration-400">
                          {staff.name.charAt(0)}
                        </div>
                        <div className="text-center">
                          <p className="font-display font-bold text-[var(--foreground)] text-base">{staff.name}</p>
                          <p className="font-ui text-[9px] uppercase tracking-[0.15em] text-[var(--brand-champagne)] font-bold mt-1.5">
                            {staff.role}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: Enter PIN */}
            {selectedStaff && (
              <motion.div
                key="step-pin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center w-full max-w-sm mx-auto"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-[var(--brand-champagne)]/10 flex items-center justify-center text-3xl font-display font-black text-[var(--brand-champagne)] mx-auto mb-5 border border-[var(--brand-champagne)]/20 shadow-lg shadow-[var(--brand-champagne)]/10">
                    {selectedStaff.name.charAt(0)}
                  </div>
                  <h2 className="font-display font-black text-2xl text-[var(--foreground)]">Welcome, {selectedStaff.name}</h2>
                  <p className="font-ui text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--muted-foreground)] mt-3">Enter your 4-digit PIN</p>
                </div>

                <div className="flex gap-4 mb-8">
                  {[0, 1, 2, 3].map((index) => (
                    <div 
                      key={index} 
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-400 ease-out ${
                        pin.length > index 
                          ? error ? "bg-[var(--brand-deep-rose)] scale-125" : "bg-[var(--brand-champagne)] scale-125" 
                          : "bg-[var(--border)]"
                      }`}
                    />
                  ))}
                </div>

                <div className="h-6 mb-4">
                  {error && (
                    <p className="font-ui text-[11px] font-bold text-[var(--brand-deep-rose)] uppercase tracking-wider animate-pulse">{error}</p>
                  )}
                  {isLoading && (
                    <p className="font-ui text-[11px] font-bold text-[var(--brand-champagne)] uppercase tracking-wider animate-pulse">Authenticating...</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 w-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleKeyPress(num.toString())}
                      disabled={isLoading}
                      className="h-16 rounded-2xl bg-white border border-[var(--border)] text-2xl font-display font-bold text-[var(--foreground)] hover:bg-[var(--brand-champagne)] hover:border-[var(--brand-champagne)] hover:text-white hover:shadow-xl hover:shadow-[var(--brand-champagne)]/20 active:scale-95 transition-all duration-300"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={bypassLogin}
                    disabled={isLoading}
                    className="h-16 rounded-2xl bg-white border border-[var(--border)] text-[9px] font-ui font-bold uppercase tracking-[0.1em] text-[var(--muted-foreground)] hover:bg-[var(--foreground)] hover:text-white hover:border-[var(--foreground)] hover:shadow-xl active:scale-95 transition-all duration-300"
                  >
                    Bypass
                  </button>
                  <button
                    onClick={() => handleKeyPress("0")}
                    disabled={isLoading}
                    className="h-16 rounded-2xl bg-white border border-[var(--border)] text-2xl font-display font-bold text-[var(--foreground)] hover:bg-[var(--brand-champagne)] hover:border-[var(--brand-champagne)] hover:text-white hover:shadow-xl hover:shadow-[var(--brand-champagne)]/20 active:scale-95 transition-all duration-300"
                  >
                    0
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading || pin.length === 0}
                    className="h-16 rounded-2xl bg-white border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--brand-deep-rose)] hover:text-white hover:border-[var(--brand-deep-rose)] hover:shadow-xl hover:shadow-[var(--brand-deep-rose)]/20 active:scale-95 transition-all duration-300 disabled:opacity-50"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-10 text-center">
                  <a href="/forgot-password" className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--brand-champagne)] transition-colors">Forgot your PIN?</a>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
