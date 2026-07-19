"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, ShoppingBag, ChefHat,
  Clock, AlertTriangle, BarChart2, Users, Truck,
  ArrowUpRight, Minus, RefreshCw, Activity, CheckCircle, AlertOctagon, AlertTriangle as AlertTriangleIcon
} from "lucide-react";

interface DashboardKPIs {
  todaysSales: number;
  todaysRefunds: number;
  revenueVsPreviousPeriod: { current: number; previous: number; changePercent: number };
  averageOrderValue: number;
  ordersToday: number;
  ordersByStatus: Record<string, number>;
  averageProductionTimeMinutes: number;
  averageDeliveryTimeMinutes: number;
  lateOrdersCount: number;
  ordersWaitingTooLong: number;
  averageQueueLength: number;
  topProducts: { productName: string; count: number; revenue: number }[];
  branchRanking: { branchId: string; branchName: string; revenue: number }[];
}

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: number;         // positive = good, negative = bad
  alert?: boolean;
  loading?: boolean;
}

function KpiCard({ title, value, sub, icon, trend, alert, loading }: KpiCardProps) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm flex flex-col gap-3 transition-all ${alert ? "border-red-300 bg-red-50" : "border-gray-100"}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`rounded-lg p-2 ${alert ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
      ) : (
        <p className={`text-2xl font-bold ${alert ? "text-red-700" : "text-gray-900"}`}>{value}</p>
      )}
      {sub && !loading && (
        <p className="text-xs text-gray-400">{sub}</p>
      )}
      {typeof trend === "number" && !loading && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-400"}`}>
          {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {trend > 0 ? "+" : ""}{trend.toFixed(1)}% vs yesterday
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-8 w-8 rounded-lg bg-gray-200" />
      </div>
      <div className="h-8 w-3/4 rounded bg-gray-200 mb-2" />
      <div className="h-3 w-1/2 rounded bg-gray-100" />
    </div>
  );
}

function FinanceHealthWidget() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/reconciliation/health')
      .then(res => res.json())
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-3 w-24 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!report) return null;

  const isHealthy = report.overallStatus === 'HEALTHY';
  const issueCount = report.issues?.length || 0;

  return (
    <div className={`rounded-xl border p-5 flex items-center justify-between shadow-sm ${isHealthy ? 'bg-emerald-50 border-emerald-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${isHealthy ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'}`}>
          {isHealthy ? <CheckCircle className="h-6 w-6" /> : (report.overallStatus === 'CRITICAL' ? <AlertOctagon className="h-6 w-6 text-red-600" /> : <AlertTriangleIcon className="h-6 w-6" />)}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Finance Health</h3>
          <p className="text-sm text-gray-600">
            {isHealthy ? '🟢 Healthy' : (report.overallStatus === 'CRITICAL' ? `🔴 ${issueCount} critical issues detected` : `🟡 ${issueCount} issues detected`)}
          </p>
        </div>
      </div>
      {!isHealthy && (
        <a href="/admin/reconciliation" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-white px-4 py-2 rounded-lg border border-indigo-200 shadow-sm transition-colors">
          Open Reconciliation
        </a>
      )}
    </div>
  );
}

interface DashboardPageProps {
  branchId?: string;
  branchName?: string;
}

export default function DashboardPage({ branchId, branchName }: DashboardPageProps) {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchKPIs = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (branchId) params.set("branchId", branchId);
      const res = await fetch(`/api/v1/reporting/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setKpis(json.data);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message ?? "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchKPIs();
    // 30s polling — upgraded to SSE in v1.2
    const interval = setInterval(fetchKPIs, 30_000);
    return () => clearInterval(interval);
  }, [fetchKPIs]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {branchName ? `${branchName} Dashboard` : "Executive Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Today's operational overview · Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchKPIs(); }}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error} —{" "}
          <button onClick={() => { setLoading(true); fetchKPIs(); }} className="underline">
            Retry
          </button>
        </div>
      )}

      {/* Finance Health Widget (Admin Only - assuming branchName is undefined for global admin) */}
      {!branchId && <FinanceHealthWidget />}

      {/* Revenue KPIs */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Revenue</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <KpiCard
                title="Today's Sales"
                value={fmt(kpis?.todaysSales ?? 0)}
                icon={<BarChart2 className="h-4 w-4" />}
                trend={kpis?.revenueVsPreviousPeriod.changePercent}
                sub="Gross payments received today"
              />
              <KpiCard
                title="Today's Refunds"
                value={fmt(kpis?.todaysRefunds ?? 0)}
                icon={<ArrowUpRight className="h-4 w-4 rotate-180" />}
                alert={(kpis?.todaysRefunds ?? 0) > (kpis?.todaysSales ?? 0) * 0.1}
                sub="Refunds issued today"
              />
              <KpiCard
                title="Average Order Value"
                value={fmt(kpis?.averageOrderValue ?? 0)}
                icon={<ShoppingBag className="h-4 w-4" />}
                sub="Across non-cancelled orders"
              />
              <KpiCard
                title="Orders Today"
                value={String(kpis?.ordersToday ?? 0)}
                icon={<ShoppingBag className="h-4 w-4" />}
                sub="All statuses"
              />
            </>
          )}
        </div>
      </section>

      {/* Kitchen Health */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Kitchen Health</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <KpiCard
                title="Avg Production Time"
                value={`${kpis?.averageProductionTimeMinutes ?? 0} min`}
                icon={<ChefHat className="h-4 w-4" />}
                sub="Last 7 days"
              />
              <KpiCard
                title="Avg Delivery Time"
                value={`${kpis?.averageDeliveryTimeMinutes ?? 0} min`}
                icon={<Truck className="h-4 w-4" />}
                sub="Last 7 days"
              />
              <KpiCard
                title="Orders Waiting Too Long"
                value={String(kpis?.ordersWaitingTooLong ?? 0)}
                icon={<Clock className="h-4 w-4" />}
                alert={(kpis?.ordersWaitingTooLong ?? 0) > 0}
                sub="In production > 60 min"
              />
              <KpiCard
                title="Late Orders"
                value={String(kpis?.lateOrdersCount ?? 0)}
                icon={<AlertTriangle className="h-4 w-4" />}
                alert={(kpis?.lateOrdersCount ?? 0) > 0}
                sub="Past target date, not delivered"
              />
            </>
          )}
        </div>
      </section>

      {/* Order Status Breakdown */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Order Status Breakdown</h2>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-3 w-full rounded bg-gray-200" />
                  <div className="h-8 w-3/4 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">
              {Object.entries(kpis?.ordersByStatus ?? {}).map(([status, count]) => (
                <div key={status} className="text-center">
                  <p className="text-xs text-gray-400">{status.replace(/_/g, " ")}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Products */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Top Products Today</h2>
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                  <div className="h-4 w-40 rounded bg-gray-200" />
                  <div className="h-4 w-20 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : (kpis?.topProducts.length ?? 0) === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No orders today yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Units</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {kpis?.topProducts.map((p, i) => (
                  <tr key={p.productName} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.productName}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.count}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Branch Ranking — Admin only */}
      {(kpis?.branchRanking.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Branch Ranking — Today</h2>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Branch</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {kpis?.branchRanking.map((b, i) => (
                  <tr key={b.branchId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-50 text-orange-600"}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.branchName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(b.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
