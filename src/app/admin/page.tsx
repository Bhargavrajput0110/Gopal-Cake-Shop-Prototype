"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Users, ShoppingBag, Wallet, Building2, ChevronRight,
  ArrowUpRight, ArrowDownRight, Eye, Phone, BadgeIndianRupee,
  UserCheck, Truck, ChefHat, HeadphonesIcon, Star, Clock, AlertCircle
} from "lucide-react";

// ─── Fake Data ────────────────────────────────────────────────────────────────

const BRANCHES = [
  { id: "b1", name: "Uma Char Rasta", city: "Vadodara", isActive: true },
  { id: "b2", name: "Khanderao Market", city: "Vadodara", isActive: true },
  { id: "b3", name: "Warasiya Factory", city: "Vadodara", isActive: true },
  { id: "b4", name: "Ellora Park", city: "Vadodara", isActive: true },
];

const BRANCH_DATA: Record<string, BranchStats> = {
  b1: {
    revenue: 148200, orders: 312, pendingBalance: 18400,
    cashCollected: 31200, deliveries: 87,
    staff: [
      { id: "EMP-101", name: "Ramesh Patel", role: "sales", salary: 18000, status: "active", ordersHandled: 145 },
      { id: "CHEF-101", name: "Manoj Tiwari", role: "chef", salary: 22000, status: "active", ordersHandled: 212 },
      { id: "DLV-101", name: "Arjun Singh", role: "delivery", salary: 14000, status: "active", cashCollected: 24600, deliveries: 54 },
      { id: "ADM-001", name: "Gopal Bhai", role: "admin", salary: 0, status: "active", ordersHandled: 0 },
    ]
  },
  b2: {
    revenue: 96500, orders: 201, pendingBalance: 9200,
    cashCollected: 18700, deliveries: 52,
    staff: [
      { id: "EMP-201", name: "Pooja Mehta", role: "sales", salary: 16000, status: "active", ordersHandled: 110 },
      { id: "CHEF-201", name: "Suresh Yadav", role: "chef", salary: 20000, status: "active", ordersHandled: 165 },
      { id: "DLV-201", name: "Deepak Verma", role: "delivery", salary: 13000, status: "active", cashCollected: 18700, deliveries: 52 },
    ]
  },
  b3: {
    revenue: 112000, orders: 180, pendingBalance: 4500,
    cashCollected: 21000, deliveries: 60,
    staff: [
      { id: "EMP-301", name: "Neha Gupta", role: "sales", salary: 15000, status: "active", ordersHandled: 80 },
      { id: "CHEF-301", name: "Vijay Sharma", role: "chef", salary: 20000, status: "active", ordersHandled: 150 },
    ]
  },
  b4: {
    revenue: 85000, orders: 140, pendingBalance: 3200,
    cashCollected: 14500, deliveries: 40,
    staff: [
      { id: "EMP-401", name: "Sunita Shah", role: "sales", salary: 16000, status: "active", ordersHandled: 95 },
      { id: "DLV-401", name: "Ravi Kumar", role: "delivery", salary: 14000, status: "active", cashCollected: 14500, deliveries: 40 },
    ]
  },
};

type StaffMember = {
  id: string; name: string; role: string; salary: number; status: string;
  ordersHandled?: number; cashCollected?: number; deliveries?: number;
};

type BranchStats = {
  revenue: number; orders: number; pendingBalance: number;
  cashCollected: number; deliveries: number; staff: StaffMember[];
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "staff" | "money">("overview");
  const [period, setPeriod] = useState("This Month");

  // Aggregate totals
  const totalRevenue = Object.values(BRANCH_DATA).reduce((s, b) => s + b.revenue, 0);
  const totalOrders = Object.values(BRANCH_DATA).reduce((s, b) => s + b.orders, 0);
  const totalPending = Object.values(BRANCH_DATA).reduce((s, b) => s + b.pendingBalance, 0);
  const totalCash = Object.values(BRANCH_DATA).reduce((s, b) => s + b.cashCollected, 0);

  const currentBranch = selectedBranch === "all" ? null : BRANCH_DATA[selectedBranch];
  const displayRevenue = currentBranch ? currentBranch.revenue : totalRevenue;
  const displayOrders = currentBranch ? currentBranch.orders : totalOrders;
  const displayPending = currentBranch ? currentBranch.pendingBalance : totalPending;
  const displayCash = currentBranch ? currentBranch.cashCollected : totalCash;

  const allStaff = selectedBranch === "all"
    ? Object.values(BRANCH_DATA).flatMap(b => b.staff)
    : BRANCH_DATA[selectedBranch]?.staff ?? [];

  const totalSalaryBill = allStaff.reduce((s, e) => s + e.salary, 0);

  return (
    <div className="space-y-6 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Admin Command Centre</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Branch-wise financial & staff overview</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="bg-card border border-border text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 font-medium"
          >
            {["Today", "Yesterday", "Last 7 Days", "This Month", "Last Month", "This Year"].map(p => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Branch Selector ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mr-2 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" /> Branch:
        </span>
        {[{ id: "all", name: "All Branches" }, ...BRANCHES].map(b => (
          <button
            key={b.id}
            onClick={() => setSelectedBranch(b.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              selectedBranch === b.id
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            } ${"isActive" in b && !b.isActive ? "opacity-50" : ""}`}
          >
            {"isActive" in b && !b.isActive && <span className="mr-1 text-[10px]">●</span>}
            {b.name}
          </button>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={`₹${(displayRevenue / 1000).toFixed(1)}K`} sub={`${displayOrders} orders`} change="+14.2%" positive icon={<TrendingUp className="w-4 h-4" />} color="primary" />
        <KPICard title="Cash Collected" value={`₹${(displayCash / 1000).toFixed(1)}K`} sub="By delivery staff" change="+8.1%" positive icon={<Wallet className="w-4 h-4" />} color="emerald" />
        <KPICard title="Pending Balance" value={`₹${(displayPending / 1000).toFixed(1)}K`} sub="COD + partial" change="-3.2%" positive={false} icon={<AlertCircle className="w-4 h-4" />} color="amber" />
        <KPICard title="Salary Bill" value={`₹${(totalSalaryBill / 1000).toFixed(1)}K`} sub={`${allStaff.filter(s => s.status === "active").length} active staff`} change="Fixed" positive icon={<BadgeIndianRupee className="w-4 h-4" />} color="rose" />
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl w-fit border border-border">
        {(["overview", "staff", "money"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
              activeTab === t ? "bg-card shadow-sm text-foreground border border-border" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "overview" ? "Branch Overview" : t === "staff" ? "Staff IDs & Roles" : "Money Tracking"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {/* ══ TAB: OVERVIEW ══ */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Branch Cards */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Branch Performance</h3>
                {BRANCHES.map(branch => {
                  const data = BRANCH_DATA[branch.id];
                  return (
                    <div key={branch.id} onClick={() => setSelectedBranch(branch.id)}
                      className={`bg-card border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md group ${
                        selectedBranch === branch.id ? "border-primary shadow-md shadow-primary/10" : "border-border"
                      } ${!branch.isActive ? "opacity-60" : ""}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${branch.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                            <h4 className="font-black text-foreground">{branch.name}</h4>
                            <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{branch.city}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-4">{data.staff.filter(s => s.status === "active").length} active staff</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Revenue", val: `₹${(data.revenue / 1000).toFixed(1)}K` },
                          { label: "Orders", val: data.orders.toString() },
                          { label: "Cash In", val: `₹${(data.cashCollected / 1000).toFixed(1)}K` },
                          { label: "Pending", val: `₹${(data.pendingBalance / 1000).toFixed(1)}K` },
                        ].map(s => (
                          <div key={s.label} className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                            <p className="text-base font-black text-foreground mt-0.5">{s.val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: Today's Activity */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Live Activity</h3>
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  {[
                    { label: "Active Orders", val: "14", icon: <ShoppingBag className="w-4 h-4 text-blue-500" />, color: "bg-blue-500/10" },
                    { label: "Chefs Working", val: "3", icon: <ChefHat className="w-4 h-4 text-amber-500" />, color: "bg-amber-500/10" },
                    { label: "Drivers Out", val: "5", icon: <Truck className="w-4 h-4 text-emerald-500" />, color: "bg-emerald-500/10" },
                    { label: "Avg Bake Time", val: "48 min", icon: <Clock className="w-4 h-4 text-purple-500" />, color: "bg-purple-500/10" },
                    { label: "Top Seller", val: "Truffle Cake", icon: <Star className="w-4 h-4 text-rose-500" />, color: "bg-rose-500/10" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.color}`}>{item.icon}</div>
                        <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="text-sm font-black text-foreground">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: STAFF ══ */}
          {activeTab === "staff" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                  Staff Directory — {selectedBranch === "all" ? "All Branches" : BRANCHES.find(b => b.id === selectedBranch)?.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Active: {allStaff.filter(s => s.status === "active").length}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />Inactive: {allStaff.filter(s => s.status !== "active").length}</span>
                </div>
              </div>

              {/* Role filter chips */}
              <RoleTable staff={allStaff} />
            </div>
          )}

          {/* ══ TAB: MONEY ══ */}
          {activeTab === "money" && (
            <div className="space-y-6">
              {/* Delivery Cash Tracking */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Delivery Cash Collected</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allStaff.filter(s => s.role === "delivery").map(driver => (
                    <div key={driver.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-black text-foreground text-sm">{driver.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{driver.id}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${driver.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {driver.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 border border-emerald-200/50">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase">Cash Collected</p>
                          <p className="text-lg font-black text-emerald-700 mt-0.5">₹{(driver.cashCollected ?? 0).toLocaleString("en-IN")}</p>
                        </div>
                        <div className="bg-secondary/50 rounded-xl p-3 border border-border">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Deliveries</p>
                          <p className="text-lg font-black text-foreground mt-0.5">{driver.deliveries ?? 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground font-medium">Monthly Salary</span>
                        <span className="text-sm font-black text-foreground">₹{driver.salary.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Salary Bill */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Monthly Salary Bill</h3>
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 border-b border-border">
                      <tr>
                        {["Staff ID", "Name", "Role", "Branch", "Status", "Salary"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allStaff.map(s => (
                        <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{s.id}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                          <td className="px-4 py-3"><RoleBadge role={s.role} /></td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {Object.entries(BRANCH_DATA).find(([, bd]) => bd.staff.some(st => st.id === s.id))?.[0] === "b1" ? "Uma Char Rasta" : Object.entries(BRANCH_DATA).find(([, bd]) => bd.staff.some(st => st.id === s.id))?.[0] === "b2" ? "Khanderao" : Object.entries(BRANCH_DATA).find(([, bd]) => bd.staff.some(st => st.id === s.id))?.[0] === "b3" ? "Warasiya" : "Ellora Park"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${s.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-gray-500/20"}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-black text-foreground">
                            {s.salary === 0 ? <span className="text-muted-foreground text-xs italic">Owner</span> : `₹${s.salary.toLocaleString("en-IN")}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-primary/30 bg-primary/5">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-sm font-black text-foreground">Total Monthly Salary Bill</td>
                        <td className="px-4 py-3 text-base font-black text-primary">₹{totalSalaryBill.toLocaleString("en-IN")}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Pending Breakdown */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Pending Balance by Branch</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {BRANCHES.map(b => (
                    <div key={b.id} className="bg-card border border-border rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-2 h-2 rounded-full ${b.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                        <span className="font-bold text-sm text-foreground">{b.name}</span>
                      </div>
                      <p className="text-3xl font-black text-amber-500">₹{BRANCH_DATA[b.id].pendingBalance.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground mt-1">Uncollected balance</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Sub Components ───────────────────────────────────────────────────────────

function KPICard({ title, value, sub, change, positive, icon, color }: {
  title: string; value: string; sub: string; change: string; positive: boolean; icon: React.ReactNode; color: string;
}) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    rose: "bg-rose-500/10 text-rose-600",
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-muted-foreground">{sub}</p>
        <span className={`flex items-center text-[10px] font-black ${positive ? "text-emerald-500" : "text-rose-500"}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </span>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    admin: { label: "Admin", cls: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400", icon: <UserCheck className="w-3 h-3" /> },
    sales: { label: "Sales", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", icon: <HeadphonesIcon className="w-3 h-3" /> },
    chef: { label: "Chef", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", icon: <ChefHat className="w-3 h-3" /> },
    delivery: { label: "Delivery", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", icon: <Truck className="w-3 h-3" /> },
  };
  const r = map[role] ?? { label: role, cls: "bg-gray-100 text-gray-600", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${r.cls}`}>
      {r.icon}{r.label}
    </span>
  );
}

function RoleTable({ staff }: { staff: StaffMember[] }) {
  const [roleFilter, setRoleFilter] = useState("all");
  const roles = ["all", "admin", "sales", "chef", "delivery"];
  const filtered = roleFilter === "all" ? staff : staff.filter(s => s.role === roleFilter);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {roles.map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
              roleFilter === r ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}>
            {r === "all" ? "All Roles" : r}
            <span className="ml-1.5 opacity-70">{r === "all" ? staff.length : staff.filter(s => s.role === r).length}</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              {["Staff ID", "Name", "Role", "Status", "Orders / Deliveries", "Salary", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-secondary/30 transition-colors group">
                <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{s.id}</td>
                <td className="px-4 py-3">
                  <p className="font-bold text-foreground">{s.name}</p>
                </td>
                <td className="px-4 py-3"><RoleBadge role={s.role} /></td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                    s.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20" : "bg-gray-100 text-gray-500 dark:bg-gray-500/20"
                  }`}>{s.status}</span>
                </td>
                <td className="px-4 py-3 text-foreground font-semibold">
                  {s.role === "delivery" ? `${s.deliveries ?? 0} deliveries` : `${s.ordersHandled ?? 0} orders`}
                </td>
                <td className="px-4 py-3 font-black text-foreground">
                  {s.salary === 0 ? <span className="text-muted-foreground italic text-xs">Owner</span> : `₹${s.salary.toLocaleString("en-IN")}`}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="View profile">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Call">
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm font-medium">No staff in this category</div>
        )}
      </div>
    </div>
  );
}
