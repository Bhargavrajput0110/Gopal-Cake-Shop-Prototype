"use client";

import { useEffect, useState, useMemo } from "react";
import { Shop, Camera, Reserve, MagicStar, Add, Clock, Refresh2 } from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";
import { format } from "date-fns";

export default function VendorManagementPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/vendor/tasks");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch vendor tasks");
      setTasks(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const photographers = useMemo(() => tasks.filter(t => t.assignedVendor?.role === "VENDOR_PHOTO"), [tasks]);
  const florists = useMemo(() => tasks.filter(t => t.assignedVendor?.role === "VENDOR_FLORIST"), [tasks]);
  const acrylics = useMemo(() => tasks.filter(t => t.assignedVendor?.role === "VENDOR_ACRYLIC"), [tasks]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">Pending Auth</span>;
      case "PACKED":
      case "READY_FOR_PICKUP":
        return <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">Dispatched</span>;
      case "DELIVERED":
        return <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded">Completed</span>;
      default:
        return <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-500/10 px-2 py-0.5 rounded">{status.replace(/_/g, ' ')}</span>;
    }
  };

  const renderTaskCard = (task: any, borderColor: string) => (
    <div key={task.id} className={`bg-card p-4 rounded-xl shadow-sm border ${borderColor}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-sm">{task.order?.orderNumber || "Unknown"}</span>
        {getStatusBadge(task.status)}
      </div>
      <p className="text-sm font-medium">{task.productName || task.parentItem?.productName || "Custom Request"}</p>
      {task.assignedVendor?.name && (
        <p className="text-xs text-muted-foreground mt-1">Assigned to: {task.assignedVendor.name}</p>
      )}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> 
          Due: {task.order?.targetDate ? format(new Date(task.order.targetDate), 'MMM d, p') : "N/A"}
        </span>
        <button className="text-primary font-bold hover:underline">Re-assign</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <BackButton fallback="/sales" label="Back to Sales" variant="outline" size="sm" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shop className="w-6 h-6 text-primary" /> Vendor Coordination
          </h2>
          <p className="text-muted-foreground text-sm">Assign and track external vendors for specialized cakes.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTasks} className="bg-white border border-border text-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 flex items-center gap-2">
            <Refresh2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 flex items-center gap-2">
            <Add className="w-4 h-4" /> Register New Vendor
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center justify-between">
          <p>{error}</p>
          <button onClick={fetchTasks} className="underline hover:no-underline">Retry</button>
        </div>
      )}

      {isLoading && !error && tasks.length === 0 ? (
        <div className="h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Photographers */}
          <div className="bg-secondary/20 border border-border rounded-xl flex flex-col h-[70vh]">
            <div className="p-4 border-b border-border/50 bg-card rounded-t-xl shrink-0 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Camera className="w-5 h-5" /> Photographers
              </h3>
              <span className="text-xs bg-secondary px-2 py-1 rounded-full font-bold">{photographers.length} Active</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {photographers.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p className="text-sm font-medium">No active tasks</p>
                </div>
              ) : (
                photographers.map(t => renderTaskCard(t, 'border-border'))
              )}
            </div>
          </div>

          {/* Florists */}
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl flex flex-col h-[70vh]">
            <div className="p-4 border-b border-rose-500/20 bg-rose-500/10 rounded-t-xl shrink-0 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Reserve className="w-5 h-5" /> Florists
              </h3>
              <span className="text-xs bg-rose-500 text-white px-2 py-1 rounded-full font-bold">{florists.length} Active</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {florists.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p className="text-sm font-medium">No active tasks</p>
                </div>
              ) : (
                florists.map(t => renderTaskCard(t, 'border-rose-500/30'))
              )}
            </div>
          </div>

          {/* Acrylic Artists */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl flex flex-col h-[70vh]">
            <div className="p-4 border-b border-blue-500/20 bg-blue-500/10 rounded-t-xl shrink-0 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <MagicStar className="w-5 h-5" /> Acrylic Toppers
              </h3>
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-bold">{acrylics.length} Active</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {acrylics.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p className="text-sm font-medium">No active tasks</p>
                </div>
              ) : (
                acrylics.map(t => renderTaskCard(t, 'border-blue-500/30'))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

