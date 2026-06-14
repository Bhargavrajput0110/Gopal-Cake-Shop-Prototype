"use client";

import { TaskSquare, Clock, Reserve, BoxTick, TickCircle, WalletMoney, Danger, ArrowSwapHorizontal, TruckFast } from "iconsax-react";
import { useOrders } from "@/context/OrderContext";
import { motion } from "framer-motion";
import NumberTicker from "@/components/magicui/NumberTicker";
import { Meteors } from "@/components/aceternity/Meteors";

export default function SalesOverviewPage() {
  const { orders } = useOrders();

  // Compute live KPIs from Global State
  const delayedOrders = orders.filter(o => o.delayLevel === "delayed").length;
  const pendingVerification = orders.filter(o => o.status === "new").length;
  const kitchenSOS = orders.filter(o => o.delayLevel === "warning").length;

  const pendingOrders = orders.filter(o => ["new", "accepted_by_chef"].includes(o.status)).length;
  const inProduction = orders.filter(o => ["preparing", "decorating"].includes(o.status)).length;
  const readyOrders = orders.filter(o => o.status === "ready_for_pickup").length;
  const pendingDelivery = orders.filter(o => ["pending_assignment", "assigned_to_driver", "picked_up_by_driver", "on_the_way"].includes(o.status)).length;
  const unassignedDeliveries = orders.filter(o => o.status === "pending_assignment").length;
  const completedOrders = orders.filter(o => o.status === "delivered").length;
  
  // Financials
  const ordersToday = orders.length;
  const revenueToday = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const advancePaid = orders.reduce((acc, o) => acc + o.advancePaid, 0);
  const pendingCODSettlements = orders.filter(o => ["assigned_to_driver", "picked_up_by_driver", "on_the_way", "delivered"].includes(o.status)).reduce((acc, o) => acc + o.pendingBalance, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
  };

  return (
    <motion.div 
      className="space-y-10 pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-end relative overflow-hidden rounded-3xl bg-[#3E2723] p-8 text-white shadow-2xl">
        <Meteors number={30} />
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tight font-serif drop-shadow-sm text-[#FAFAF8]">Command Center</h2>
          <p className="text-white/70 text-sm mt-1 tracking-wide font-bold">Real-time status of all daily operations.</p>
        </div>
        <button className="uiverse-button">
          Generate Daily Report
        </button>
      </motion.div>

      {/* Escalation & Delays (Top Priority) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`uiverse-card rounded-3xl p-6 ${delayedOrders > 0 ? "cyber-brutal-alert" : ""}`}>
          <div className="relative z-10 flex items-center justify-between mb-2">
            <h3 className={`text-[12px] font-black uppercase tracking-widest flex items-center gap-2 ${delayedOrders > 0 ? "text-rose-600" : "text-muted-foreground"}`}>
              <Danger className="w-6 h-6" variant="Bold" /> Delayed Orders
            </h3>
            <span className={`text-5xl font-black drop-shadow-sm ${delayedOrders > 0 ? "text-rose-600" : "text-muted-foreground"}`}>{delayedOrders}</span>
          </div>
          <p className={`text-[12px] font-bold relative z-10 ${delayedOrders > 0 ? "text-rose-600/80" : "text-muted-foreground/60"}`}>Immediate attention required! SLA breached.</p>
        </div>

        <div className="uiverse-card rounded-3xl p-6 border-[#C5A059]/40">
          <div className="relative z-10 flex items-center justify-between mb-2">
            <h3 className="text-[12px] font-black text-[#C5A059] uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-6 h-6" variant="Bold" /> Pending Verification
            </h3>
            <span className="text-5xl font-black text-[#C5A059] drop-shadow-sm">{pendingVerification}</span>
          </div>
          <p className="text-[12px] font-bold text-[#C5A059]/80 relative z-10">Orders waiting for your review.</p>
        </div>

        <div className={`uiverse-card rounded-3xl p-6 ${kitchenSOS > 0 ? "cyber-brutal-sos" : ""}`}>
          <div className="relative z-10 flex items-center justify-between mb-2">
            <h3 className={`text-[12px] font-black uppercase tracking-widest flex items-center gap-2 ${kitchenSOS > 0 ? "text-rose-700" : "text-muted-foreground"}`}>
              <Danger className="w-6 h-6" variant="Bold" /> Kitchen SOS
            </h3>
            <span className={`text-5xl font-black drop-shadow-sm ${kitchenSOS > 0 ? "text-rose-700" : "text-muted-foreground"}`}>{kitchenSOS}</span>
          </div>
          <p className={`text-[12px] font-bold relative z-10 ${kitchenSOS > 0 ? "text-rose-700/80" : "text-muted-foreground/60"}`}>Ingredient shortage reported by Chef.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-sm font-black text-[#3E2723] uppercase tracking-widest border-b-2 border-border/60 pb-2 mb-4">Operational Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          <KPICard title="Pending Orders" value={pendingOrders} icon={<Clock className="w-6 h-6 text-[#C5A059]" variant="Bold" />} />
          <KPICard title="In Production" value={inProduction} icon={<Reserve className="w-6 h-6 text-[#3E2723]" variant="Bold" />} />
          <KPICard title="Ready Orders" value={readyOrders} icon={<BoxTick className="w-6 h-6 text-[#8D6E63]" variant="Bold" />} />
          <KPICard title="Ready for Delivery" value={readyOrders} icon={<BoxTick className="w-6 h-6 text-[#3E2723]" variant="Bold" />} />
          <KPICard title="Pending Delivery" value={pendingDelivery} icon={<TruckFast className="w-6 h-6 text-[#5D4037]" variant="Bold" />} />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-sm font-black text-[#3E2723] uppercase tracking-widest border-b-2 border-border/60 pb-2 mb-4">Logistics, Exceptions & Transfers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className={`uiverse-card rounded-3xl p-5 flex flex-col justify-between h-32 ${unassignedDeliveries > 0 ? "cyber-brutal-alert" : ""}`}>
            <div className="flex justify-between items-start">
              <h3 className={`text-[11px] font-black uppercase tracking-widest pr-2 leading-tight ${unassignedDeliveries > 0 ? "text-rose-600" : "text-muted-foreground"}`}>Unassigned Deliveries</h3>
              <div className="p-2 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-white/50 shadow-sm">
                <Danger className={`w-6 h-6 ${unassignedDeliveries > 0 ? "text-rose-600" : "text-muted-foreground"}`} variant="Bold" />
              </div>
            </div>
            <p className={`text-4xl font-serif font-black mt-2 drop-shadow-sm ${unassignedDeliveries > 0 ? "text-rose-700" : "text-[#3E2723]"}`}>{unassignedDeliveries}</p>
          </div>
          <KPICard title="Pending Handshakes" value={0} icon={<ArrowSwapHorizontal className="w-6 h-6 text-[#C5A059]" variant="Bold" />} />
          <KPICard title="Pending Vendor Items" value={0} icon={<BoxTick className="w-6 h-6 text-[#8D6E63]" variant="Bold" />} />
          <KPICard title="Completed Orders" value={completedOrders} icon={<TickCircle className="w-6 h-6 text-[#3E2723]" variant="Bold" />} />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-sm font-black text-[#3E2723] uppercase tracking-widest border-b-2 border-border/60 pb-2 mb-4">Khanderao Branch Financials</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <FinancialCard title="Orders Today" value={ordersToday} icon={<TaskSquare className="w-8 h-8 icon-gradient" variant="Bold" />} />
          <FinancialCard title="Revenue Today" value={revenueToday} icon={<WalletMoney className="w-8 h-8 icon-gradient" variant="Bold" />} color="text-[#C5A059]" />
          <FinancialCard title="Advance Paid" value={advancePaid} icon={<WalletMoney className="w-8 h-8 icon-gradient" variant="Bold" />} />
          <FinancialCard title="Pending COD" value={pendingCODSettlements} icon={<WalletMoney className="w-8 h-8 text-rose-600" variant="Bold" />} color="text-rose-700" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function KPICard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="relative uiverse-card rounded-3xl p-5 flex flex-col justify-between h-32 group overflow-hidden border border-white/50 hover:border-[#C5A059] transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-[#C5A059]/10">
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10 flex justify-between items-start">
        <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pr-2 leading-tight group-hover:text-[#3E2723] transition-colors">{title}</h3>
        <div className="p-2 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-white/50 shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
          {icon}
        </div>
      </div>
      <div className="relative z-10 text-4xl font-serif font-black text-[#3E2723] mt-2 drop-shadow-sm group-hover:text-[#C5A059] transition-colors">
        <NumberTicker value={value} />
      </div>
    </div>
  );
}

function FinancialCard({ title, value, icon, color = "text-[#3E2723]" }: { title: string, value: number, icon: React.ReactNode, color?: string }) {
  return (
    <div className="relative uiverse-card rounded-3xl p-6 flex items-center justify-between group overflow-hidden border border-white/50 hover:border-[#C5A059] transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-[#C5A059]/10">
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 group-hover:text-[#3E2723] transition-colors">{title}</h3>
        <div className={`text-3xl font-serif font-black ${color} drop-shadow-sm group-hover:scale-105 transform origin-left transition-transform duration-500 flex items-center`}>
          {title !== "Orders Today" && <span className="mr-1">₹</span>}
          <NumberTicker value={value} />
        </div>
      </div>
      <div className="relative z-10 p-3 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-white/50 shadow-sm group-hover:rotate-12 transition-transform duration-500">
        {icon}
      </div>
    </div>
  );
}
