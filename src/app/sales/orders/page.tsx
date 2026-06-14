"use client";

import { useState } from "react";
import { Phone, CheckCircle2, AlertTriangle, Image as ImageIcon, Gift, Flower2, Bell, ChefHat, Clock, Truck } from "lucide-react";
import { useOrders, Order } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";

export default function OrderManagementPage() {
  const { orders } = useOrders();
  const [filter, setFilter] = useState("All");
  const [showPopup, setShowPopup] = useState(true);
  const filters = ["All", "Pending", "Confirm", "In Production", "Ready", "Deliver"];

  // Sort orders: Priority orders first, then by delivery time (ascending)
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return new Date(a.timeTarget).getTime() - new Date(b.timeTarget).getTime();
  });

  // Filter orders based on basic UI logic
  const visibleOrders = sortedOrders.filter(o => {
    if (filter === "Pending") return o.status === "new";
    if (filter === "In Production") return ["accepted_by_chef", "preparing", "decorating"].includes(o.status);
    if (filter === "Ready") return o.status === "ready_for_pickup";
    if (filter === "Deliver") return ["pending_assignment", "assigned_to_driver", "picked_up_by_driver", "on_the_way", "delivered"].includes(o.status);
    return true; // "All"
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-[calc(100vh-8rem)] flex flex-col"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight font-serif text-[#3E2723]">Orders</h2>
          <p className="text-muted-foreground text-xs mt-0.5 tracking-wide">Manage, track, and dispatch your daily queue.</p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 shrink-0 hide-scrollbar">
        {filters.map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              filter === f 
                ? "bg-[#C5A059] text-[#3E2723] shadow-sm" 
                : "bg-secondary text-muted-foreground hover:bg-[#C5A059]/20 hover:text-[#3E2723]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2" data-lenis-prevent>
        <AnimatePresence>
          {visibleOrders.map(order => (
            <OrderDetailsCard key={order.id} order={order} />
          ))}
        </AnimatePresence>
        
        {visibleOrders.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="font-bold">No orders found for this filter.</p>
          </div>
        )}
      </div>

      {/* Simulated New Order Pop-up Notification */}
      <AnimatePresence>
        {showPopup && (
          <motion.div 
            key="new-order-popup"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-6 right-6 w-80 bg-white/90 backdrop-blur-xl border border-[#C5A059] shadow-2xl rounded-xl p-4 z-50"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#C5A059]/20 text-[#3E2723] rounded-full animate-pulse">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-[#3E2723]">NEW ORDER ARRIVED!</h4>
                <p className="text-sm font-bold text-[#C5A059] mt-0.5">109999</p>
                <p className="text-xs text-muted-foreground mt-1">3-Tier Wedding Cake &bull; Delivery</p>
                <button 
                  onClick={() => setShowPopup(false)}
                  className="mt-3 w-full bg-[#3E2723] text-white text-xs font-bold py-2 rounded hover:bg-[#3E2723]/90 transition-transform active:scale-95"
                >
                  View Details
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function OrderDetailsCard({ order }: { order: Order }) {
  const { updateOrderStatus } = useOrders();

  const handleApprove = () => {
    updateOrderStatus(order.id, "accepted_by_chef");
  };

  const handleAssignDriver = () => {
    updateOrderStatus(order.id, "pending_assignment");
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/80 backdrop-blur-md border border-[#C5A059]/20 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row group hover:border-[#C5A059]/50 transition-all duration-300 hover:shadow-md"
    >
      <div className="w-full md:w-48 bg-secondary/30 shrink-0 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-[#C5A059]/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1562777717-b6c338435d72?auto=format&fit=crop&q=80&w=200&h=200" alt="Cake" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-2 left-2 bg-black/50 text-[#FAFAF8] backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
          <ImageIcon className="w-2.5 h-2.5" /> Reference
        </div>
        {order.isSurprise && (
          <div className="absolute bottom-2 right-2 bg-purple-500/90 text-white backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
            <Gift className="w-2.5 h-2.5" /> Surprise
          </div>
        )}
      </div>
      
      <div className="p-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-xl font-serif font-black text-[#3E2723]">{order.id}</h3>
            <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
              {order.status.replace(/_/g, ' ')}
            </span>
            {order.delayLevel === "delayed" && (
              <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5" /> Delayed
              </span>
            )}
            {order.delayLevel === "warning" && (
              <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Issue Reported
              </span>
            )}
          </div>
          <div className="space-y-1">
            {order.items.map((item, i) => (
              <p key={i} className="text-sm font-bold text-foreground">{item.qty}x {item.name}</p>
            ))}
          </div>
          
          {order.items.some(i => i.notes) && (
            <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs font-bold italic inline-block">
              Note: &quot;{order.items.find(i => i.notes)?.notes}&quot;
            </div>
          )}

          <div className="mt-4">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Kitchen Status</h4>
            <div className="bg-secondary/30 border border-border p-2 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  ["new", "accepted_by_chef"].includes(order.status) ? "bg-amber-500/20 text-amber-600 animate-pulse" :
                  ["ready_for_pickup", "pending_assignment", "assigned_to_driver", "picked_up_by_driver", "on_the_way", "delivered"].includes(order.status) ? "bg-emerald-500/20 text-emerald-600" :
                  "bg-blue-500/20 text-blue-600"
                }`}>
                  {["new", "accepted_by_chef"].includes(order.status) ? <Clock className="w-3 h-3" /> :
                   ["ready_for_pickup", "pending_assignment", "assigned_to_driver", "picked_up_by_driver", "on_the_way", "delivered"].includes(order.status) ? <CheckCircle2 className="w-3 h-3" /> :
                   <ChefHat className="w-3 h-3" />}
                </div>
                <div>
                  <p className="font-bold text-xs text-foreground">
                    {order.status === "new" ? "Awaiting Sales Approval" :
                     order.status === "accepted_by_chef" ? "Waiting for Kitchen" :
                     order.status === "preparing" ? "Chef is Baking" :
                     order.status === "decorating" ? "Chef is Decorating" :
                     "Ready from Kitchen"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Customer</p>
                <p className="text-xs font-bold text-foreground">{order.customerName}</p>
                <p className="text-[10px] text-muted-foreground">{order.customerPhone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Schedule</p>
                <p className="text-xs font-bold text-emerald-600">Delivery</p>
                <p className="text-[10px] font-bold text-foreground" suppressHydrationWarning>Today, {order.timeTarget}</p>
              </div>
            </div>

            {/* Vendor UI only shows if new */}
            {order.status === "new" && (
              <div className="bg-secondary/20 p-2.5 rounded-md border border-border">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  Vendor Assignments
                  <span className="text-[9px] bg-[#C5A059]/10 text-[#C5A059] px-1.5 py-0.5 rounded-full normal-case">Suggested</span>
                </h4>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 p-1.5 border border-border/50 rounded bg-white hover:border-[#C5A059]/50 cursor-pointer transition-colors relative overflow-hidden">
                    <input type="checkbox" className="w-3.5 h-3.5 mt-0.5" defaultChecked />
                    <div className="flex-1">
                      <p className="font-bold text-xs text-foreground flex items-center gap-1.5"><Flower2 className="w-3.5 h-3.5 text-rose-500" /> Florist Shop</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-border">
            {order.status === "new" && (
              <button onClick={handleApprove} className="flex-1 bg-emerald-500 text-white px-3 py-2 rounded-md text-xs font-bold hover:bg-emerald-600 flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95">
                <CheckCircle2 className="w-3.5 h-3.5" /> Send to Kitchen
              </button>
            )}
            
            {order.status === "ready_for_pickup" && (
              <button onClick={handleAssignDriver} className="flex-1 bg-[#3E2723] text-[#FAFAF8] px-3 py-2 rounded-md text-xs font-bold hover:bg-[#3E2723]/90 flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95">
                <Truck className="w-3.5 h-3.5" /> Dispatch to Driver
              </button>
            )}

            <button className="px-3 py-2 bg-white border border-border text-foreground rounded-md text-xs font-bold hover:bg-secondary flex items-center justify-center gap-1.5 transition-colors shadow-sm">
              <Phone className="w-3.5 h-3.5 text-[#C5A059]" /> Call
            </button>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
