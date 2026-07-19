"use client";

import React, { useEffect, useState } from "react";
import { useOrders } from "@/context/OrderContext";
import { motion } from "framer-motion";
import { TrendUp, Bag, Award, Chart1, Location, Moneys, Wallet, PercentageSquare, ArrowRight2 } from "iconsax-react";

import { BRANCHES, toBranchId } from "@/lib/branches";
import { BackButton } from "@/components/ui/BackButton";

type BranchMetric = {
  name: string;
  id: string;
  revenue: number;
  totalOrders: number;
  completed: number;
  cashCollected: number;
  upiCollected: number;
  averageValue: number;
};

export default function AnalyticsPage() {
  const { orders } = useOrders();
  const [metrics, setMetrics] = useState<BranchMetric[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);

  useEffect(() => {
    // Process metrics branch-wise using canonical IDs
    const branchData: Record<string, BranchMetric> = {};

    BRANCHES.forEach(b => {
      branchData[b.id] = {
        name: b.displayName,
        id: b.id,
        revenue: 0,
        totalOrders: 0,
        completed: 0,
        cashCollected: 0,
        upiCollected: 0,
        averageValue: 0
      };
    });

    let overallSales = 0;
    let overallCompleted = 0;

    orders.forEach(order => {
      // Normalize to canonical ID
      const branchId = toBranchId(order.branch || 'Unknown');
      
      if (!branchData[branchId]) {
        branchData[branchId] = {
          name: order.branch || 'Unknown Branch',
          id: branchId,
          revenue: 0,
          totalOrders: 0,
          completed: 0,
          cashCollected: 0,
          upiCollected: 0,
          averageValue: 0
        };
      }
      const data = branchData[branchId];


      data.totalOrders += 1;
      
      // Calculate revenue (advancePaid + balance paid if delivered)
      let collected = order.advancePaid || 0;
      if (order.status === "DELIVERED") {
        collected += (order.pendingBalance || 0);
        data.completed += 1;
        overallCompleted += 1;
      }

      data.revenue += collected;
      overallSales += collected;

      // Classify payment methods (Mock UPI/Cash division based on order parameters for prototype)
      const isUPI = order.id.charCodeAt(order.id.length - 1) % 2 === 0;
      if (isUPI) {
        data.upiCollected += collected;
      } else {
        data.cashCollected += collected;
      }
    });

    // Finalize average calculations
    Object.values(branchData).forEach(data => {
      data.averageValue = data.totalOrders > 0 ? Math.round(data.revenue / data.totalOrders) : 0;
    });

    setMetrics(Object.values(branchData));
    setTotalSales(overallSales);
    setTotalCompleted(overallCompleted);
  }, [orders]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 font-sans">
      
      {/* Page Header */}
      <div>
        <div className="mb-4">
          <BackButton fallback="/admin" label="Back to Admin" variant="outline" size="sm" />
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight font-heading">
          Executive Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Branch performance, revenue splits, and order fulfillment tracking.
        </p>
      </div>

      {/* Global Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white border border-border rounded-3xl p-6 shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Accumulated Revenue</span>
            <span className="text-3xl font-black text-foreground mt-2 block">₹{totalSales.toLocaleString("en-IN")}</span>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendUp className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white border border-border rounded-3xl p-6 shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Fulfillment Rate</span>
            <span className="text-3xl font-black text-foreground mt-2 block">
              {orders.length > 0 ? Math.round((totalCompleted / orders.length) * 100) : 0}%
            </span>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <PercentageSquare className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white border border-border rounded-3xl p-6 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1"
        >
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Active Pipelines</span>
            <span className="text-3xl font-black text-foreground mt-2 block">{orders.length - totalCompleted} orders</span>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <Bag className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Branch Performance Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
          <Chart1 className="w-5 h-5 text-primary" /> Branch Metrics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((branch, i) => (
            <motion.div
              key={branch.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Branch Header */}
              <div className="bg-[#3E2723] p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Location className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm tracking-wide uppercase">{branch.name}</span>
                </div>
                <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full font-bold">
                  {branch.completed}/{branch.totalOrders} Done
                </span>
              </div>

              {/* Branch Body Metrics */}
              <div className="p-6 space-y-4">
                <div className="flex items-end justify-between border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Branch Revenue</span>
                    <span className="text-2xl font-black text-foreground">₹{branch.revenue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Avg Ticket Size</span>
                    <span className="text-sm font-bold text-gray-700">₹{branch.averageValue}</span>
                  </div>
                </div>

                {/* Cash vs UPI splits */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Cash Drawer</span>
                      <span className="text-xs font-bold text-gray-800">₹{branch.cashCollected.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-2.5">
                    <Moneys className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">UPI Ledger</span>
                      <span className="text-xs font-bold text-gray-800">₹{branch.upiCollected.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Fulfillment Rate</span>
                    <span>
                      {branch.totalOrders > 0 ? Math.round((branch.completed / branch.totalOrders) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${branch.totalOrders > 0 ? (branch.completed / branch.totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
