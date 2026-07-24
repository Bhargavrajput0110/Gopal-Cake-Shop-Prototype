"use client";

import React, { useState, useEffect } from "react"
import { Moneys, Bag, Clock, Warning2, DocumentDownload, Shop } from "iconsax-react"
import { BackButton } from "@/components/ui/BackButton"
import { useSession } from "next-auth/react"
import { toBranchId, toBranchShortName } from "@/lib/branches"
import { 
  AreaChart, 
  Area, 
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer 
} from "recharts"

const MetricCard = ({ title, value, icon: Icon, trend, trendLabel, destructive }: any) => (
  <div className={`p-6 rounded-[2rem] border backdrop-blur-md shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] transition-all hover:shadow-[0_16px_48px_0_rgba(74,59,53,0.12)] hover:-translate-y-1 relative overflow-hidden group ${destructive ? 'border-[var(--brand-deep-rose)]/20 bg-rose-50/80' : 'border-[var(--border)] bg-white/80'}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="font-ui text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.2em] mb-2">{title}</p>
        <h3 className={`text-4xl font-display font-black tracking-tight ${destructive ? 'text-[var(--brand-deep-rose)]' : 'text-[var(--foreground)]'}`}>
          {value}
        </h3>
      </div>
      <div className={`p-4 rounded-[1.25rem] shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 ${destructive ? 'bg-[var(--brand-deep-rose)]/10 border border-[var(--brand-deep-rose)]/20 text-[var(--brand-deep-rose)]' : 'bg-[var(--brand-champagne)]/10 border border-[var(--brand-champagne)]/20 text-[var(--brand-champagne)]'}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {trend && (
      <div className="mt-5 flex items-center font-ui text-[10px] font-bold uppercase tracking-[0.2em] relative z-10">
        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1">
          {trend}
        </span>
        <span className="text-[var(--muted-foreground)] ml-2">{trendLabel}</span>
      </div>
    )}
  </div>
)

export default function ManagerDashboard() {
  const { data: session } = useSession()
  
  const selectedBranchId = session?.user?.branchId || "khanderao"
  const selectedBranchName = toBranchShortName(selectedBranchId)

  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchKPIs = async () => {
      setLoading(true)
      try {
        const url = `/api/v1/reporting/dashboard?branchId=${selectedBranchId}`
        const res = await fetch(url)
        const data = await res.json()
        if (data.success) {
          setKpis(data.data)
          setError(null)
        } else {
          setError('Failed to fetch KPIs')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    fetchKPIs()
  }, [selectedBranchId])

  if (loading && !kpis) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-[var(--brand-champagne)] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-ui text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] animate-pulse">Loading Branch Dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100 text-center max-w-md shadow-sm">
          <Warning2 className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-rose-900 mb-2">Failed to load Dashboard</h2>
          <p className="text-rose-700/80 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors">
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  if (!kpis) return null

  const revenue = kpis.todaysSales || 0
  const totalOrders = kpis.ordersToday || 0
  const pendingOrders = kpis.pendingOrders || 0
  const kitchenDelay = kpis.lateOrdersCount || 0
  
  const trendData = kpis.revenueTrend ? kpis.revenueTrend.map((pt: any) => ({
    dateLabel: new Date(pt.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
    revenue: pt.revenue
  })) : []

  return (
    <div className="min-h-screen bg-[var(--background)] relative">
      <div className="absolute top-6 left-6 z-50 print:hidden">
        <BackButton fallback="/login" label="Logout" variant="ghost" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
      </div>
      
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
      
      <div className="relative z-10 space-y-8 p-6 md:p-10 pb-20 pt-16 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 border-b border-[var(--border)] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2 bg-white/60 w-fit pr-6 pl-2 py-2 rounded-full border border-gray-200/60 shadow-sm backdrop-blur-md">
              <div className="w-10 h-10 bg-gradient-to-tr from-amber-200 to-[var(--brand-champagne)] rounded-full flex items-center justify-center shadow-sm">
                <Shop className="w-5 h-5 text-amber-900" variant="Bold" />
              </div>
              <span className="text-3xl md:text-4xl font-black font-display tracking-tight text-gray-900 leading-none">
                {selectedBranchName} Branch
              </span>
            </div>
            <p className="font-editorial italic text-[var(--muted-foreground)] text-lg mt-2 px-2">Local Branch Command Center</p>
          </div>
          
          <div className="flex items-center gap-4 print:hidden">
            <button onClick={() => window.print()} className="px-4 py-2.5 bg-white/80 hover:bg-white text-[var(--foreground)] font-bold rounded-xl shadow-sm border border-[var(--border)] transition-all flex items-center gap-2 font-ui text-[10px] uppercase tracking-[0.2em] hover:-translate-y-0.5">
              <DocumentDownload className="w-4 h-4" /> Export PDF
            </button>
            <div className="bg-white/80 backdrop-blur-md border border-emerald-100 rounded-full px-4 py-2 shadow-sm font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              Live Mode
            </div>
          </div>
        </div>

        {/* Top Level KPIs Reusing Executive Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Revenue (Today)" 
            value={`₹${revenue.toLocaleString()}`} 
            icon={Moneys} 
            trend={kpis.revenueVsPreviousPeriod?.changePercent > 0 ? `+${kpis.revenueVsPreviousPeriod.changePercent}%` : `${kpis.revenueVsPreviousPeriod?.changePercent}%`} 
            trendLabel="vs yesterday" 
          />
          <MetricCard 
            title="Orders (Today)" 
            value={totalOrders} 
            icon={Bag} 
          />
          <MetricCard 
            title="Kitchen Delay" 
            value={kitchenDelay} 
            icon={Warning2} 
            destructive={kitchenDelay > 0} 
          />
          <MetricCard 
            title="Pending Fulfillment" 
            value={pendingOrders} 
            icon={Clock} 
          />
        </div>

        {/* Chart Section */}
        <div className="bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
          <h3 className="font-display text-2xl font-bold mb-8 text-[var(--foreground)] relative z-10">7-Day Revenue Trend</h3>
          <div className="flex-1 min-h-[400px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-champagne)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--brand-champagne)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(74,59,53,0.1)" />
                <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(74,59,53,0.6)", fontWeight: "bold" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(74,59,53,0.6)", fontWeight: "bold" }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 32px rgba(74,59,53,0.1)" }}
                  itemStyle={{ color: "#4A3B35", fontWeight: "bold", fontFamily: "var(--font-playfair)" }}
                  labelStyle={{ color: "#4A3B35", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--brand-champagne)" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
