"use client";

import { Clock, TruckFast, Danger, TickCircle, TaskSquare, Reserve, Flash, Box, Message, ExportSquare, ArrowLeft, User } from "iconsax-react";
import { useOrders } from "@/context/OrderContext";
import { motion } from "framer-motion";
import { BackButton } from "@/components/ui/BackButton";
import NumberTicker from "@/components/magicui/NumberTicker";
import { toBranchId, BRANCHES, BranchId, toBranchShortName } from "@/lib/branches";
import { useState } from "react";

export default function SalesOverviewPage() {
  const { orders, updateIngredientRequestStatus } = useOrders();

  const [activeBranch, setActiveBranch] = useState<BranchId>("khanderao");
  const branchOrders = orders.filter(o => toBranchId(o.branch) === activeBranch);

  const pendingVerification = branchOrders.filter(o => o.status === "NEW").length;
  const waitingForChef = branchOrders.filter(o => o.status === "WAITING_FOR_CHEF").length;
  const delayedOrders = branchOrders.filter(o => o.delayLevel === "delayed").length;
  const inProduction = branchOrders.filter(o => ["MAKING","DECORATING"].includes(o.status)).length;
  const readyOrders = branchOrders.filter(o => o.status === "READY_FOR_PICKUP").length;
  const deliveryPool = branchOrders.filter(o => o.status === "PENDING_ASSIGNMENT").length;
  const activeDeliveries = branchOrders.filter(o => ["PICKED_UP","ON_THE_WAY"].includes(o.status)).length;
  const completedOrders = branchOrders.filter(o => o.status === "DELIVERED").length;
  const ingredientRequests = branchOrders.reduce((acc,o) => acc + (o.ingredientRequests?.filter(r=>r.status==="pending").length || 0), 0);
  const ordersToday = branchOrders.length;
  const unassignedDeliveries = branchOrders.filter(o => o.status === "PENDING_ASSIGNMENT").length;
  const unreadVendorNotes = branchOrders.reduce((acc, order) => {
    return acc + (order.vendorTasks?.reduce((taskAcc, task) => {
      return taskAcc + (task.notes?.filter(n => !n.read).length || 0);
    }, 0) || 0);
  }, 0);


  const containerVariants = { hidden:{opacity:0}, show:{opacity:1,transition:{staggerChildren:0.08}} };
  const itemVariants: import("framer-motion").Variants = { hidden:{opacity:0,y:20}, show:{opacity:1,y:0,transition:{type:"spring",stiffness:200,damping:20}} };

  return (
    <motion.div className="space-y-12 pb-20 pt-8 relative" variants={containerVariants} initial="hidden" animate="show">
      
      <div className="absolute top-2 left-0 z-50">
        <BackButton fallback="/login" label="Switch Account" variant="ghost" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
      </div>

      {/* Editorial Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border)] pb-8 pt-8">
        <div>
          <div className="flex items-center gap-1 bg-[#4A3B35] text-white px-3 py-1.5 rounded-[1rem] w-fit mb-4">
            <span className="font-ui text-[9px] font-black uppercase tracking-[0.2em] text-[var(--brand-champagne)] border-r border-[var(--brand-champagne)]/30 pr-2">MOCK LOGIN</span>
            <select 
              value={activeBranch} 
              onChange={(e) => setActiveBranch(e.target.value as BranchId)}
              className="bg-transparent font-ui text-[9px] font-black uppercase tracking-[0.2em] focus:outline-none cursor-pointer pl-2 text-white"
            >
              {BRANCHES.map(b => (
                <option key={b.id} value={b.id} className="text-[#4A3B35]">{b.shortName} Branch</option>
              ))}
            </select>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display text-[var(--foreground)] leading-[1.1]">Sales Overview</h2>
          <p className="font-editorial italic text-[var(--muted-foreground)] text-lg mt-2">Real-time operational status of your artisan branch.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button className="px-6 py-3 bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--muted-foreground)] rounded-full font-ui text-[10px] uppercase tracking-[0.2em] font-bold transition-colors border border-[var(--border)]">
            Daily Report
          </button>
          <a href="/sales/pos" className="px-6 py-3 btn-primary rounded-full font-ui text-[10px] uppercase tracking-[0.2em] font-bold shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2">
            Launch POS <ExportSquare className="w-4 h-4" />
          </a>
        </div>
      </motion.div>

      {/* Priority Alerts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className={`rounded-[2.5rem] p-6 border transition-all duration-300 ${delayedOrders > 0 ? "bg-rose-50/80 border-[var(--brand-deep-rose)]/20 shadow-[0_8px_32px_0_rgba(139,58,82,0.1)]" : "bg-white/40 backdrop-blur-md border-[var(--border)] shadow-[0_8px_32px_0_rgba(74,59,53,0.05)]"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-ui text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${delayedOrders > 0 ? "text-[var(--brand-deep-rose)]" : "text-[var(--muted-foreground)]"}`}>
              <Danger className="w-5 h-5" variant="Bold" /> Delayed
            </h3>
            <span className={`text-4xl font-display font-black ${delayedOrders > 0 ? "text-[var(--brand-deep-rose)]" : "text-[var(--foreground)]"}`}>{delayedOrders}</span>
          </div>
          <p className={`font-editorial italic text-sm ${delayedOrders > 0 ? "text-[var(--brand-deep-rose)]/80" : "text-[var(--muted-foreground)]"}`}>Immediate attention required.</p>
        </div>

        <div className="rounded-[2.5rem] p-6 border bg-[var(--brand-champagne)]/10 border-[var(--brand-champagne)]/30 shadow-[0_8px_32px_0_rgba(200,169,126,0.15)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-[var(--brand-champagne)]">
              <Clock className="w-5 h-5" variant="Bold" /> Unverified
            </h3>
            <span className="text-4xl font-display font-black text-[var(--brand-champagne)]">{pendingVerification}</span>
          </div>
          <p className="font-editorial italic text-sm text-[var(--brand-champagne)]/80">New online orders awaiting approval.</p>
        </div>

        <div className={`rounded-[2.5rem] p-6 border transition-all duration-300 ${ingredientRequests > 0 ? "bg-amber-50/80 border-amber-200 shadow-[0_8px_32px_0_rgba(245,158,11,0.1)]" : "bg-white/40 backdrop-blur-md border-[var(--border)] shadow-[0_8px_32px_0_rgba(74,59,53,0.05)]"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-ui text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${ingredientRequests > 0 ? "text-amber-700" : "text-[var(--muted-foreground)]"}`}>
              <Box className="w-5 h-5" /> Ingredients
            </h3>
            <span className={`text-4xl font-display font-black ${ingredientRequests > 0 ? "text-amber-700" : "text-[var(--foreground)]"}`}>{ingredientRequests}</span>
          </div>
          <p className={`font-editorial italic text-sm ${ingredientRequests > 0 ? "text-amber-700/80" : "text-[var(--muted-foreground)]"}`}>Pending requests from kitchen.</p>
        </div>

        <div className={`rounded-[2.5rem] p-6 border transition-all duration-300 ${unreadVendorNotes > 0 ? "bg-blue-50/80 border-blue-200 shadow-[0_8px_32px_0_rgba(59,130,246,0.1)]" : "bg-white/40 backdrop-blur-md border-[var(--border)] shadow-[0_8px_32px_0_rgba(74,59,53,0.05)]"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-ui text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${unreadVendorNotes > 0 ? "text-blue-700" : "text-[var(--muted-foreground)]"}`}>
              <Message className="w-5 h-5" /> Vendor Notes
            </h3>
            <span className={`text-4xl font-display font-black ${unreadVendorNotes > 0 ? "text-blue-700" : "text-[var(--foreground)]"}`}>{unreadVendorNotes}</span>
          </div>
          <p className={`font-editorial italic text-sm ${unreadVendorNotes > 0 ? "text-blue-700/80" : "text-[var(--muted-foreground)]"}`}>Unread messages from partners.</p>
        </div>
      </motion.div>

      {/* Ingredient Request Panel */}
      {ingredientRequests > 0 && (
        <motion.div variants={itemVariants} className="bg-amber-50/50 border border-amber-200/60 rounded-[2.5rem] p-8 mt-8">
          <h3 className="font-display text-2xl font-bold text-amber-900 border-b border-amber-200 pb-4 mb-6 flex items-center gap-3">
            <Box className="w-6 h-6 text-amber-600" /> Active Ingredient Requests
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {branchOrders.map(order => 
              order.ingredientRequests?.filter(r => r.status === "pending").map((req, idx) => (
                <div key={`${order.id}-${idx}`} className="bg-white/80 rounded-[2rem] p-6 shadow-sm border border-amber-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-ui text-[9px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-[0.2em]">{order.id}</span>
                      <span className="font-ui text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-[0.2em]">{new Date(req.timestamp || Date.now()).toLocaleTimeString()}</span>
                    </div>
                    <p className="font-display font-black text-2xl text-[var(--foreground)] mb-2">{req.itemName}</p>
                    {(req as any).note && <p className="font-editorial italic text-[var(--muted-foreground)] text-sm border-l-2 border-amber-200 pl-4 py-1">{(req as any).note}</p>}
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={() => updateIngredientRequestStatus(order.id, req.id, "fulfilled")}
                      className="px-6 py-3 font-ui text-[9px] font-bold uppercase tracking-[0.2em] text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-full transition-colors"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Kitchen Pipeline */}
      <motion.div variants={itemVariants} className="mt-12">
        <h3 className="font-display text-2xl font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-4 mb-6">Kitchen Pipeline</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <KPICard title="Waiting for Chef" value={waitingForChef} icon={<Reserve className="w-6 h-6 text-[var(--brand-champagne)]" />} highlight={waitingForChef>0} />
          <KPICard title="In Production" value={inProduction} icon={<Flash className="w-6 h-6 text-orange-500" />} />
          <KPICard title="Ready for Pickup" value={readyOrders} icon={<TickCircle className="w-6 h-6 text-emerald-600" />} />
          <KPICard title="Orders Today" value={ordersToday} icon={<TaskSquare className="w-6 h-6 text-[var(--muted-foreground)]" />} />
        </div>
      </motion.div>

      {/* Logistics */}
      <motion.div variants={itemVariants} className="mt-12">
        <h3 className="font-display text-2xl font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-4 mb-6">Logistics & Delivery</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`rounded-[2.5rem] p-6 border flex flex-col justify-between h-44 transition-all duration-300 ${unassignedDeliveries > 0 ? "bg-rose-50/80 border-[var(--brand-deep-rose)]/20 shadow-[0_8px_32px_0_rgba(139,58,82,0.1)]" : "bg-white/40 backdrop-blur-md border-[var(--border)] shadow-[0_8px_32px_0_rgba(74,59,53,0.05)]"}`}>
            <div className="flex justify-between items-start">
              <h3 className={`font-ui text-[10px] font-bold uppercase tracking-[0.2em] ${unassignedDeliveries > 0 ? "text-[var(--brand-deep-rose)]" : "text-[var(--muted-foreground)]"}`}>Delivery Pool</h3>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Danger className={`w-5 h-5 ${unassignedDeliveries > 0 ? "text-[var(--brand-deep-rose)]" : "text-[var(--muted-foreground)]"}`} variant="Bold" />
              </div>
            </div>
            <p className={`text-5xl font-display font-black drop-shadow-sm ${unassignedDeliveries > 0 ? "text-[var(--brand-deep-rose)]" : "text-[var(--foreground)]"}`}>{deliveryPool}</p>
          </div>
          <KPICard title="Active Deliveries" value={activeDeliveries} icon={<TruckFast className="w-6 h-6 text-[var(--muted-foreground)]" />} />
          <KPICard title="Unread Notes" value={unreadVendorNotes} icon={<Message className="w-6 h-6 text-[var(--brand-champagne)]" />} />
          <KPICard title="Completed Today" value={completedOrders} icon={<TickCircle className="w-6 h-6 text-[var(--muted-foreground)]" />} />
        </div>
      </motion.div>

    </motion.div>
  );
}

function KPICard({ title, value, icon, highlight=false }: { title: string; value: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`relative rounded-[2.5rem] p-6 flex flex-col justify-between h-44 group overflow-hidden border transition-all duration-500 bg-white/40 backdrop-blur-md shadow-[0_8px_32px_0_rgba(74,59,53,0.02)] hover:shadow-[0_16px_48px_0_rgba(74,59,53,0.08)] ${highlight ? "border-[var(--brand-champagne)]/40 bg-[var(--brand-champagne)]/10" : "border-[var(--border)] hover:border-[var(--brand-champagne)]/30"}`}>
      <div className="relative z-10 flex justify-between items-start">
        <h3 className="font-ui text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.2em] pr-2 leading-tight group-hover:text-[var(--foreground)] transition-colors">{title}</h3>
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">{icon}</div>
      </div>
      <div className="relative z-10 text-5xl font-display font-black text-[var(--foreground)] drop-shadow-sm group-hover:text-[var(--brand-champagne)] transition-colors">
        <NumberTicker value={value} />
      </div>
    </div>
  );
}
