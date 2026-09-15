"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Receipt21, SearchNormal1, Clock, Reserve, Box, Location,
  TickCircle, Warning2, ArrowRight2, Home2, Bag, CloseCircle,
} from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";
import { getLocalOrders, type SavedOrder } from "@/lib/orderHistory";

interface RemoteOrder {
  orderNumber: string;
  trackingId: string;
  status: string;
  rawStatus: string;
  targetDate: string;
  totalAmount: number;
  deliveryType: string;
  createdAt: string;
  previewItems: { productName: string; quantity: number; variant: string }[];
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; glow: string }> = {
  "Order Received":   { color: "text-amber-400",  icon: Clock,     glow: "shadow-[0_0_12px_rgba(251,191,36,0.3)]" },
  "Preparing":        { color: "text-orange-400", icon: Reserve,   glow: "shadow-[0_0_12px_rgba(251,146,60,0.3)]" },
  "Ready":            { color: "text-sky-400",    icon: Box,       glow: "shadow-[0_0_12px_rgba(56,189,248,0.3)]" },
  "Out for Delivery": { color: "text-violet-400", icon: Location,  glow: "shadow-[0_0_12px_rgba(167,139,250,0.3)]" },
  "Delivered":        { color: "text-emerald-400",icon: TickCircle,glow: "shadow-[0_0_12px_rgba(52,211,153,0.3)]" },
  "Cancelled":        { color: "text-rose-400",   icon: CloseCircle,glow: "" },
};

function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] || { color: "text-gray-400", icon: Clock, glow: "" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MyOrdersPage() {
  const [phone, setPhone] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [remoteOrders, setRemoteOrders] = useState<RemoteOrder[]>([]);
  const [localOrders, setLocalOrders] = useState<SavedOrder[]>([]);

  // Load localStorage orders on mount
  useEffect(() => {
    setLocalOrders(getLocalOrders());
    // Auto-fill phone from most recent local order
    const recent = getLocalOrders();
    if (recent.length > 0 && recent[0].phone) {
      setPhone(recent[0].phone);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, "").replace(/^91/, "");
    if (cleaned.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    setError("");
    setRemoteOrders([]);
    setCustomerName("");
    try {
      const res = await fetch(`/api/v1/public/orders/by-phone?phone=${cleaned}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setRemoteOrders(data.orders || []);
      setCustomerName(data.customerName || "");
      setSubmittedPhone(cleaned);
    } catch (err: any) {
      setError("Could not fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Merge local + remote without duplicates (remote wins)
  const localOnlyOrders = localOrders.filter(
    (lo) => !remoteOrders.some((ro) => ro.trackingId === lo.trackingId)
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 relative">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] left-[10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-500/8 to-transparent blur-[120px]" />
        <div className="absolute bottom-0 right-[5%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-rose-500/5 to-transparent blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 relative z-10 pt-6">

        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <BackButton fallback="/" label="Back" variant="ghost" className="px-0 text-gray-400 hover:text-white" />
          <Link href="/" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Home2 className="w-5 h-5" />
          </Link>
        </header>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-ui text-[10px] uppercase tracking-[0.3em] font-black text-amber-500 mb-3">Gopal Cake Shop</p>
          <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-3">My Orders</h1>
          <p className="font-editorial italic text-gray-400">
            Enter your phone number to see all your past and current orders.
          </p>
        </motion.div>

        {/* Phone Search */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="mb-10"
        >
          <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-4 flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <SearchNormal1 className="w-5 h-5 text-amber-400" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter your 10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="flex-1 bg-transparent text-white placeholder-gray-600 font-ui text-sm font-bold outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-ui text-[10px] uppercase tracking-[0.15em] font-black rounded-xl transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? "..." : "Find"}
            </button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-rose-400 font-editorial italic text-sm px-1"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.form>

        {/* Remote Orders (from server) */}
        <AnimatePresence>
          {remoteOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-ui text-[10px] uppercase tracking-[0.25em] font-black text-white">
                  {customerName ? `${customerName}'s Orders` : "Your Orders"}
                </h2>
                <span className="font-editorial italic text-gray-500 text-sm">{remoteOrders.length} orders</span>
              </div>
              <div className="space-y-4">
                {remoteOrders.map((order) => (
                  <OrderCard
                    key={order.trackingId}
                    trackingId={order.trackingId}
                    orderNumber={order.orderNumber}
                    status={order.status}
                    totalAmount={order.totalAmount}
                    placedAt={order.createdAt}
                    targetDate={order.targetDate}
                    deliveryType={order.deliveryType}
                    previewText={order.previewItems.map(i => `${i.productName}${i.variant ? ` (${i.variant})` : ''} ×${i.quantity}`).join(", ")}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {submittedPhone && remoteOrders.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 text-center py-12 bg-white/[0.03] border border-white/10 rounded-[2rem]"
            >
              <Bag className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <p className="font-display font-black text-lg text-gray-400 mb-1">No orders found</p>
              <p className="font-editorial italic text-gray-600 text-sm">
                No orders were placed with this number.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent from localStorage (shown even without phone search) */}
        {localOnlyOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: remoteOrders.length > 0 ? 0 : 0.2 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-ui text-[10px] uppercase tracking-[0.25em] font-black text-gray-400">
                Recent on This Device
              </h2>
              <span className="font-editorial italic text-gray-600 text-xs">From this browser</span>
            </div>
            <div className="space-y-4">
              {localOnlyOrders.map((lo) => (
                <OrderCard
                  key={lo.trackingId}
                  trackingId={lo.trackingId}
                  orderNumber={lo.orderNumber}
                  status={undefined}
                  totalAmount={lo.totalAmount}
                  placedAt={lo.placedAt}
                  targetDate={undefined}
                  deliveryType={undefined}
                  previewText={lo.previewItems}
                  isLocal
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state — nothing at all */}
        {localOrders.length === 0 && !submittedPhone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <Receipt21 className="w-9 h-9 text-gray-600" />
            </div>
            <p className="font-display font-black text-xl text-gray-400 mb-2">No recent orders</p>
            <p className="font-editorial italic text-gray-600 mb-8">
              Enter your phone number above to look up all your orders.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-ui text-[10px] uppercase tracking-[0.2em] font-black rounded-full transition-colors"
            >
              Browse Menu <ArrowRight2 className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

      </div>
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({
  trackingId,
  orderNumber,
  status,
  totalAmount,
  placedAt,
  targetDate,
  deliveryType,
  previewText,
  isLocal,
}: {
  trackingId: string;
  orderNumber: string;
  status?: string;
  totalAmount: number;
  placedAt: string;
  targetDate?: string;
  deliveryType?: string;
  previewText: string;
  isLocal?: boolean;
}) {
  if (!trackingId) return null;
  const cfg = status ? getStatusCfg(status) : { color: "text-gray-500", icon: Clock, glow: "" };
  const StatusIcon = cfg.icon;

  return (
    <Link href={`/track/${trackingId}`}>
      <motion.div
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.99 }}
        className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-[1.75rem] p-5 transition-all cursor-pointer"
      >
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ${cfg.glow}`}>
            <StatusIcon className={`w-6 h-6 ${cfg.color}`} variant="Bold" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-display font-black text-white text-base">#{orderNumber || trackingId.slice(-6)}</span>
              <span className="font-display font-bold text-white text-base">
                ₹{Math.round(totalAmount).toLocaleString("en-IN")}
              </span>
            </div>

            {status ? (
              <span className={`font-ui text-[9px] uppercase tracking-[0.2em] font-black ${cfg.color} mb-2 block`}>
                {status}
              </span>
            ) : (
              <span className="font-ui text-[9px] uppercase tracking-[0.2em] font-black text-gray-600 mb-2 block">
                Tap to check status
              </span>
            )}

            <p className="font-editorial italic text-gray-500 text-xs truncate">{previewText}</p>

            <div className="flex items-center gap-3 mt-2">
              <span className="font-ui text-[9px] uppercase tracking-wider font-bold text-gray-600">
                Placed {formatDate(placedAt)}
              </span>
              {targetDate && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className="font-ui text-[9px] uppercase tracking-wider font-bold text-gray-600">
                    Due {formatDate(targetDate)}
                  </span>
                </>
              )}
              {deliveryType && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className="font-ui text-[9px] uppercase tracking-wider font-bold text-gray-600">
                    {deliveryType === "PICKUP" ? "Self Pickup" : "Delivery"}
                  </span>
                </>
              )}
              {isLocal && (
                <span className="ml-auto font-ui text-[8px] uppercase tracking-wider font-black text-gray-700 bg-white/5 px-2 py-0.5 rounded-full">
                  Saved locally
                </span>
              )}
            </div>
          </div>

          <ArrowRight2 className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors shrink-0 mt-1" />
        </div>
      </motion.div>
    </Link>
  );
}
