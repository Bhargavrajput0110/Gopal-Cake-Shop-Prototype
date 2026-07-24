"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendUp, Bag, Award, Chart1, Location, Moneys, Wallet, PercentageSquare, ArrowRight2, Box, Chart, ShoppingCart, UserTag, ReceiptItem, Activity } from "iconsax-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts"

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
  topItem: string;
};

const COLORS = ['var(--brand-champagne)', '#059669', '#3E2723', '#F59E0B', '#3B82F6'];

export default function AnalyticsPage() {
  const [activeBranchFilter, setActiveBranchFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const url = activeBranchFilter === 'All' 
          ? '/api/v1/admin/analytics' 
          : `/api/v1/admin/analytics?branchId=${encodeURIComponent(BRANCHES.find(b => b.displayName === activeBranchFilter)?.id || '')}`;
        
        const res = await fetch(url);
        const json = await res.json();
        
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [activeBranchFilter]);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 max-w-md text-center">
          <p className="font-bold mb-2">Error loading analytics</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { kpis, liveOrders, pendingBalances } = data;
  const trendData = kpis?.revenueTrend?.length ? kpis.revenueTrend : [
    { date: 'Mon', revenue: 0 }, { date: 'Tue', revenue: 0 }, { date: 'Wed', revenue: 0 }
  ];

  // We map branch rankings if any
  const branchMetrics = kpis?.branchRanking || [];
  
  // Create mock sourceData for now, as DB doesn't track this perfectly yet
  const sourceData = [
    { name: 'Website', value: 45 },
    { name: 'In-Store POS', value: 30 },
    { name: 'WhatsApp', value: 15 },
    { name: 'Zomato/Swiggy', value: 10 },
  ];

  const topProducts = kpis?.topProducts || [];

  const filteredLiveOrders = liveOrders || [];
  const filteredPendingBalances = pendingBalances || [];
  
  const totalSales = kpis?.todaysSales || 0;
  const totalOrders = kpis?.ordersToday || 0;
  const completionRate = totalOrders > 0 ? Math.round(((totalOrders - kpis?.pendingOrders) / totalOrders) * 100) : 100;
  const avgOrderValue = kpis?.averageOrderValue || 0;

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 font-sans bg-[var(--background)] min-h-screen">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border)] pb-6">
        <div>
          <div className="mb-4">
            <BackButton fallback="/admin" label="Back to Admin" variant="outline" size="sm" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-[var(--foreground)] leading-none">
            Detailed Analytics
          </h1>
          <p className="font-editorial italic text-[var(--muted-foreground)] text-lg mt-2">
            Deep dive into revenue, sales channels, and product performance.
          </p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white border border-border px-4 py-2 rounded-xl text-sm font-bold font-ui uppercase tracking-wider shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 Days</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* Global Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -4 }} className="bg-white border border-border rounded-[2rem] p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-champagne)]/10 to-transparent"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Total Revenue</span>
              <span className="text-3xl font-black font-display text-foreground block">₹{totalSales.toLocaleString("en-IN")}</span>
            </div>
            <div className="p-3 bg-[var(--brand-champagne)]/20 text-[var(--brand-champagne)] rounded-2xl">
              <TrendUp className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white border border-border rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Fulfillment</span>
              <span className="text-3xl font-black font-display text-foreground block">
                {completionRate}%
              </span>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <PercentageSquare className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white border border-border rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Total Orders</span>
              <span className="text-3xl font-black font-display text-foreground block">{totalOrders}</span>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <Bag className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-[var(--foreground)] border border-[var(--foreground)] rounded-[2rem] p-6 shadow-lg relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Avg Ticket Size</span>
              <span className="text-3xl font-black font-display text-white block">₹{avgOrderValue.toLocaleString("en-IN")}</span>
            </div>
            <div className="p-3 bg-white/20 text-white rounded-2xl">
              <Moneys className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Revenue Trend */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="font-display text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <Chart className="w-6 h-6 text-primary" /> Today's Sales Trajectory
            </h3>
          </div>
          <div className="flex-1 min-h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-champagne)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--brand-champagne)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(74,59,53,0.1)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "rgba(74,59,53,0.6)", fontWeight: "bold" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "rgba(74,59,53,0.6)", fontWeight: "bold" }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 32px rgba(74,59,53,0.1)" }}
                  itemStyle={{ color: "#4A3B35", fontWeight: "bold", fontFamily: "var(--font-playfair)", fontSize: "16px" }}
                  labelStyle={{ color: "#4A3B35", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--brand-champagne)" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Sources (Pie Chart) */}
        <div className="bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col relative overflow-hidden group">
          <h3 className="font-display text-2xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" /> Sales Channels
          </h3>
          <div className="flex-1 relative z-10 flex flex-col items-center justify-center min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", fontWeight: "bold" }}
                  itemStyle={{ color: "#4A3B35" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {sourceData.map((src, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <div>
                  <p className="text-[10px] font-ui uppercase font-bold text-gray-500 tracking-wider">{src.name}</p>
                  <p className="text-sm font-black font-display">{src.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Products Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border p-8 shadow-sm">
           <h3 className="font-display text-2xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" /> Best Selling Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Product Name</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Units Sold</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Revenue</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Growth</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 font-bold">No product data available</td>
                  </tr>
                ) : topProducts.map((product: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-sm text-[var(--foreground)]">{product.productName}</td>
                    <td className="py-4 px-4 font-black font-display text-right">{product.count}</td>
                    <td className="py-4 px-4 font-bold text-sm text-right">₹{product.revenue.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-[10px] font-bold px-2 py-1 rounded border bg-emerald-50 text-emerald-600 border-emerald-100">
                        Top
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Demographics or Retention */}
        <div className="bg-[var(--brand-deep-rose)]/5 border border-[var(--brand-deep-rose)]/10 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center">
          <h3 className="font-display text-2xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <UserTag className="w-6 h-6 text-[var(--brand-deep-rose)]" /> Customer Retention
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Returning Customers</span>
                <span className="text-2xl font-black font-display text-[var(--brand-deep-rose)]">68%</span>
              </div>
              <div className="w-full bg-[var(--brand-deep-rose)]/10 h-3 rounded-full overflow-hidden">
                <div className="bg-[var(--brand-deep-rose)] h-full rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Walk-ins</span>
                <span className="text-2xl font-black font-display text-primary">32%</span>
              </div>
              <div className="w-full bg-primary/10 h-3 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--brand-deep-rose)]/10 mt-6">
              <p className="text-sm italic font-editorial text-[var(--foreground)] leading-relaxed">
                "Customer loyalty is extremely strong at Khanderao branch, with 85% returning customers this month."
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Branch Performance Section */}
      <div className="space-y-6 pt-6">
        <h2 className="text-2xl font-black text-foreground font-display tracking-tight flex items-center gap-2">
          <Location className="w-6 h-6 text-primary" /> Branch-wise Breakdown
        </h2>
        
        {branchMetrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {branchMetrics.map((branch: any, i: number) => (
              <motion.div
                key={branch.branchId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[2rem] border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all group"
              >
                {/* Branch Header */}
                <div className="bg-[#3E2723] p-5 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <Location className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm tracking-wide uppercase font-ui">{branch.branchName}</span>
                  </div>
                </div>

                {/* Branch Body Metrics */}
                <div className="p-6 space-y-5">
                  <div className="flex items-end justify-between border-b border-gray-100 pb-5">
                    <div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block mb-1">Branch Revenue</span>
                      <span className="text-2xl font-black font-display text-foreground">₹{branch.revenue.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Live Orders & Pending Balances Section */}
      <div className="space-y-6 pt-6 border-t border-[var(--border)] mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-black text-foreground font-display tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Live Operations & Accounts
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full md:w-auto">
            {['All', 'Khanderao', 'Uma', 'Warasiya', 'Ellora'].map(branch => (
              <button
                key={branch}
                onClick={() => setActiveBranchFilter(branch)}
                className={`px-4 py-2 rounded-full font-ui text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeBranchFilter === branch 
                    ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md' 
                    : 'bg-white border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Orders List */}
          <div className="bg-white rounded-[2rem] border border-border p-6 sm:p-8 shadow-sm">
            <h3 className="font-display text-xl font-bold text-[var(--foreground)] mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2"><Bag className="w-5 h-5 text-emerald-600" /> Active Orders</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">{filteredLiveOrders.length} Live</span>
            </h3>
            
            <div className="space-y-3">
              {filteredLiveOrders.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 border border-dashed rounded-xl">
                  <p className="text-gray-500 font-bold text-sm">No live orders for this branch.</p>
                </div>
              ) : (
                filteredLiveOrders.map((order: any) => (
                  <div key={order.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--brand-champagne)]">{order.id}</span>
                        <span className="text-[9px] font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200">{order.branch}</span>
                        {order.type === 'Wholesale' && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 uppercase">Bulk</span>}
                      </div>
                      <h4 className="font-bold text-sm text-foreground">{order.customer}</h4>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-1
                        ${order.status === 'NEW' ? 'bg-blue-100 text-blue-700' : ''}
                        ${order.status === 'MAKING' ? 'bg-amber-100 text-amber-700' : ''}
                        ${order.status === 'READY' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${order.status === 'DISPATCHED' ? 'bg-purple-100 text-purple-700' : ''}
                      `}>
                        {order.status}
                      </span>
                      <span className="text-xs font-black text-gray-700">₹{order.amount.toLocaleString()} <span className="font-normal text-gray-400 text-[10px] ml-1">{order.time}</span></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Balances List (Bulk/Retailers) */}
          <div className="bg-rose-50/50 rounded-[2rem] border border-rose-100 p-6 sm:p-8 shadow-sm">
            <h3 className="font-display text-xl font-bold text-[var(--foreground)] mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2"><ReceiptItem className="w-5 h-5 text-rose-600" /> Pending Accounts (Delivered)</span>
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                ₹{filteredPendingBalances.reduce((acc: number, curr: any) => acc + curr.pending, 0).toLocaleString()} Due
              </span>
            </h3>

            <div className="space-y-3">
              {filteredPendingBalances.length === 0 ? (
                <div className="text-center p-8 bg-white border border-dashed border-rose-200 rounded-xl">
                  <p className="text-rose-500 font-bold text-sm">No pending balances for this branch.</p>
                </div>
              ) : (
                filteredPendingBalances.map((bal: any) => (
                  <div key={bal.id} className="p-4 rounded-xl border border-rose-100 bg-white hover:shadow-md hover:border-rose-300 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                          {bal.customer} 
                          <span className="font-ui text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100">{bal.branch}</span>
                        </h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Order {bal.id} • Delivered: {bal.deliveredOn}</p>
                      </div>
                      <button className="bg-rose-600 hover:bg-rose-700 text-white font-ui text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors">
                        Collect
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                      <div>
                        <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total</span>
                        <span className="text-xs font-black text-gray-700">₹{bal.total.toLocaleString()}</span>
                      </div>
                      <div className="border-l border-gray-200">
                        <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Paid</span>
                        <span className="text-xs font-black text-emerald-600">₹{bal.paid.toLocaleString()}</span>
                      </div>
                      <div className="border-l border-rose-200 bg-rose-50/50 rounded-r">
                        <span className="block text-[9px] font-bold text-rose-600 uppercase tracking-wider">Pending</span>
                        <span className="text-xs font-black text-rose-600">₹{bal.pending.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
