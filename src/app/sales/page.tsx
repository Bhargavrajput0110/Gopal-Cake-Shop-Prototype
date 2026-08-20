"use client";

import { TickCircle, ExportSquare, Reserve, Receipt21, Clock } from "iconsax-react";
import { useOrders } from "@/context/OrderContext";
import { motion } from "framer-motion";
import { BackButton } from "@/components/ui/BackButton";
import { toBranchId, toBranchShortName } from "@/lib/branches";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function SalesOverviewPage() {
  const { orders } = useOrders();
  const { data: session } = useSession();

  const activeBranch = toBranchId(session?.user?.branchId || "khanderao");
  const branchOrders = orders.filter(o => toBranchId(o.branch) === activeBranch);

  const activeHandoffs = branchOrders.filter(o => ["READY_FOR_PICKUP", "PENDING_ASSIGNMENT"].includes(o.status));
  const recentCompleted = branchOrders.filter(o => ["DELIVERED", "COMPLETED"].includes(o.status)).slice(0, 5);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="max-w-4xl mx-auto space-y-10 pb-20 pt-8 px-4" variants={containerVariants} initial="hidden" animate="show">
      <div className="flex justify-between items-center">
        <BackButton fallback="/login" label="Switch Account" variant="ghost" className="text-[var(--muted-foreground)] -ml-4" />
        <div className="flex items-center gap-2 bg-[#4A3B35] text-white px-4 py-2 rounded-full">
          <span className="font-ui text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-champagne)]">
            {toBranchShortName(activeBranch)}
          </span>
        </div>
      </div>

      {/* Hero Section: New Order */}
      <motion.div variants={itemVariants} className="text-center mt-8">
        <h1 className="text-5xl font-black tracking-tight font-display text-[var(--foreground)] mb-2">
          Ready to serve?
        </h1>
        <p className="font-editorial italic text-[var(--muted-foreground)] text-lg mb-8">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Sales'}.
        </p>

        <Link href="/sales/pos" className="block w-full max-w-md mx-auto">
          <div className="bg-[var(--brand-deep-rose)] text-white rounded-[2rem] p-8 shadow-xl shadow-rose-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-4 border border-rose-400/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            <ExportSquare className="w-12 h-12" variant="Bold" />
            <h2 className="font-display font-black text-3xl">Start New Order</h2>
            <p className="font-ui text-xs font-bold uppercase tracking-[0.2em] text-rose-200">Point of Sale Terminal</p>
          </div>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        {/* Active Handoffs */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
            <h3 className="font-display text-2xl font-bold flex items-center gap-2">
              <Reserve className="w-6 h-6 text-amber-600" variant="Bold" /> Active Handoffs
            </h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-black px-2 py-1 rounded-full">{activeHandoffs.length}</span>
          </div>

          <div className="space-y-4">
            {activeHandoffs.length === 0 ? (
              <div className="p-8 text-center bg-[var(--muted)] rounded-3xl border border-[var(--border)] border-dashed">
                <p className="font-editorial italic text-[var(--muted-foreground)]">No active handoffs waiting.</p>
              </div>
            ) : (
              activeHandoffs.map(order => (
                <div key={order.id} className="p-4 bg-white border border-[var(--border)] rounded-2xl flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-ui text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">{order.orderNumber || order.id.slice(0,8)}</p>
                    <p className="font-display font-bold text-lg">{order.customerName}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    order.status === 'READY_FOR_PICKUP' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {order.status === 'READY_FOR_PICKUP' ? 'Waiting Pickup' : 'Waiting Driver'}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Sales */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
            <h3 className="font-display text-2xl font-bold flex items-center gap-2">
              <TickCircle className="w-6 h-6 text-emerald-600" variant="Bold" /> Recent Sales
            </h3>
            <Link href="/sales/orders" className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-deep-rose)] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {recentCompleted.length === 0 ? (
              <div className="p-8 text-center bg-[var(--muted)] rounded-3xl border border-[var(--border)] border-dashed">
                <p className="font-editorial italic text-[var(--muted-foreground)]">No recent sales to display.</p>
              </div>
            ) : (
              recentCompleted.map(order => (
                <div key={order.id} className="p-4 bg-white border border-[var(--border)] rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Receipt21 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-display font-bold">{order.customerName}</p>
                      <p className="font-ui text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(order.updatedAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <p className="font-display font-black text-lg">₹{order.totalAmount}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
