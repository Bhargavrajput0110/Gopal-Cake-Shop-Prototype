"use client";

import React, { useEffect, useState } from "react";
import { useOrders, Order } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";
import { Notification, ShieldCross, DiscountShape, TickCircle, CloseCircle, Clock, TickSquare, CloseSquare, ShieldTick } from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";

export default function NotificationsPage() {
  const { orders } = useOrders();
  const [pendingOverrides, setPendingOverrides] = useState<Order[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch pending override requests from orders pool
  useEffect(() => {
    const pending = orders.filter(o => o.requestedDiscountOverride?.status === 'pending');
    setPendingOverrides(pending);
  }, [orders]);

  const handleProcessOverride = async (orderId: string, action: 'approved' | 'rejected') => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/approve-override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          approvedBy: "Bhargav Owner"
        })
      });
      if (res.ok) {
        setPendingOverrides(prev => prev.filter(o => o.id !== orderId));
        alert(`Override request successfully ${action}!`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to review override.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="mb-2">
        <BackButton fallback="/admin" label="Back" variant="outline" size="sm" />
      </div>
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl">
          <Notification className="w-6 h-6 animate-swing" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight font-heading">
            Approval Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Approve override requests for custom cake orders and manual discount exceptions.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
          <ShieldCross className="w-4 h-4 text-orange-500" /> Pending Permissions ({pendingOverrides.length})
        </h2>

        <AnimatePresence>
          {pendingOverrides.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border rounded-3xl p-12 text-center shadow-inner opacity-50 flex flex-col items-center justify-center"
            >
              <ShieldTick className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-bold text-sm text-gray-700 uppercase tracking-wider">All Clear!</p>
              <p className="text-xs text-muted-foreground mt-1">No pending discount overrides require verification.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {pendingOverrides.map((order, i) => {
                const req = order.requestedDiscountOverride!;
                const baseVal = order.subtotal || 1000;
                const discountPercent = req.isPercent ? req.amount : Math.round((req.amount / baseVal) * 100);
                const discountRs = req.isPercent ? Math.round(baseVal * (req.amount / 100)) : req.amount;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-3xl border-2 border-orange-200 overflow-hidden shadow-sm flex flex-col md:flex-row items-stretch"
                  >
                    {/* Left Stripe Indicator */}
                    <div className="bg-orange-500 w-full md:w-3 shrink-0" />

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-lg text-gray-900">{order.id}</span>
                          <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Requires {discountPercent}% Discount Approval
                          </span>
                        </div>
                        
                        <div className="text-xs font-bold text-gray-600 space-y-1">
                          <p>Customer: <span className="text-gray-900 font-black">{order.customerName}</span> &bull; Phone: {order.customerPhone}</p>
                          <p>Cake Details: <span className="text-gray-900 font-black">{order.items[0]?.name} ({order.items[0]?.weight})</span></p>
                          <p>Branch: <span className="text-gray-900 font-black">{order.branch}</span></p>
                          <p className="text-gray-500 mt-2 font-normal italic">
                            Requested by: {req.requestedBy || "Salesperson"}
                          </p>
                        </div>
                      </div>

                      {/* Calculations Panel */}
                      <div className="bg-gray-50 border rounded-2xl p-4 w-full md:w-48 shrink-0 space-y-2.5">
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                          <span>Base Price:</span>
                          <span className="text-gray-900">₹{baseVal}</span>
                        </div>
                        <div className="flex justify-between text-xs font-black text-rose-600">
                          <span>Req Discount:</span>
                          <span>-₹{discountRs} ({discountPercent}%)</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-gray-800 border-t pt-2">
                          <span>Final Total:</span>
                          <span>₹{Math.max(0, baseVal - discountRs)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          disabled={processingId === order.id}
                          onClick={() => handleProcessOverride(order.id, 'approved')}
                          className="flex-1 md:flex-none px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-95 transition-transform"
                        >
                          <TickSquare className="w-4 h-4" /> Approve
                        </button>
                        <button
                          disabled={processingId === order.id}
                          onClick={() => handleProcessOverride(order.id, 'rejected')}
                          className="flex-1 md:flex-none px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                        >
                          <CloseSquare className="w-4 h-4" /> Reject
                        </button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
