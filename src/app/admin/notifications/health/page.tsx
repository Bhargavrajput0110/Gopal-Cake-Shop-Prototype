"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Activity, CheckCircle2, XCircle } from "lucide-react";

export default function NotificationHealthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/health/notifications")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return <p>Failed to load.</p>;

  return (
    <div className="mx-auto max-w-4xl py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Notification System Health</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* WhatsApp Card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">WhatsApp</h2>
            {data.whatsapp.healthy ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </div>
          <p className="text-sm text-gray-500">Cloud API Integration</p>
          <div className="mt-4 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${data.whatsapp.configured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {data.whatsapp.configured ? 'Configured' : 'Missing Credentials'}
            </span>
          </div>
        </div>

        {/* Outbox Card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Outbox Queue</h2>
            {data.outbox.healthy ? (
              <Activity className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pending:</span>
              <span className="font-medium">{data.outbox.pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Failed:</span>
              <span className="font-medium text-red-600">{data.outbox.failed}</span>
            </div>
          </div>
        </div>

        {/* Web Push Card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Web Push</h2>
            {data.push.healthy ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">VAPID Keys:</span>
              <span className="font-medium">{data.push.healthy ? 'Valid' : 'Missing'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Active Subs:</span>
              <span className="font-medium">{data.push.activeSubscriptions}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
