"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Receipt21, SearchNormal1, Clock, Reserve, Box, Location,
  TickCircle, ArrowRight2, Home2, Bag, CloseCircle,
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

const STATUS_CONFIG: Record<string, { badgeBg: string; textColor: string; borderColor: string; icon: any }> = {
  "Order Received":   { badgeBg: "bg-amber-100",  textColor: "text-amber-900", borderColor: "border-amber-300",  icon: Clock },
  "Preparing":        { badgeBg: "bg-orange-100", textColor: "text-orange-900",borderColor: "border-orange-300", icon: Reserve },
  "Ready":            { badgeBg: "bg-sky-100",    textColor: "text-sky-900",   borderColor: "border-sky-300",    icon: Box },
  "Out for Delivery": { badgeBg: "bg-purple-100", textColor: "text-purple-900",borderColor: "border-purple-300", icon: Location },
  "Delivered":        { badgeBg: "bg-emerald-100",textColor: "text-emerald-900",borderColor: "border-emerald-300",icon: TickCircle },
  "Cancelled":        { badgeBg: "bg-rose-100",   textColor: "text-rose-900",   borderColor: "border-rose-300",   icon: CloseCircle },
};

function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] || { badgeBg: "bg-stone-100", textColor: "text-stone-800", borderColor: "border-stone-300", icon: Clock };
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
    <div className="min-h-screen bg-[#FAF6F0] text-[#3E2723] pb-32 pt-20 relative">
      <div className="max-w-2xl mx-auto px-4 md:px-8 relative z-10 pt-4">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <BackButton fallback="/" label="Back to Shop" variant="outline" className="border-[#C5A059]/40 text-[#3E2723] hover:bg-white font-bold text-xs" />
          <Link href="/" className="w-10 h-10 bg-white border border-[#C5A059]/40 rounded-full flex items-center justify-center text-[#3E2723] hover:bg-[#FFF8F0] shadow-sm transition-colors">
            <Home2 className="w-5 h-5 text-[#8B3A52]" />
          </Link>
        </header>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-ui text-[11px] uppercase tracking-[0.25em] font-black text-[#8B3A52] mb-2">Gopal Cake Shop</p>
          <h1 className="font-serif font-black text-4xl md:text-5xl text-[#3E2723] tracking-tight mb-2">My Orders</h1>
          <p className="font-serif italic text-[#6D4C41] text-base">
            Enter your 10-digit mobile number to view all past and active cake orders.
          </p>
        </motion.div>

        {/* Phone Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="mb-8"
        >
          <div className="bg-white border-2 border-[#C5A059]/40 rounded-2xl p-3 md:p-4 flex gap-3 items-center shadow-md focus-within:border-[#8B3A52] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#8B3A52]/10 flex items-center justify-center shrink-0">
              <SearchNormal1 className="w-5 h-5 text-[#8B3A52]" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="flex-1 bg-transparent text-[#3E2723] placeholder-[#A1887F] font-sans text-base font-bold outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#8B3A52] hover:bg-[#722F43] text-white font-sans text-xs uppercase tracking-[0.15em] font-black rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {loading ? "Searching..." : "Find Orders"}
            </button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-rose-700 font-bold text-sm px-2 flex items-center gap-1"
              >
                ⚠️ {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.form>

        {/* Remote Orders (from server) */}
        <AnimatePresence>
          {remoteOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="font-ui text-xs uppercase tracking-[0.2em] font-black text-[#3E2723]">
                  {customerName ? `${customerName}'s Orders` : "Your Orders"}
                </h2>
                <span className="font-serif italic text-[#6D4C41] text-sm font-bold">{remoteOrders.length} orders found</span>
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 text-center py-12 bg-white border border-[#C5A059]/30 rounded-2xl shadow-sm"
            >
              <Bag className="w-12 h-12 text-[#C5A059]/60 mx-auto mb-3" />
              <p className="font-serif font-black text-xl text-[#3E2723] mb-1">No orders found</p>
              <p className="font-serif italic text-[#6D4C41] text-sm">
                No orders were placed with phone number {submittedPhone}.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent from localStorage (shown even without phone search) */}
        {localOnlyOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: remoteOrders.length > 0 ? 0 : 0.2 }}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-ui text-xs uppercase tracking-[0.2em] font-black text-[#6D4C41]">
                Recent on This Device
              </h2>
              <span className="font-serif italic text-[#8D6E63] text-xs">Saved in browser</span>
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
            transition={{ delay: 0.2 }}
            className="text-center py-16 bg-white border border-[#C5A059]/30 rounded-2xl shadow-sm px-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#8B3A52]/10 border border-[#8B3A52]/20 flex items-center justify-center mx-auto mb-4">
              <Receipt21 className="w-8 h-8 text-[#8B3A52]" />
            </div>
            <p className="font-serif font-black text-2xl text-[#3E2723] mb-2">Look Up Your Cake Orders</p>
            <p className="font-serif italic text-[#6D4C41] text-sm mb-6 max-w-md mx-auto">
              Enter your 10-digit mobile number above to see live kitchen status, tracking details, and receipts.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#8B3A52] hover:bg-[#722F43] text-white font-sans text-xs uppercase tracking-[0.2em] font-black rounded-xl transition-all shadow-md active:scale-95"
            >
              Browse Bakery Menu <ArrowRight2 className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

      </div>
    </div>
  );
}

// ── Order Card Component ──────────────────────────────────────────────────────
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
  const cfg = status ? getStatusCfg(status) : { badgeBg: "bg-stone-100", textColor: "text-stone-800", borderColor: "border-stone-300", icon: Clock };
  const StatusIcon = cfg.icon;

  return (
    <Link href={`/track/${trackingId}`}>
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        className="group bg-white border-2 border-[#C5A059]/30 hover:border-[#8B3A52] rounded-2xl p-5 transition-all shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden"
      >
        <div className="flex items-start gap-4">
          {/* Status Icon Container */}
          <div className={`w-12 h-12 rounded-xl ${cfg.badgeBg} border ${cfg.borderColor} flex items-center justify-center shrink-0 shadow-sm`}>
            <StatusIcon className={`w-6 h-6 ${cfg.textColor}`} />
          </div>

          {/* Info Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-serif font-black text-[#3E2723] text-xl">
                #{orderNumber || trackingId.slice(-6)}
              </span>
              <span className="font-sans font-black text-[#8B3A52] text-xl">
                ₹{Math.round(totalAmount).toLocaleString("en-IN")}
              </span>
            </div>

            {status ? (
              <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[10px] uppercase tracking-wider font-black ${cfg.badgeBg} ${cfg.textColor} ${cfg.borderColor} mb-2`}>
                {status}
              </span>
            ) : (
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-300 text-[10px] uppercase tracking-wider font-bold mb-2">
                Tap to view status
              </span>
            )}

            <p className="font-sans font-bold text-[#5D4037] text-sm truncate mb-2">{previewText || "Artisanal Cake Order"}</p>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#C5A059]/15 text-xs font-semibold text-[#795548]">
              <span>Placed: {formatDate(placedAt)}</span>
              {targetDate && (
                <>
                  <span className="text-[#C5A059]">•</span>
                  <span>Due: {formatDate(targetDate)}</span>
                </>
              )}
              {deliveryType && (
                <>
                  <span className="text-[#C5A059]">•</span>
                  <span className="font-bold text-[#3E2723]">
                    {deliveryType === "PICKUP" ? "Store Pickup" : "Home Delivery"}
                  </span>
                </>
              )}
              {isLocal && (
                <span className="ml-auto font-sans text-[9px] uppercase font-bold text-[#8D6E63] bg-[#FAF6F0] border border-[#C5A059]/30 px-2 py-0.5 rounded-md">
                  Saved on Device
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <ArrowRight2 className="w-5 h-5 text-[#8B3A52] group-hover:translate-x-1 transition-transform shrink-0 self-center" />
        </div>
      </motion.div>
    </Link>
  );
}
