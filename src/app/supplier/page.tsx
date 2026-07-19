"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOrders } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";
import { Box, TruckFast, TickCircle, Warning2, Logout, BoxSearch, Clock, BoxTick } from "iconsax-react";
import NumberTicker from "@/components/magicui/NumberTicker";

type SupplierType = { id: string; name: string; categories: string[] };

const SUPPLIER_DB: Record<string, SupplierType> = {
  "SUP-001": { id: "SUP-001", name: "Amul Dairy Distributors", categories: ["Dairy", "Milk", "Butter", "Cream"] },
  "SUP-002": { id: "SUP-002", name: "Ashok Flour Mills", categories: ["Flour", "Wheat", "Maida"] },
  "SUP-003": { id: "SUP-003", name: "Callebaut Premium Chocolate", categories: ["Chocolate", "Cocoa", "Couverture"] }
};

export default function SupplierDashboard() {
  const router = useRouter();
  const { orders, updateIngredientRequestStatus } = useOrders();
  const [supplierId, setSupplierId] = useState<string>("SUP-001");
  const [supplierInfo, setSupplierInfo] = useState<SupplierType>(SUPPLIER_DB["SUP-001"]);
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("supplierId");
    if (sid && SUPPLIER_DB[sid]) {
      setSupplierId(sid);
      setSupplierInfo(SUPPLIER_DB[sid]);
    }
  }, []);

  const handleSignOut = () => {
    document.cookie = "gopal_dummy_role=; path=/; max-age=0";
    document.cookie = "e2e-bypass-auth=; path=/; max-age=0";
    router.push("/login");
  };

  // Extract all ingredient requests across all orders
  const allRequests = useMemo(() => {
    const reqs: any[] = [];
    orders.forEach(order => {
      if (order.ingredientRequests && order.ingredientRequests.length > 0) {
        order.ingredientRequests.forEach(req => {
          reqs.push({
            ...req,
            orderId: order.id,
            branch: order.branch,
            priorityLevel: order.priorityLevel,
            timeTarget: order.timeTarget
          });
        });
      }
    });
    return reqs;
  }, [orders]);

  // Filter requests intended for this supplier (Mock logic: if itemName contains category)
  const myRequests = useMemo(() => {
    return allRequests.filter(req => {
      // In a real app, the request would have a mapped supplierId.
      // For the mock, we check if the requested item name matches the supplier's categories loosely.
      // If we can't match, we assign to SUP-001 as fallback.
      const isMatch = supplierInfo.categories.some(c => req.itemName.toLowerCase().includes(c.toLowerCase()));
      if (supplierId === "SUP-001" && !isMatch) {
        // Amul gets everything else that isn't flour or chocolate
        const isFlour = SUPPLIER_DB["SUP-002"].categories.some(c => req.itemName.toLowerCase().includes(c.toLowerCase()));
        const isChoc = SUPPLIER_DB["SUP-003"].categories.some(c => req.itemName.toLowerCase().includes(c.toLowerCase()));
        return !isFlour && !isChoc;
      }
      return isMatch;
    });
  }, [allRequests, supplierInfo, supplierId]);

  const visibleRequests = myRequests.filter(r => r.status === activeTab);
  
  // Sort pending by urgency (timeTarget of the order it belongs to)
  const sortedRequests = [...visibleRequests].sort((a, b) => 
    new Date(a.timeTarget).getTime() - new Date(b.timeTarget).getTime()
  );

  const pendingCount = myRequests.filter(r => r.status === "pending").length;
  const resolvedCount = myRequests.filter(r => r.status === "resolved").length;

  const handleFulfill = async (orderId: string, reqId: string) => {
    await updateIngredientRequestStatus(orderId, reqId, "resolved", supplierInfo.name);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24 md:pb-12 text-[#3E2723] font-sans">
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 hidden sm:block">
                <TruckFast className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-foreground flex items-center gap-2">
                  {supplierInfo.name}
                </h1>
                <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 flex gap-2">
                  <span>ID: {supplierId}</span>
                  <span>&bull;</span>
                  <span>Supplier Portal</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div className="bg-white border border-border px-4 py-2 rounded-xl flex flex-col items-center justify-center min-w-[80px] shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pending</span>
                  <span className="text-xl font-black text-rose-600"><NumberTicker value={pendingCount} /></span>
                </div>
                <div className="bg-white border border-border px-4 py-2 rounded-xl flex flex-col items-center justify-center min-w-[80px] shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Fulfilled</span>
                  <span className="text-xl font-black text-emerald-600"><NumberTicker value={resolvedCount} /></span>
                </div>
              </div>
              <button onClick={handleSignOut} className="p-3 rounded-xl bg-secondary hover:bg-rose-50 hover:text-rose-600 text-muted-foreground transition-colors border border-border">
                <Logout className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        
        {/* Tabs */}
        <div className="flex bg-secondary/50 p-1 rounded-xl w-fit mb-8 border border-border">
          <button 
            onClick={() => setActiveTab("pending")}
            className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "pending" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:bg-white/50"}`}
          >
            <BoxSearch className="w-4 h-4" /> Pending Requests
            {pendingCount > 0 && <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[10px] animate-pulse">{pendingCount}</span>}
          </button>
          <button 
            onClick={() => setActiveTab("resolved")}
            className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "resolved" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:bg-white/50"}`}
          >
            <BoxTick className="w-4 h-4" /> Fulfilled
          </button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {sortedRequests.map(req => (
              <motion.div 
                key={req.id} 
                layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl border border-border shadow-sm p-6 relative overflow-hidden group hover:shadow-lg transition-all hover:border-indigo-200"
              >
                {req.status === "pending" && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                )}
                {req.status === "resolved" && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                )}

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1 flex items-center gap-1">
                      <Box className="w-3 h-3" /> Raw Material Request
                    </p>
                    <h3 className="text-xl font-black text-foreground leading-tight">{req.itemName}</h3>
                  </div>
                  {req.priorityLevel !== "normal" && req.status === "pending" && (
                    <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      <Warning2 className="w-3 h-3" /> Urgent
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-secondary/40 rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Quantity Required</p>
                    <p className="text-lg font-black text-foreground mt-0.5">{req.qty}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Target Branch</p>
                    <p className="text-sm font-bold text-foreground mt-1 line-clamp-1">{req.branch}</p>
                  </div>
                </div>

                {req.note && (
                  <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 mb-6 relative">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Chef's Note</p>
                    <p className="text-sm font-medium text-foreground">"{req.note}"</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border border-dashed">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Requested: {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {req.status === "pending" ? (
                    <button 
                      onClick={() => handleFulfill(req.orderId, req.id)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <TickCircle className="w-4 h-4" /> Fulfill Order
                    </button>
                  ) : (
                    <div className="px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm flex items-center gap-2">
                      <TickCircle className="w-4 h-4" /> Delivered
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {sortedRequests.length === 0 && (
          <div className="text-center py-32 opacity-50 bg-white/50 rounded-3xl border-2 border-dashed border-border mt-8">
            <BoxTick className="w-16 h-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h3 className="font-serif text-2xl font-black text-foreground">No {activeTab} requests.</h3>
            <p className="text-sm font-medium mt-2 text-muted-foreground">The kitchen is fully stocked right now.</p>
          </div>
        )}

      </div>
    </div>
  );
}
