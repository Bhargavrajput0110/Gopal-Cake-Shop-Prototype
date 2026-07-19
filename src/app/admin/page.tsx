'use client'

import React, { useMemo, useState, useEffect } from "react"
import { Moneys, Bag, Clock, Warning2, Box, TruckFast, Timer, Reserve, CloseCircle, RefreshLeftSquare, TrendUp, Location, TickCircle, Data, Cpu, DocumentDownload, Shop, Activity, BoxRemove, Star, Messages2 } from "iconsax-react"
import { BackButton } from "@/components/ui/BackButton"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  CartesianGrid 
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
          <TrendUp className="w-3 h-3" /> {trend}
        </span>
        <span className="text-[var(--muted-foreground)] ml-2">{trendLabel}</span>
      </div>
    )}
  </div>
)

const ServerMetricsWidget = () => {
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    const fetchMetrics = () => {
      fetch('/api/admin/metrics')
        .then(res => res.json())
        .then(data => {
          if (data.success) setMetrics(data.data)
        })
        .catch(console.error)
    }
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!metrics) return null

  return (
    <div className="bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col gap-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
      <h3 className="font-display text-2xl font-bold text-[var(--foreground)] flex items-center gap-2 relative z-10">
        <Data className="w-6 h-6 text-[var(--brand-champagne)]" /> System Health
      </h3>
      
      <div className="space-y-4 relative z-10">
        <div>
          <div className="flex justify-between items-end mb-2">
            <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] flex items-center gap-1">
              <TrendUp className="w-3 h-3" /> CPU Load
            </p>
            <p className="font-display font-bold text-sm">{metrics.cpuLoadPercent}%</p>
          </div>
          <div className="w-full bg-[var(--muted)] rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${metrics.cpuLoadPercent > 80 ? 'bg-[var(--brand-deep-rose)]' : 'bg-[var(--brand-champagne)]'}`} 
              style={{ width: `${metrics.cpuLoadPercent}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Memory ({metrics.usedMemGb}GB / {metrics.totalMemGb}GB)
            </p>
            <p className="font-display font-bold text-sm">{metrics.memUsagePercent}%</p>
          </div>
          <div className="w-full bg-[var(--muted)] rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${Number(metrics.memUsagePercent) > 85 ? 'bg-[var(--brand-deep-rose)]' : 'bg-[var(--brand-champagne)]'}`} 
              style={{ width: `${metrics.memUsagePercent}%` }}
            ></div>
          </div>
        </div>
        
        <div className="pt-2">
          <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Server Uptime</p>
          <p className="font-display font-bold text-lg text-[var(--foreground)]">{metrics.uptimeHours} hours</p>
        </div>
      </div>
    </div>
  )
}

const LiveFeed = () => {
  const events = [
    { id: 1, time: "Just now", text: "Order #1204 Delivered by Rajesh", type: "success" },
    { id: 2, time: "2 mins ago", text: "Kitchen delay reported at MG Road Branch", type: "warning" },
    { id: 3, time: "5 mins ago", text: "New bulk order (₹12,400) received", type: "info" },
    { id: 4, time: "12 mins ago", text: "Driver re-assigned for Order #1198", type: "default" },
    { id: 5, time: "15 mins ago", text: "Chocolate Truffle (1kg) restocked", type: "success" },
  ]
  
  const getColors = (type: string) => {
    switch(type) {
      case 'success': return 'text-emerald-600 bg-emerald-50 border-emerald-100'
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-100'
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-100'
      default: return 'text-[var(--muted-foreground)] bg-[var(--muted)] border-[var(--border)]'
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col gap-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
      <div className="flex justify-between items-center relative z-10">
        <h3 className="font-display text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <Activity className="w-6 h-6 text-[var(--brand-champagne)]" /> Live Operations
        </h3>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-ui font-bold uppercase tracking-wider text-emerald-700">Live</span>
        </div>
      </div>
      
      <div className="space-y-4 relative z-10 flex-1">
        {events.map((event) => (
          <div key={event.id} className="flex gap-4 items-start p-3 rounded-2xl hover:bg-black/5 transition-colors cursor-default">
            <div className={`p-2 rounded-xl border ${getColors(event.type)} flex-shrink-0 mt-1`}>
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{event.text}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono">{event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const InventoryAlerts = () => {
  const alerts = [
    { item: "White Forest Base", stock: "2 units", status: "critical" },
    { item: "Premium 1kg Boxes", stock: "15 units", status: "warning" },
    { item: "Fresh Strawberries", stock: "Low", status: "critical" },
    { item: "Dark Chocolate Chips", stock: "22 units", status: "warning" }
  ]

  return (
    <div className="bg-rose-50/80 backdrop-blur-md border border-rose-200/50 rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(225,29,72,0.04)] flex flex-col gap-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/40 to-transparent pointer-events-none"></div>
      <div className="flex justify-between items-center relative z-10">
        <h3 className="font-display text-2xl font-bold text-rose-900 flex items-center gap-2">
          <BoxRemove className="w-6 h-6 text-rose-500" /> Stock Alerts
        </h3>
        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-3 py-1 rounded-full border border-rose-200 uppercase tracking-wider">{alerts.length} Issues</span>
      </div>
      
      <div className="space-y-3 relative z-10 flex-1">
        {alerts.map((alert, i) => (
          <div key={i} className="flex justify-between items-center bg-white/60 p-4 rounded-[1.25rem] border border-rose-100/50 hover:bg-white/90 transition-colors">
            <span className="font-bold text-sm text-rose-950">{alert.item}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-md ${alert.status === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
              {alert.stock}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const CustomerSentiment = () => {
  return (
    <div className="bg-[var(--brand-deep-rose)]/5 backdrop-blur-md border border-[var(--brand-deep-rose)]/10 rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col gap-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
      <div className="flex justify-between items-center relative z-10">
        <h3 className="font-display text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500" /> Sentiment
        </h3>
      </div>
      
      <div className="flex items-end gap-4 relative z-10">
        <h1 className="text-6xl font-display font-black tracking-tighter text-[var(--foreground)]">4.8</h1>
        <div className="pb-2">
          <div className="flex gap-1 text-amber-500 mb-1">
            <Star variant="Bold" className="w-4 h-4" />
            <Star variant="Bold" className="w-4 h-4" />
            <Star variant="Bold" className="w-4 h-4" />
            <Star variant="Bold" className="w-4 h-4" />
            <Star className="w-4 h-4" />
          </div>
          <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">From 124 reviews today</p>
        </div>
      </div>
      
      <div className="mt-4 p-5 bg-white/80 rounded-[1.5rem] border border-[var(--border)] relative z-10 shadow-sm">
        <div className="absolute -top-3 -left-3 bg-white p-2 rounded-full border border-[var(--border)] shadow-sm text-[var(--brand-champagne)]">
           <Messages2 className="w-4 h-4" />
        </div>
        <p className="text-sm italic font-editorial text-[var(--foreground)] leading-relaxed">"The Mango Truffle was incredible! Delivery was fast and the packaging was beautiful. Will definitely order again!"</p>
        <p className="text-xs font-bold text-[var(--muted-foreground)] mt-4 flex justify-between uppercase tracking-wider">
          <span className="text-[var(--brand-deep-rose)]">Priya S.</span>
          <span>10 mins ago</span>
        </p>
      </div>
    </div>
  )
}

export default function OwnerDashboard() {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchKPIs = async () => {
      setLoading(true)
      try {
        const url = `/api/v1/reporting/dashboard${selectedBranch ? `?branchId=${selectedBranch}` : ''}`
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
  }, [selectedBranch])

  if (loading && !kpis) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-[var(--brand-champagne)] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-ui text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] animate-pulse">Loading Executive Dashboard...</p>
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

  // Map API variables
  const revenue = kpis.todaysSales || 0
  const totalOrders = kpis.ordersToday || 0
  const pendingOrders = kpis.pendingOrders || 0
  const kitchenDelay = kpis.lateOrdersCount || 0
  const completedOrders = (kpis.ordersByStatus?.DELIVERED || 0) + (kpis.ordersByStatus?.READY_FOR_PICKUP || 0)
  const cancelledOrders = kpis.ordersByStatus?.CANCELLED || 0
  const refundedOrders = kpis.todaysRefunds || 0 
  const driversActive = 7 // Mock dynamic data for now

  const branchStats = kpis.branchRanking || []
  const topBranch = branchStats.length > 0 ? branchStats[0].branchName : 'N/A'
  const bestSeller = kpis.topProducts && kpis.topProducts.length > 0 ? kpis.topProducts[0].productName : 'N/A'
  
  const avgPrepTime = kpis.averageProductionTimeMinutes ? `${kpis.averageProductionTimeMinutes} min` : 'N/A'
  const avgDeliveryTime = kpis.averageDeliveryTimeMinutes ? `${kpis.averageDeliveryTimeMinutes} min` : 'N/A'

  // Chart Data: Revenue Trend (Last 7 Days)
  const trendData = kpis.revenueTrend ? kpis.revenueTrend.map((pt: any) => ({
    dateLabel: new Date(pt.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
    revenue: pt.revenue
  })) : []

  return (
    <div className="min-h-screen bg-[var(--background)] relative">
      <div className="absolute top-6 left-6 z-50 print:hidden">
        <BackButton fallback="/login" label="Switch Account" variant="ghost" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
      </div>
      {/* Command Center Dot Matrix Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
      
      <div className="relative z-10 space-y-8 p-6 md:p-10 pb-20 pt-16 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 border-b border-[var(--border)] pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-[var(--foreground)] leading-none">
              Command Center
            </h1>
            <p className="font-editorial italic text-[var(--muted-foreground)] text-lg mt-2">Real-time operational overview for Gopal Cake Shop.</p>
          </div>
          <div className="flex items-center gap-4 print:hidden">
            <button onClick={() => window.print()} className="px-4 py-2.5 bg-white/80 hover:bg-white text-[var(--foreground)] font-bold rounded-xl shadow-sm border border-[var(--border)] transition-all flex items-center gap-2 font-ui text-[10px] uppercase tracking-[0.2em] hover:-translate-y-0.5">
              <DocumentDownload className="w-4 h-4" />
              Export PDF
            </button>
            <a href="/admin/orders/create" className="px-5 py-2.5 btn-primary text-[10px] font-bold rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
              <Box className="w-4 h-4" />
              Create Order
            </a>
            <div className="bg-white/80 backdrop-blur-md border border-emerald-100 rounded-full px-4 py-2 shadow-sm font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              Live Updates
            </div>
          </div>
        </div>

        {/* Branch Performance Cards */}
        <div className="mb-10 print:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Branch Analytics</h2>
            {selectedBranch && (
              <button onClick={() => setSelectedBranch(null)} className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-champagne)] bg-[var(--brand-champagne)]/10 px-3 py-1 rounded-full hover:bg-[var(--brand-champagne)]/20 transition-colors">
                Clear Filter
              </button>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {branchStats.map((branch: any) => {
              const isSelected = selectedBranch === branch.branchId
              return (
                <button
                  key={branch.branchId}
                  onClick={() => setSelectedBranch(isSelected ? null : branch.branchId)}
                  className={`flex-none w-64 p-5 rounded-[1.5rem] border text-left transition-all duration-300 relative overflow-hidden group ${
                    isSelected 
                      ? 'bg-[var(--brand-champagne)] border-[var(--brand-champagne)] shadow-[0_8px_32px_rgba(200,169,126,0.4)] text-white scale-105' 
                      : 'bg-white/80 backdrop-blur-md border-[var(--border)] text-[var(--foreground)] hover:bg-white hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  {!isSelected && <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>}
                  <div className="flex justify-between items-center mb-3 relative z-10">
                    <span className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 flex items-center gap-1">
                      <Shop className="w-3.5 h-3.5" /> {branch.branchName}
                    </span>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                  </div>
                  <div className="font-display font-black text-2xl tracking-tight mb-1 relative z-10">
                    ₹{branch.revenue.toLocaleString()}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Top Level KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Revenue (Today)" 
            value={`₹${revenue.toLocaleString()}`} 
            icon={Moneys} 
            trend="+14%" 
            trendLabel="vs last week" 
          />
          <MetricCard 
            title="Orders (Today)" 
            value={totalOrders} 
            icon={Bag} 
            trend="+8%" 
            trendLabel="vs last week" 
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

        {/* Live Ops & Alerts Row (NEW) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiveFeed />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <InventoryAlerts />
            <CustomerSentiment />
          </div>
        </div>

        {/* Secondary Metrics & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
            <h3 className="font-display text-2xl font-bold mb-8 text-[var(--foreground)] relative z-10">7-Day Revenue Trend</h3>
            <div className="flex-1 min-h-[350px] relative z-10">
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

          {/* Dense Stats Board & Server Metrics */}
          <div className="flex flex-col gap-6">
            <div className="bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col gap-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
              <h3 className="font-display text-2xl font-bold text-[var(--foreground)] relative z-10">Operational Stats</h3>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-[1.5rem] shadow-sm transition-transform hover:scale-105">
                  <p className="font-ui text-[9px] uppercase tracking-[0.2em] text-emerald-700/70 font-bold flex items-center gap-1.5 mb-1"><TickCircle className="w-3 h-3"/> Completed</p>
                  <p className="text-3xl font-display font-black text-emerald-700">{completedOrders}</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-[1.5rem] shadow-sm transition-transform hover:scale-105">
                  <p className="font-ui text-[9px] uppercase tracking-[0.2em] text-blue-700/70 font-bold flex items-center gap-1.5 mb-1"><TruckFast className="w-3 h-3"/> Drivers</p>
                  <p className="text-3xl font-display font-black text-blue-700">{driversActive}</p>
                </div>
                <div className="bg-rose-50/50 border border-[var(--brand-deep-rose)]/20 p-5 rounded-[1.5rem] shadow-sm transition-transform hover:scale-105">
                  <p className="font-ui text-[9px] uppercase tracking-[0.2em] text-[var(--brand-deep-rose)]/70 font-bold flex items-center gap-1.5 mb-1"><CloseCircle className="w-3 h-3"/> Cancelled</p>
                  <p className="text-3xl font-display font-black text-[var(--brand-deep-rose)]">{cancelledOrders}</p>
                </div>
                <div className="bg-[var(--brand-champagne)]/10 border border-[var(--brand-champagne)]/20 p-5 rounded-[1.5rem] shadow-sm transition-transform hover:scale-105">
                  <p className="font-ui text-[9px] uppercase tracking-[0.2em] text-[var(--brand-champagne)] font-bold flex items-center gap-1.5 mb-1"><RefreshLeftSquare className="w-3 h-3"/> Refunds</p>
                  <p className="text-3xl font-display font-black text-[var(--brand-champagne)]">{refundedOrders}</p>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-[var(--border)] relative z-10">
                <div className="flex justify-between items-center bg-[var(--muted)]/50 hover:bg-[var(--muted)] px-4 py-3 rounded-xl border border-[var(--border)] transition-colors">
                  <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] flex items-center gap-2"><Location className="w-3.5 h-3.5 text-[var(--muted-foreground)]"/> Top Branch</p>
                  <p className="font-display font-bold text-[var(--foreground)] text-lg">{topBranch}</p>
                </div>
                <div className="flex justify-between items-center bg-[var(--muted)]/50 hover:bg-[var(--muted)] px-4 py-3 rounded-xl border border-[var(--border)] transition-colors">
                  <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] flex items-center gap-2"><Box className="w-3.5 h-3.5 text-[var(--muted-foreground)]"/> Best Seller</p>
                  <p className="font-display font-bold text-[var(--foreground)] text-lg truncate max-w-[140px]">{bestSeller}</p>
                </div>
                <div className="flex justify-between items-center bg-[var(--muted)]/50 hover:bg-[var(--muted)] px-4 py-3 rounded-xl border border-[var(--border)] transition-colors">
                  <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] flex items-center gap-2"><Reserve className="w-3.5 h-3.5 text-[var(--muted-foreground)]"/> Avg Prep</p>
                  <p className="font-display font-bold text-[var(--foreground)] text-lg">{avgPrepTime}</p>
                </div>
                <div className="flex justify-between items-center bg-[var(--muted)]/50 hover:bg-[var(--muted)] px-4 py-3 rounded-xl border border-[var(--border)] transition-colors">
                  <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] flex items-center gap-2"><Timer className="w-3.5 h-3.5 text-[var(--muted-foreground)]"/> Avg Delivery</p>
                  <p className="font-display font-bold text-[var(--foreground)] text-lg">{avgDeliveryTime}</p>
                </div>
              </div>
            </div>

            <ServerMetricsWidget />
          </div>
        </div>

      </div>
    </div>
  )
}
