// Force cache invalidation
'use client'

import React, { useMemo, useState, useEffect } from "react"
import { Moneys, Bag, Clock, Warning2, Box, TruckFast, Timer, Reserve, CloseCircle, RefreshLeftSquare, TrendUp, Location, TickCircle, Data, Cpu, DocumentDownload, Shop, Activity, BoxRemove, Star, Messages2, Receipt21, ClipboardClose, ReceiptSearch, Danger, ArrangeVertical, Profile2User } from "iconsax-react"
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

const MetricCard = ({ title, value, icon: Icon, trend, trendLabel, destructive, colorVariant }: any) => {
  // Define color themes based on the variant
  const getTheme = () => {
    switch (colorVariant) {
      case 'red': return 'border-red-200 bg-red-50/80 text-red-600 icon-bg-red-100 icon-text-red-600'
      case 'green': return 'border-emerald-200 bg-emerald-50/80 text-emerald-600 icon-bg-emerald-100 icon-text-emerald-600'
      case 'orange': return 'border-orange-200 bg-orange-50/80 text-orange-600 icon-bg-orange-100 icon-text-orange-600'
      case 'purple': return 'border-purple-200 bg-purple-50/80 text-purple-600 icon-bg-purple-100 icon-text-purple-600'
      case 'blue': return 'border-blue-200 bg-blue-50/80 text-blue-600 icon-bg-blue-100 icon-text-blue-600'
      case 'amber': return 'border-amber-200 bg-amber-50/80 text-amber-600 icon-bg-amber-100 icon-text-amber-600'
      default: return destructive 
        ? 'border-[var(--brand-deep-rose)]/20 bg-rose-50/80 text-[var(--brand-deep-rose)] icon-bg-rose-100 icon-text-rose-600' 
        : 'border-[var(--border)] bg-white/80 text-[var(--foreground)] icon-bg-[var(--brand-champagne)]/10 icon-text-[var(--brand-champagne)]'
    }
  }

  const themeClasses = getTheme()
  const baseCard = themeClasses.split(' ').slice(0, 3).join(' ')
  const titleColor = colorVariant ? themeClasses.split(' ')[2] : 'text-[var(--foreground)]'
  const iconBg = themeClasses.split(' ').find(c => c.startsWith('icon-bg-'))?.replace('icon-bg-', 'bg-') || 'bg-gray-100'
  const iconText = themeClasses.split(' ').find(c => c.startsWith('icon-text-'))?.replace('icon-text-', 'text-') || 'text-gray-600'

  return (
    <div className={`p-5 rounded-3xl border backdrop-blur-md shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] transition-all hover:shadow-[0_16px_48px_0_rgba(74,59,53,0.12)] hover:-translate-y-1 relative overflow-hidden group ${baseCard}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="font-ui text-[9px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.15em] mb-1.5">{title}</p>
          <h3 className={`text-3xl font-display font-black tracking-tight ${titleColor}`}>
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 ${iconBg} ${iconText}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center font-ui text-[9px] font-bold uppercase tracking-[0.2em] relative z-10">
          <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
            <TrendUp className="w-2.5 h-2.5" /> {trend}
          </span>
          <span className="text-[var(--muted-foreground)] ml-2">{trendLabel}</span>
        </div>
      )}
    </div>
  )
}

const ServerMetricsWidget = () => {
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
            <p className="font-display font-bold text-sm">34%</p>
          </div>
          <div className="w-full bg-[var(--muted)] rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full transition-all duration-500 bg-[var(--brand-champagne)] w-[34%]"></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Memory (12GB / 16GB)
            </p>
            <p className="font-display font-bold text-sm">75%</p>
          </div>
          <div className="w-full bg-[var(--muted)] rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full transition-all duration-500 bg-[var(--brand-champagne)] w-[75%]"></div>
          </div>
        </div>
        
        <div className="pt-2">
          <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Server Uptime</p>
          <p className="font-display font-bold text-lg text-[var(--foreground)]">720 hours</p>
        </div>
      </div>
    </div>
  )
}

const StaffActivityWidget = () => {
  const staffList = [
    { name: "Amit Sharma", role: "Manager", branch: "Khanderao", status: "active", lastLogin: "Just now" },
    { name: "Priya Desai", role: "Chef", branch: "Ellora", status: "active", lastLogin: "10 mins ago" },
    { name: "Vikram Singh", role: "Sales", branch: "Warasiya", status: "idle", lastLogin: "45 mins ago" },
    { name: "Rahul Verma", role: "Driver", branch: "Uma", status: "active", lastLogin: "5 mins ago" },
    { name: "Anita Patel", role: "Chef", branch: "Khanderao", status: "offline", lastLogin: "Yesterday, 8:00 PM" },
  ]

  return (
    <div className="bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col gap-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
      <div className="flex justify-between items-center relative z-10">
        <h3 className="font-display text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <Profile2User className="w-6 h-6 text-blue-500" /> Staff Activity
        </h3>
        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-200 uppercase tracking-wider">3 Active</span>
      </div>
      
      <div className="space-y-4 relative z-10 flex-1">
        {staffList.map((staff, i) => (
          <div key={i} className="flex justify-between items-center p-3 rounded-2xl hover:bg-black/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 font-ui uppercase">
                  {staff.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  staff.status === 'active' ? 'bg-emerald-500' : 
                  staff.status === 'idle' ? 'bg-amber-500' : 'bg-gray-400'
                }`}></div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--foreground)]">{staff.name}</h4>
                <p className="text-[10px] font-ui uppercase tracking-wider text-muted-foreground font-bold">{staff.role} • {staff.branch}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-ui uppercase tracking-wider text-muted-foreground font-bold">Last Login</p>
              <p className="text-xs font-bold text-[var(--foreground)]">{staff.lastLogin}</p>
            </div>
          </div>
        ))}
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
    <div className="bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col gap-6 relative overflow-hidden group h-full">
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
  const [selectedBranch, setSelectedBranch] = useState<string>('All')
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false)
  const branches = ['All', 'Khanderao', 'Uma', 'Warasiya', 'Ellora']

  // Mocked data for UI-only mode
  const kpis = {
    todaysSales: 48500,
    totalOrders: 142,
    pendingOrders: 12,
    readyOrders: 8,
    pendingDelivery: 5,
    pendingSwap: 2,
    delayedOrders: 3,
    unverifiedOrders: 4,
    missingIngredients: 2,
    vendorNotes: 1,
    activeDeliveries: 9,
    activeOrdersPreparing: 18,
    completedOrders: 98,
    balanceDue: 14500,
    revenueTrend: [
      { date: '2023-10-01', revenue: 42000 },
      { date: '2023-10-02', revenue: 45000 },
      { date: '2023-10-03', revenue: 39000 },
      { date: '2023-10-04', revenue: 51000 },
      { date: '2023-10-05', revenue: 48000 },
      { date: '2023-10-06', revenue: 55000 },
      { date: '2023-10-07', revenue: 48500 },
    ]
  }

  // Chart Data: Revenue Trend (Last 7 Days)
  const trendData = kpis.revenueTrend.map((pt: any) => ({
    dateLabel: new Date(pt.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
    revenue: pt.revenue
  }))

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

        {/* Branch Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar print:hidden">
          {branches.map(branch => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              className={`px-6 py-3 rounded-full font-ui text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedBranch === branch 
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md' 
                  : 'bg-white border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              {branch}
            </button>
          ))}
        </div>

        {/* Balance Due Card (Clickable) */}
        <div 
          onClick={() => setIsBalanceModalOpen(true)}
          className="cursor-pointer bg-gradient-to-r from-[var(--brand-deep-rose)] to-rose-900 rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden group hover:scale-[1.01] transition-transform"
        >
          <div className="absolute -right-10 -top-10 opacity-10">
            <Receipt21 className="w-64 h-64" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-rose-100 mb-2">Total Balance Due</p>
              <h2 className="text-5xl font-display font-black tracking-tight">₹{kpis.balanceDue.toLocaleString()}</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl font-bold font-ui text-[10px] uppercase tracking-wider flex items-center gap-2 group-hover:bg-white/30 transition-colors">
              Click to view all dues &rarr;
            </div>
          </div>
        </div>

        {/* 12 Comprehensive KPI Panels */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Orders" value={kpis.totalOrders} icon={Bag} colorVariant="default" />
          <MetricCard title="Completed Orders" value={kpis.completedOrders} icon={TickCircle} colorVariant="blue" />
          <MetricCard title="Pending Orders" value={kpis.pendingOrders} icon={Clock} colorVariant="red" />
          <MetricCard title="Ready Orders" value={kpis.readyOrders} icon={Reserve} colorVariant="green" />
          
          <MetricCard title="Pending Delivery" value={kpis.pendingDelivery} icon={TruckFast} colorVariant="orange" />
          <MetricCard title="Active Deliveries" value={kpis.activeDeliveries} icon={Location} colorVariant="amber" />
          <MetricCard title="Active Orders (Kitchen)" value={kpis.activeOrdersPreparing} icon={Activity} colorVariant="blue" />
          <MetricCard title="Delayed Orders" value={kpis.delayedOrders} icon={Timer} colorVariant="red" />
          
          <MetricCard title="Unverified Orders" value={kpis.unverifiedOrders} icon={ReceiptSearch} colorVariant="purple" />
          <MetricCard title="Pending Swap" value={kpis.pendingSwap} icon={ArrangeVertical} colorVariant="orange" />
          <MetricCard title="Missing Ingredients" value={kpis.missingIngredients} icon={Danger} colorVariant="red" />
          <MetricCard title="Vendor Notes" value={kpis.vendorNotes} icon={ClipboardClose} colorVariant="default" />
        </div>

        {/* Live Ops & Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiveFeed />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <StaffActivityWidget />
            <CustomerSentiment />
          </div>
        </div>

        {/* Chart & Server Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          <div className="flex flex-col gap-6">
             <ServerMetricsWidget />
          </div>
        </div>

      </div>

      {/* Balance Due Modal */}
      {isBalanceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-display text-2xl font-bold">Outstanding Balances</h3>
                <p className="text-xs font-ui uppercase tracking-wider text-muted-foreground font-bold mt-1">Total: ₹14,500</p>
              </div>
              <button onClick={() => setIsBalanceModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <CloseCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {[
                { order: 'ORD-1209', name: 'Rajesh Kumar', phone: '9876543210', due: 2500, branch: 'Khanderao' },
                { order: 'ORD-1205', name: 'Anita Patel', phone: '9123456780', due: 1200, branch: 'Ellora' },
                { order: 'ORD-1198', name: 'Vikram Singh', phone: '9988776655', due: 4500, branch: 'Uma' },
                { order: 'ORD-1182', name: 'Priya Desai', phone: '9871234560', due: 6300, branch: 'Warasiya' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 border border-border rounded-xl hover:bg-gray-50">
                  <div>
                    <span className="font-bold font-ui text-[10px] uppercase tracking-wider text-[var(--brand-deep-rose)]">{item.order}</span>
                    <h4 className="font-bold text-sm mt-0.5">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.phone} • {item.branch}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-bold text-lg text-rose-600">₹{item.due.toLocaleString()}</span>
                    <button className="block mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-champagne)] hover:underline">Settle Due</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
