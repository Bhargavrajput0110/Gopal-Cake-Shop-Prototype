'use client';

import React, { useState, useEffect } from 'react';

interface ReconciliationIssue {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  orderId?: string;
  paymentId?: string;
  createdAt: string;
}

interface ReconciliationHealthReport {
  generatedAt: string;
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  summary: {
    missingLedger: number;
    amountMismatch: number;
    stalledPayments: number;
    missingTimeline: number;
    duplicateLedger: number;
    orphanGatewayRecords: number;
  };
  issues: ReconciliationIssue[];
}

export default function ReconciliationPage() {
  const [report, setReport] = useState<ReconciliationHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/reconciliation/health');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleForceSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/v1/admin/reconciliation/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data.data);
        await fetchHealth();
      } else {
        alert(data.error || 'Sync failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during sync');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="p-8">Loading Finance Health...</div>;
  if (!report) return <div className="p-8">Failed to load health report.</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Reconciliation Console</h1>
          <p className="text-gray-500 mt-2">Operational observability and recovery for payments and ledger consistency.</p>
        </div>
        <button
          onClick={handleForceSync}
          disabled={syncing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center transition-colors disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Force Auto-Reconcile Now'}
        </button>
      </div>

      {syncResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h3 className="text-emerald-800 font-semibold text-lg mb-2">Reconciliation Complete</h3>
          <ul className="text-emerald-700 space-y-1">
            <li>Scanned: <span className="font-bold">{syncResult.scanned}</span></li>
            <li>Recovered: <span className="font-bold">{syncResult.recovered}</span></li>
            <li>Failed: <span className="font-bold">{syncResult.failed}</span></li>
            <li>Skipped: <span className="font-bold">{syncResult.skipped}</span></li>
            <li>Duration: <span className="font-bold">{syncResult.durationMs} ms</span></li>
          </ul>
        </div>
      )}

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl border ${report.overallStatus === 'HEALTHY' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm font-medium uppercase tracking-wider mb-1">Overall Status</p>
          <div className="text-3xl font-bold flex items-center gap-2">
            {report.overallStatus === 'HEALTHY' ? '🟢 Healthy' : (report.overallStatus === 'CRITICAL' ? '🔴 Critical' : '🟡 Warning')}
          </div>
          <p className="text-sm mt-2 opacity-80">
            Generated {new Date(report.generatedAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="p-6 rounded-xl border bg-white shadow-sm flex flex-col justify-center">
          <div className="text-sm font-medium text-gray-500 mb-1">Active Discrepancies</div>
          <div className="text-3xl font-bold text-gray-900">{report.issues.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
         <MetricCard label="Missing Ledger" count={report.summary.missingLedger} />
         <MetricCard label="Amt Mismatch" count={report.summary.amountMismatch} />
         <MetricCard label="Stalled Payments" count={report.summary.stalledPayments} />
         <MetricCard label="Missing Timeline" count={report.summary.missingTimeline} />
         <MetricCard label="Dup Ledger" count={report.summary.duplicateLedger} />
         <MetricCard label="Orphan Records" count={report.summary.orphanGatewayRecords} />
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Detected Issues ({report.issues.length})</h2>
          <button onClick={fetchHealth} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Refresh</button>
        </div>
        {report.issues.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No discrepancies found. All systems are consistent.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b text-sm text-gray-500 uppercase">
                <th className="px-6 py-3 font-medium">Severity</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Order / Payment ID</th>
                <th className="px-6 py-3 font-medium text-right">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {report.issues.map(issue => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 
                        issue.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{issue.type.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-gray-600">{issue.description}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="truncate w-32" title={issue.orderId || '-'}>O: {issue.orderId?.substring(0,8) || '-'}</div>
                    <div className="truncate w-32" title={issue.paymentId || '-'}>P: {issue.paymentId?.substring(0,8) || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500 whitespace-nowrap">
                    {new Date(issue.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

function MetricCard({ label, count }: { label: string; count: number }) {
  const isError = count > 0;
  return (
    <div className={`p-4 rounded-lg border ${isError ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${isError ? 'text-red-700' : 'text-gray-900'}`}>{count}</div>
    </div>
  )
}
