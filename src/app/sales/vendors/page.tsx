"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Shop, Camera, Reserve, MagicStar, Add, Clock, Refresh2, Calendar } from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";
import { format } from "date-fns";
import { matchesDayFilter } from "@/lib/formatTime";
import { toBranchId } from "@/lib/branches";

export default function VendorManagementPage() {
  const { data: session } = useSession();
  const activeBranch = (session?.user as any)?.branchId || "";

  const [tasks, setTasks] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<'TODAY' | 'TOMORROW' | 'ALL'>('TODAY');

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/vendor/tasks");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch vendor tasks");
      setTasks(json.data);
      if (json.vendors) setVendors(json.vendors);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks that are non-cancelled and scoped to active branch if salesperson
  const scopedTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.order?.status === 'CANCELLED') return false;
      if (activeBranch && t.order?.branchId) {
        if (toBranchId(t.order.branchId) !== toBranchId(activeBranch)) return false;
      }
      return true;
    });
  }, [tasks, activeBranch]);

  // Counts for the day filters
  const todayCount = useMemo(() => {
    return scopedTasks.filter(t => matchesDayFilter(t.order?.targetDate, 'TODAY')).length;
  }, [scopedTasks]);

  const tomorrowCount = useMemo(() => {
    return scopedTasks.filter(t => matchesDayFilter(t.order?.targetDate, 'TOMORROW')).length;
  }, [scopedTasks]);

  const allCount = scopedTasks.length;

  // Filtered tasks based on active day filter
  const visibleTasks = useMemo(() => {
    if (dayFilter === 'ALL') return scopedTasks;
    return scopedTasks.filter(t => matchesDayFilter(t.order?.targetDate, dayFilter));
  }, [scopedTasks, dayFilter]);

  const photographers = useMemo(() => visibleTasks.filter(t => t.assignedVendor?.role === "VENDOR_PHOTO"), [visibleTasks]);
  const florists = useMemo(() => visibleTasks.filter(t => t.assignedVendor?.role === "VENDOR_FLORIST"), [visibleTasks]);
  const acrylics = useMemo(() => visibleTasks.filter(t => t.assignedVendor?.role === "VENDOR_ACRYLIC"), [visibleTasks]);

  const photoVendors = useMemo(() => vendors.filter(v => v.role === "VENDOR_PHOTO"), [vendors]);
  const floristVendors = useMemo(() => vendors.filter(v => v.role === "VENDOR_FLORIST"), [vendors]);
  const acrylicVendors = useMemo(() => vendors.filter(v => v.role === "VENDOR_ACRYLIC"), [vendors]);

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "pending":
      case "waiting_for_chef":
      case "assigned":
        return <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">Pending Vendor Acceptance</span>;
      case "accepted":
      case "chef_accepted":
        return <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded">Vendor Accepted</span>;
      case "making":
      case "in_production":
      case "decorating":
        return <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded">In Production</span>;
      case "packed":
      case "ready":
      case "ready_for_pickup":
        return <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">Ready / Dispatched</span>;
      case "delivered":
      case "completed":
        return <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 border border-teal-300 px-2 py-0.5 rounded">Completed</span>;
      default:
        return <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded">{status.replace(/_/g, ' ')}</span>;
    }
  };

  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const renderTaskCard = (task: any, borderColor: string) => {
    const bouquetImg = task.parentItem?.gallery?.[0] 
      || task.designImageUrl 
      || task.customerPhotoUrl 
      || task.parentItem?.designImageUrl 
      || task.image 
      || task.parentItem?.image 
      || "";

    const vendorPhone = task.assignedVendor?.phone 
      || (task.assignedVendor?.role === 'VENDOR_FLORIST' ? '9558951977' : '') 
      || (task.productName?.toLowerCase().includes('flower') || task.productName?.toLowerCase().includes('bouquet') ? '9558951977' : '');

    const itemName = task.parentItem?.productName || task.productName || "Custom Order";
    const orderNum = task.order?.orderNumber || task.order?.id?.slice(-6) || "Order";
    const dueDateStr = task.order?.targetDate ? format(new Date(task.order.targetDate), 'dd MMM, hh:mm a') : "ASAP";
    const branchName = task.order?.branch?.name || "Main Kitchen";
    const notesStr = task.instructions || task.parentItem?.notes || "";

    const waText = encodeURIComponent(
      `🌸 *GOPAL CAKES — VENDOR DISPATCH*\n\n` +
      `*Order:* #${orderNum}\n` +
      `*Item:* ${itemName} (Qty: ${task.quantity || 1})\n` +
      `*Due:* ${dueDateStr}\n` +
      `*Branch:* ${branchName}\n` +
      (notesStr ? `*Notes:* ${notesStr}\n` : '') +
      (bouquetImg ? `*Photo Link:* ${bouquetImg}\n` : '') +
      `\nPlease confirm acceptance.`
    );

    const taskCreatedAt = task.createdAt || task.order?.createdAt;
    const minsElapsed = taskCreatedAt ? Math.floor((Date.now() - new Date(taskCreatedAt).getTime()) / 60000) : 0;
    const isUnacceptedOverdue = ['pending', 'waiting_for_chef', 'assigned'].includes((task.status || '').toLowerCase()) && minsElapsed >= 60;
    const isRejected = (task.status || '').toLowerCase() === 'rejected';

    return (
      <div key={task.id} className={`bg-card p-4 rounded-xl shadow-sm border ${isUnacceptedOverdue || isRejected ? 'border-rose-400 bg-rose-50/20' : borderColor} flex flex-col justify-between gap-3`}>
        <div>
          <div className="flex justify-between items-start mb-2 gap-1.5 flex-wrap">
            <span className="font-mono font-bold text-sm bg-gray-100 px-2 py-0.5 rounded">#{orderNum}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {isRejected ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded">
                  ⚠️ Rejected ({minsElapsed}m)
                </span>
              ) : isUnacceptedOverdue ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded animate-pulse">
                  ⚠️ SLA Breach ({minsElapsed}m)
                </span>
              ) : null}
              {getStatusBadge(task.status)}
            </div>
          </div>

          <div className="flex gap-3 items-start mt-2">
            {bouquetImg ? (
              <div 
                onClick={() => setFullscreenImage(bouquetImg)}
                className="w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0 cursor-pointer relative group bg-black/5"
                title="Click to view full photo"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bouquetImg} alt={itemName} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold">
                  🔍
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 border border-border shrink-0 flex items-center justify-center text-xs text-gray-400 font-bold">
                No Img
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">{itemName}</p>
              {task.assignedVendor?.name && (
                <p className="text-xs text-muted-foreground mt-1">
                  👤 <span className="font-semibold text-gray-800">{task.assignedVendor.name}</span>
                  {vendorPhone && <span className="ml-1 text-[10px] text-gray-500 font-mono">({vendorPhone})</span>}
                </p>
              )}
              {notesStr && (
                <p className="text-xs bg-amber-50 text-amber-900 border border-amber-200 p-1.5 rounded-md mt-1.5 font-medium italic">
                  📝 &quot;{notesStr}&quot;
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> 
              Due: {dueDateStr}
            </span>
            <span className="text-[10px] uppercase font-bold text-gray-500">{branchName}</span>
          </div>

          {vendorPhone && (
            <a
              href={`https://wa.me/91${vendorPhone.replace(/\D/g, '')}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs active:scale-[0.98]"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.158.572 4.186 1.569 5.941l-1.669 6.095 6.257-1.641c1.706.929 3.659 1.458 5.738 1.458 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z"/></svg>
              Send Photo & Details on WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  };

  const renderVendorList = (vList: any[]) => {
    if (vList.length === 0) return null;
    return (
      <div className="mb-4 pb-4 border-b border-border/50">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Registered Vendors</p>
        <div className="flex flex-wrap gap-2">
          {vList.map(v => (
            <div key={v.id} className="bg-white border border-border px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
              <div className="w-5 h-5 rounded-full bg-secondary/30 flex items-center justify-center text-xs font-bold text-primary">
                {v.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold leading-none">{v.name}</p>
                {v.phone && <p className="text-[9px] text-muted-foreground mt-0.5">{v.phone}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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

      {/* Date Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-[#FFF8F0] p-1.5 rounded-2xl border border-[#C5A059]/20 shadow-sm">
          <button
            onClick={() => setDayFilter('TODAY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              dayFilter === 'TODAY'
                ? 'bg-[#3E2723] text-white shadow-sm'
                : 'text-[#3E2723]/70 hover:text-[#3E2723] hover:bg-black/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              dayFilter === 'TODAY' ? 'bg-amber-400 text-[#3E2723]' : 'bg-black/10 text-gray-700'
            }`}>{todayCount}</span>
          </button>

          <button
            onClick={() => setDayFilter('TOMORROW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              dayFilter === 'TOMORROW'
                ? 'bg-[#3E2723] text-white shadow-sm'
                : 'text-[#3E2723]/70 hover:text-[#3E2723] hover:bg-black/5'
            }`}
          >
            <span>Tomorrow</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              dayFilter === 'TOMORROW' ? 'bg-amber-400 text-[#3E2723]' : 'bg-black/10 text-gray-700'
            }`}>{tomorrowCount}</span>
          </button>

          <button
            onClick={() => setDayFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              dayFilter === 'ALL'
                ? 'bg-[#3E2723] text-white shadow-sm'
                : 'text-[#3E2723]/70 hover:text-[#3E2723] hover:bg-black/5'
            }`}
          >
            <span>All Tasks</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              dayFilter === 'ALL' ? 'bg-amber-400 text-[#3E2723]' : 'bg-black/10 text-gray-700'
            }`}>{allCount}</span>
          </button>
        </div>

        <p className="text-xs text-muted-foreground font-medium">
          Showing <span className="font-bold text-foreground">{visibleTasks.length}</span> {dayFilter === 'TODAY' ? "today's" : dayFilter === 'TOMORROW' ? "tomorrow's" : "active"} vendor tasks
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center justify-between">
          <p>{error}</p>
          <button onClick={fetchTasks} className="underline hover:no-underline">Retry</button>
        </div>
      )}

      {isLoading && !error && tasks.length === 0 && vendors.length === 0 ? (
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
              <span className="text-xs bg-secondary px-2 py-1 rounded-full font-bold">{photographers.length} Tasks</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              {renderVendorList(photoVendors)}
              {photographers.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm font-medium">No active tasks</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {photographers.map(t => renderTaskCard(t, 'border-border'))}
                </div>
              )}
            </div>
          </div>

          {/* Florists */}
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl flex flex-col h-[70vh]">
            <div className="p-4 border-b border-rose-500/20 bg-rose-500/10 rounded-t-xl shrink-0 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Reserve className="w-5 h-5" /> Florists
              </h3>
              <span className="text-xs bg-rose-500 text-white px-2 py-1 rounded-full font-bold">{florists.length} Tasks</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              {renderVendorList(floristVendors)}
              {florists.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm font-medium">No active tasks</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {florists.map(t => renderTaskCard(t, 'border-rose-500/30'))}
                </div>
              )}
            </div>
          </div>

          {/* Acrylic Artists */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl flex flex-col h-[70vh]">
            <div className="p-4 border-b border-blue-500/20 bg-blue-500/10 rounded-t-xl shrink-0 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <MagicStar className="w-5 h-5" /> Acrylic Toppers
              </h3>
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-bold">{acrylics.length} Tasks</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              {renderVendorList(acrylicVendors)}
              {acrylics.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm font-medium">No active tasks</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {acrylics.map(t => renderTaskCard(t, 'border-blue-500/30'))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {fullscreenImage && (
        <div 
          onClick={() => setFullscreenImage(null)} 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-4 cursor-pointer"
        >
          <button 
            onClick={() => setFullscreenImage(null)} 
            className="absolute top-6 right-6 text-white bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all text-xl font-bold leading-none"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={fullscreenImage} 
            alt="Fullscreen preview" 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20" 
          />
        </div>
      )}
    </div>
  );
}

