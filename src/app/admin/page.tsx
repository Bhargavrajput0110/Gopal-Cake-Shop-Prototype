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

// Removed mock widgets: ServerMetricsWidget, StaffActivityWidget, LiveFeed, CustomerSentiment

export default function OwnerDashboard() {
  const [selectedBranch, setSelectedBranch] = useState<string>('All')
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState(new Date().toISOString().split('T')[0])
  const [exportBranch, setExportBranch] = useState('All')
  const [isExporting, setIsExporting] = useState(false)
  const [apiData, setApiData] = useState<any>(null);
  const [dashboardDate, setDashboardDate] = useState<string>(new Date().toISOString().split('T')[0])
  const branches = ['All', 'Khanderao', 'Uma', 'Warasiya', 'Ellora']

  useEffect(() => {
    let url = `/api/v1/admin/analytics?date=${dashboardDate}`;
    if (selectedBranch !== 'All') {
      const bMap: any = { 'Khanderao': 'khanderao', 'Uma': 'uma', 'Warasiya': 'varasiya', 'Ellora': 'elora' };
      url += `&branchId=${bMap[selectedBranch]}`;
    }
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setApiData(data.data);
        }
      });
  }, [selectedBranch, dashboardDate]);

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const bMap: any = { 'Khanderao': 'khanderao', 'Uma': 'uma', 'Warasiya': 'varasiya', 'Ellora': 'elora' }
      const params = new URLSearchParams({ upToDate: exportTo })
      if (exportFrom) params.set('fromDate', exportFrom)
      if (exportBranch !== 'All') params.set('branchId', bMap[exportBranch] || exportBranch)
      
      const res = await fetch(`/api/v1/admin/export-report?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load data')
      const d = json.data

      const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
      const dateRange = exportFrom
        ? `${exportFrom} to ${exportTo}`
        : `Till ${exportTo}`

      const productRows = d.topProducts.map((p: any) => `
        <tr>
          <td>${p.name}</td>
          <td>${p.category}</td>
          <td style="text-align:center">${p.qty}</td>
          <td style="text-align:right">${fmt(p.revenue)}</td>
        </tr>`).join('')

      const categoryRows = d.salesByCategory.map((c: any) => `
        <tr>
          <td>${c.name}</td>
          <td style="text-align:center">${c.qty}</td>
          <td style="text-align:right">${fmt(c.revenue)}</td>
        </tr>`).join('')

      const branchRows = d.branchBreakdown.map((b: any) => `
        <tr>
          <td>${b.branchName}</td>
          <td style="text-align:center">${b.totalOrders}</td>
          <td style="text-align:right">${fmt(b.revenue)}</td>
        </tr>`).join('')

      const balanceRows = d.pendingBalances.slice(0, 30).map((o: any) => `
        <tr>
          <td>${o.orderNumber}</td>
          <td>${o.customerName}</td>
          <td>${o.customerPhone}</td>
          <td>${o.branchName}</td>
          <td style="text-align:right">${fmt(o.totalAmount)}</td>
          <td style="text-align:right">${fmt(o.paidAmount)}</td>
          <td style="text-align:right; color:#c0392b; font-weight:bold">${fmt(o.balanceDue)}</td>
        </tr>`).join('')

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Gopal Cake Shop — Report ${dateRange}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; color: #1a0a00; background: #fff; padding: 32px; font-size: 13px; }
  .header { border-bottom: 3px solid #8B1A4A; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header h1 { font-size: 32px; color: #8B1A4A; font-weight: 900; letter-spacing: -1px; }
  .header .meta { text-align: right; font-size: 11px; color: #666; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .kpi { border: 1px solid #e0c8b0; border-radius: 12px; padding: 16px; background: #fdf7f0; }
  .kpi label { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; color: #9b7b56; font-weight: 700; display: block; margin-bottom: 4px; }
  .kpi .val { font-size: 24px; font-weight: 900; color: #1a0a00; }
  .kpi.highlight .val { color: #8B1A4A; }
  h2 { font-size: 16px; font-weight: 800; color: #8B1A4A; margin: 0 0 12px; text-transform: uppercase; letter-spacing: .06em; padding-bottom: 6px; border-bottom: 1px solid #e0c8b0; }
  .section { margin-bottom: 36px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead tr { background: #8B1A4A; color: #fff; }
  thead th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
  tbody tr:nth-child(even) { background: #fdf7f0; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #eddfc8; }
  .footer { border-top: 2px solid #8B1A4A; padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #999; margin-top: 32px; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>Gopal Cake Shop</h1>
    <div style="font-size:13px; color:#666; margin-top:4px">Business Report — ${dateRange}</div>
    <div style="font-size:11px; color:#aaa; margin-top:2px">Branch: ${exportBranch}</div>
  </div>
  <div class="meta">
    <div>Generated: ${new Date().toLocaleString('en-IN')}</div>
    <div>By: Gopal Cake Shop Admin Panel</div>
  </div>
</div>

<div class="kpi-grid">
  <div class="kpi highlight"><label>Total Revenue</label><div class="val">${fmt(d.summary.totalRevenue)}</div></div>
  <div class="kpi"><label>Total Orders</label><div class="val">${d.summary.totalOrders}</div></div>
  <div class="kpi"><label>Avg. Order Value</label><div class="val">${fmt(d.summary.avgOrderValue)}</div></div>
  <div class="kpi highlight"><label>Balance Due</label><div class="val">${fmt(d.summary.totalBalanceDue)}</div></div>
</div>

<div class="section">
  <h2>Branch-Wise Performance</h2>
  <table><thead><tr><th>Branch</th><th>Orders</th><th style="text-align:right">Revenue</th></tr></thead>
  <tbody>${branchRows || '<tr><td colspan="3" style="text-align:center; color:#999">No data</td></tr>'}</tbody></table>
</div>

<div class="section">
  <h2>Top 20 Products by Revenue</h2>
  <table><thead><tr><th>Product</th><th>Category</th><th style="text-align:center">Units Sold</th><th style="text-align:right">Revenue</th></tr></thead>
  <tbody>${productRows || '<tr><td colspan="4" style="text-align:center; color:#999">No data</td></tr>'}</tbody></table>
</div>

<div class="section">
  <h2>Sales by Category</h2>
  <table><thead><tr><th>Category</th><th style="text-align:center">Units Sold</th><th style="text-align:right">Revenue</th></tr></thead>
  <tbody>${categoryRows || '<tr><td colspan="3" style="text-align:center; color:#999">No data</td></tr>'}</tbody></table>
</div>

${ d.pendingBalances.length > 0 ? `
<div class="section">
  <h2>Pending Balances (Unpaid / Partial)</h2>
  <table><thead><tr><th>Order #</th><th>Customer</th><th>Phone</th><th>Branch</th><th style="text-align:right">Total</th><th style="text-align:right">Paid</th><th style="text-align:right">Due</th></tr></thead>
  <tbody>${balanceRows}</tbody></table>
</div>` : '' }

<div class="footer">
  <div>Gopal Cake Shop — Confidential Business Report</div>
  <div>Printed on ${new Date().toLocaleDateString('en-IN')}</div>
</div>
<script>window.onload = () => window.print()<\/script>
</body></html>`

      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
      }
      setIsExportOpen(false)
    } catch (err: any) {
      alert('Export failed: ' + (err.message || 'Unknown error'))
    } finally {
      setIsExporting(false)
    }
  }

  const kpis = {
    todaysSales: apiData?.todaysSales || 0,
    totalOrders: apiData?.ordersToday || 0,
    pendingOrders: apiData?.pendingOrders || 0,
    completedOrders: (apiData?.ordersByStatus?.COMPLETED || 0) + (apiData?.ordersByStatus?.DELIVERED || 0),
    readyOrders: apiData?.ordersByStatus?.READY_FOR_PICKUP || 0,
    activeOrdersPreparing: apiData?.averageQueueLength || 0,
    pendingDelivery: apiData?.ordersByStatus?.READY_FOR_PICKUP || 0,
    activeDeliveries: apiData?.ordersByStatus?.ON_THE_WAY || 0,
    delayedOrders: apiData?.lateOrdersCount || 0,
    unverifiedOrders: 0,
    pendingSwap: 0,
    missingIngredients: 0,
    vendorNotes: 0,
    balanceDue: apiData?.balanceDue || 0,
    revenueTrend: apiData?.revenueTrend || [],
    averageProductionTimeMinutes: apiData?.averageProductionTimeMinutes || 0
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
            <button onClick={() => setIsExportOpen(true)} className="px-4 py-2.5 bg-white/80 hover:bg-white text-[var(--foreground)] font-bold rounded-xl shadow-sm border border-[var(--border)] transition-all flex items-center gap-2 font-ui text-[10px] uppercase tracking-[0.2em] hover:-translate-y-0.5">
              <DocumentDownload className="w-4 h-4" />
              Export Reports
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

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pb-4 print:hidden">
          {/* Branch Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
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

          <div className="hidden md:block h-8 w-px bg-[var(--border)] mx-2"></div>
          
          <input 
            type="date" 
            value={dashboardDate} 
            onChange={(e) => setDashboardDate(e.target.value)}
            className="px-4 py-3 rounded-xl border border-[var(--border)] bg-white/80 hover:bg-white text-sm font-bold font-ui text-[var(--foreground)] shadow-sm focus:ring-2 focus:ring-[var(--brand-champagne)] focus:outline-none transition-all"
            title="Select date to view historical metrics"
          />
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

        {/* Removed Live Ops & Alerts Row */}

        {/* Chart & Server Metrics */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(74,59,53,0.04)] flex flex-col relative overflow-hidden group">
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
        </div>

      </div>

      {/* Export PDF Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-border">
            <div className="p-6 border-b border-border bg-rose-50 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest block mb-1">📊 Report Export</span>
                <h3 className="font-display text-2xl font-bold">Export Business Report</h3>
              </div>
              <button onClick={() => setIsExportOpen(false)} className="p-2 hover:bg-rose-100 rounded-full transition-colors">
                <CloseCircle className="w-6 h-6 text-rose-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground font-ui">Generate a full PDF report of all orders, revenue, top products, category breakdown, and pending balances for the selected date range.</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">From Date (optional)</label>
                  <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm font-ui focus:outline-none focus:border-rose-400 transition-colors" />
                  <p className="text-[9px] text-muted-foreground">Leave blank for all-time</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">Up To Date *</label>
                  <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm font-ui focus:outline-none focus:border-rose-400 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">Branch Filter</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Khanderao', 'Uma', 'Warasiya', 'Ellora'].map(b => (
                    <button key={b} onClick={() => setExportBranch(b)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${ exportBranch === b ? 'bg-[var(--brand-deep-rose)] text-white border-[var(--brand-deep-rose)]' : 'bg-white border-border text-muted-foreground hover:border-[var(--brand-deep-rose)]/50' }`}>{b}</button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-ui">
                📄 The PDF will include: Revenue Summary, Branch Performance, Top 20 Products, Category Sales, and Pending Balances.
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <button onClick={() => setIsExportOpen(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting || !exportTo}
                className="flex-1 py-3 rounded-xl bg-[var(--brand-deep-rose)] hover:bg-rose-800 text-white text-sm font-black uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span> Generating...</>
                ) : (
                  <><DocumentDownload className="w-4 h-4" /> Download Report (PDF)</>
                )}
              </button>
              
              <button
                onClick={async () => {
                  try {
                    setIsExporting(true)
                    const bMap: any = { 'Khanderao': 'khanderao', 'Uma': 'uma', 'Warasiya': 'varasiya', 'Ellora': 'elora' }
                    const params = new URLSearchParams({ upToDate: exportTo })
                    if (exportFrom) params.set('fromDate', exportFrom)
                    if (exportBranch !== 'All') params.set('branchId', bMap[exportBranch] || exportBranch)
                    params.set('format', 'csv')
                    
                    window.open(`/api/v1/admin/export-report?${params}`, '_blank')
                    setIsExportOpen(false)
                  } catch (err) {
                    alert('Failed to generate CSV')
                  } finally {
                    setIsExporting(false)
                  }
                }}
                disabled={isExporting || !exportTo}
                className="flex-1 py-3 rounded-xl border border-[var(--brand-deep-rose)] text-[var(--brand-deep-rose)] text-sm font-black uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

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
              {apiData?.pendingBalances?.length ? apiData.pendingBalances.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-4 border border-border rounded-xl hover:bg-gray-50">
                  <div>
                    <span className="font-bold font-ui text-[10px] uppercase tracking-wider text-[var(--brand-deep-rose)]">{item.orderNumber}</span>
                    <h4 className="font-bold text-sm mt-0.5">{item.customerName || 'Unknown Customer'}</h4>
                    <p className="text-xs text-muted-foreground">{item.customerPhone || 'N/A'} • {item.branchName}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-bold text-lg text-rose-600">₹{item.balanceDue.toLocaleString()}</span>
                    <a href={`/sales/pos`} className="block mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-champagne)] hover:underline">Go to POS</a>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-muted-foreground font-ui">No outstanding balances found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
