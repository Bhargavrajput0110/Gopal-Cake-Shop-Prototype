"use client";

import { useState, useEffect, useRef } from "react";
import { Call, TickCircle, Warning2, Gift, Reserve, Notification, Clock, Lock1, Edit2, CloseSquare } from "iconsax-react";
import { useOrders, Order, TimelineEvent } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";
import { SearchNormal1 } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { StaffChatWidget } from "@/components/chat/StaffChatWidget";
import { toBranchId, toBranchShortName, BRANCHES, type BranchId } from "@/lib/branches";


import { fetchClient } from "@/lib/api/client";
import { OrderEditModal } from "@/components/sales/OrderEditModal";
import { WhatsAppToast } from "@/components/ui/WhatsAppToast";
import { BackButton } from "@/components/ui/BackButton";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playUnapprovedSiren() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const playChimeTone = (freq: number, startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = "sine"; // Melodic sine wave
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      osc.start(startTime); osc.stop(startTime + 0.4);
    };
    // Gentle melodic double chime (C5 then E5)
    playChimeTone(523.25, ctx.currentTime);
    playChimeTone(659.25, ctx.currentTime + 0.15);
  } catch {}
}

function playPriorityBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const playBeep = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 1400; // High urgent pitch
      osc.type = "sawtooth"; // Intrusive sawtooth wave
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
      osc.start(startTime); osc.stop(startTime + 0.12);
    };
    // 4 rapid high-alert staccato pulses
    playBeep(ctx.currentTime);
    playBeep(ctx.currentTime + 0.15);
    playBeep(ctx.currentTime + 0.3);
    playBeep(ctx.currentTime + 0.45);
  } catch {}
}

function SalesDashboardContent() {
  const { updateOrderStatus, updateOrderFields } = useOrders();
  const [serverOrders, setServerOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [newOrderPopup, setNewOrderPopup] = useState<Order | null>(null);
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null);
  const seenOrderIds = useRef<Set<string>>(new Set());
  
  // Edit & Toast State
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [vendorAssignOrder, setVendorAssignOrder] = useState<Order | null>(null);
  const [toastData, setToastData] = useState({ show: false, msg: "", rec: "" });

  // Calendar / Date Filters
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "next3days" | "next15days" | "custom">("all");
  const [customDate, setCustomDate] = useState("");

  const filters = ["All","NEW","Waiting for Chef","In Kitchen","Ready","Delivery"];

  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employeeId") || "";

  // Determine branch using canonical IDs
  const [activeBranch, setActiveBranch] = useState<BranchId>(() => {
    if (employeeId.includes("-UMA-")) return "uma";
    if (employeeId.includes("-KHM-")) return "khanderao";
    if (employeeId.includes("-ELR-")) return "elora";
    if (employeeId.includes("-WAS-")) return "varasiya";
    return "khanderao"; // Default
  });

  useEffect(() => {
    if (employeeId) {
      if (employeeId.includes("-UMA-")) setActiveBranch("uma");
      else if (employeeId.includes("-KHM-")) setActiveBranch("khanderao");
      else if (employeeId.includes("-ELR-")) setActiveBranch("elora");
      else if (employeeId.includes("-WAS-")) setActiveBranch("varasiya");
    }
  }, [employeeId]);
  
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== "") setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchOrders = async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      params.append("branch", activeBranch);
      
      let statusParams = "";
      if (filter === "NEW") statusParams = "NEW,QUOTE_DRAFT,QUOTE_SENT";
      else if (filter === "Waiting for Chef") statusParams = "WAITING_FOR_CHEF";
      else if (filter === "In Kitchen") statusParams = "CHEF_ACCEPTED,MAKING,DECORATING";
      else if (filter === "Ready") statusParams = "READY_FOR_PICKUP";
      else if (filter === "Delivery") statusParams = "PENDING_ASSIGNMENT,ASSIGNED_TO_DRIVER,PICKED_UP,ON_THE_WAY,DELIVERED";
      
      if (statusParams) params.append("status", statusParams);
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      
      // Date logic
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const tomorrow = new Date(Date.now() + 86400000);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      
      if (dateFilter === "today") {
        params.append("startDate", todayStr);
        params.append("endDate", todayStr);
      } else if (dateFilter === "tomorrow") {
        params.append("startDate", tomorrowStr);
        params.append("endDate", tomorrowStr);
      } else if (dateFilter === "custom" && customDate) {
        params.append("startDate", customDate);
        params.append("endDate", customDate);
      } else if (dateFilter === "next3days") {
        params.append("startDate", todayStr);
        const next3 = new Date(Date.now() + 3 * 86400000);
        params.append("endDate", `${next3.getFullYear()}-${String(next3.getMonth() + 1).padStart(2, '0')}-${String(next3.getDate()).padStart(2, '0')}`);
      } else if (dateFilter === "next15days") {
        params.append("startDate", todayStr);
        const next15 = new Date(Date.now() + 15 * 86400000);
        params.append("endDate", `${next15.getFullYear()}-${String(next15.getMonth() + 1).padStart(2, '0')}-${String(next15.getDate()).padStart(2, '0')}`);
      }
      
      const res = await fetchClient<any>(`/api/v1/orders?${params.toString()}`, { signal });
      if (res.success) {
        setServerOrders(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      } else {
        throw new Error(res.error?.message || "Failed to fetch orders");
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, debouncedSearch, dateFilter, customDate, activeBranch]);

  const unapprovedCount = serverOrders.filter(o => o.status === "NEW").length;
  const priorityAlertCount = serverOrders.filter(o => 
    (o.status === "NEW" || o.status === "QUOTE_DRAFT") && o.priorityLevel !== "normal"
  ).length;

  // Click handler to unlock browser AudioContext autoplay policy
  useEffect(() => {
    const handleGesture = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
    };
    window.addEventListener("click", handleGesture);
    window.addEventListener("touchstart", handleGesture);
    return () => {
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };
  }, []);

  // Detect new orders and trigger notification popup + sound
  useEffect(() => {
    const newOrders = serverOrders.filter(o => o.status === "NEW" && !seenOrderIds.current.has(o.id));
    if (newOrders.length > 0) {
      const newest = newOrders[0]; // Show popup for most recent
      setNewOrderPopup(newest);
      // Mark all as seen
      newOrders.forEach(o => seenOrderIds.current.add(o.id));
    }
  }, [serverOrders]);

  useEffect(() => {
    if (unapprovedCount > 0 || priorityAlertCount > 0) {
      if (priorityAlertCount > 0) {
        playPriorityBeep();
      } else {
        playUnapprovedSiren();
      }
      
      const interval = setInterval(() => {
        if (priorityAlertCount > 0) {
          playPriorityBeep();
        } else {
          playUnapprovedSiren();
        }
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [unapprovedCount, priorityAlertCount]);


  // No client-side filtering needed anymore

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-6 min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] flex flex-col pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="mb-2">
            <BackButton fallback="/sales" label="Back to Sales" variant="outline" size="sm" />
          </div>
          <h2 className="text-3xl font-black tracking-tight font-serif text-[#3E2723] flex items-center gap-2">
            Orders
            <span className="ml-2 bg-[#3E2723] text-white px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
              {toBranchShortName(activeBranch)} Branch
            </span>
          </h2>
          <p className="text-muted-foreground text-xs mt-0.5 tracking-wide">Manage, track, and dispatch your daily queue.</p>
        </div>
      </div>

      {/* Sticky Header Group for Mobile */}
      <div className="sticky top-0 z-40 bg-[var(--background)]/90 backdrop-blur-md pb-2 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:shadow-none border-b border-border/50 sm:border-none rounded-b-2xl sm:rounded-none">
        {/* Search */}
        <div className="relative shrink-0">
          <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            type="text"
            placeholder="Search by Order ID, Customer Name, Phone, or Cake..."
            className="w-full pl-9 pr-4 py-3 sm:py-2.5 rounded-xl border border-[#C5A059]/30 bg-white/80 backdrop-blur-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 shadow-sm" 
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><CloseSquare className="w-4 h-4" /></button>}
        </div>

        {/* Filters */}
        <div className="flex overflow-x-auto gap-2 pb-2 shrink-0 hide-scrollbar">
          {filters.map(f=>(
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 sm:py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter===f?"bg-[#C5A059] text-[#3E2723] shadow-sm":"bg-secondary text-muted-foreground hover:bg-[#C5A059]/20 hover:text-[#3E2723]"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Calendar Date Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0 hide-scrollbar">
          <button 
            onClick={() => {
              setDateFilter("all");
              setCustomDate("");
            }}
            className={`px-3.5 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all ${dateFilter === "all" ? "bg-[#3E2723] text-white" : "bg-secondary text-muted-foreground"}`}
          >
            All Dates
          </button>
          <button 
            onClick={() => {
              setDateFilter("today");
              const today = new Date();
              setCustomDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
            }}
            className={`px-3.5 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all ${dateFilter === "today" ? "bg-[#3E2723] text-white" : "bg-secondary text-muted-foreground"}`}
          >
            Today
          </button>
          <button 
            onClick={() => {
              setDateFilter("tomorrow");
              const tomorrow = new Date(Date.now() + 86400000);
              setCustomDate(`${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`);
            }}
            className={`px-3.5 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all ${dateFilter === "tomorrow" ? "bg-[#3E2723] text-white" : "bg-secondary text-muted-foreground"}`}
          >
            Tomorrow
          </button>
          <button 
            onClick={() => {
              setDateFilter("next3days");
              const today = new Date();
              setCustomDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
            }}
            className={`px-3.5 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all ${dateFilter === "next3days" ? "bg-[#3E2723] text-white" : "bg-secondary text-muted-foreground"}`}
          >
            Next 3 Days
          </button>
          <button 
            onClick={() => {
              setDateFilter("next15days");
              const today = new Date();
              setCustomDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
            }}
            className={`px-3.5 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all ${dateFilter === "next15days" ? "bg-[#3E2723] text-white" : "bg-secondary text-muted-foreground"}`}
          >
            Next 15 Days
          </button>
          
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] sm:text-xs text-muted-foreground font-bold whitespace-nowrap">Pick Date:</span>
            <input 
              type="date" 
              value={customDate} 
              onChange={(e) => {
                const val = e.target.value;
                setCustomDate(val);
                
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                
                const tomorrow = new Date(Date.now() + 86400000);
                const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
                
                if (val === todayStr) { setDateFilter("today"); setPage(1); }
                else if (val === tomorrowStr) { setDateFilter("tomorrow"); setPage(1); }
                else if (val === "") { setDateFilter("all"); setPage(1); }
                else { setDateFilter("custom"); setPage(1); }
              }}
              className="p-1.5 sm:p-1 rounded-lg border border-border text-xs bg-white text-foreground focus:ring-2 focus:ring-[#C5A059]/50"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2" data-lenis-prevent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A059]"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-rose-500 font-bold">
            <Warning2 className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={() => fetchOrders()} variant="outline" className="mt-4">Retry</Button>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {serverOrders.map(order=>(
                <OrderDetailsCard 
                  key={order.id} 
                  order={order} 
                  onViewTimeline={()=>setTimelineOrder(order)} 
                  onEdit={()=>setEditOrder(order)}
                  onAssignVendor={()=>setVendorAssignOrder(order)}
                  onWhatsApp={(msg)=>setToastData({show:true, msg, rec: order.customerPhone})}
                  onMutated={() => fetchOrders()}
                />
              ))}
            </AnimatePresence>
            {serverOrders.length===0 && (
              <div className="text-center py-20 opacity-50">
                <TickCircle className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="font-bold">No orders found.</p>
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-6 pb-4">
                <Button 
                  variant="outline" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm font-bold text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Order Popup — real data from Supabase */}
      <AnimatePresence>
        {newOrderPopup && (
          <motion.div key="new-order-popup" initial={{opacity:0,scale:0.8,y:50}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.8,y:50}}
            className="fixed bottom-24 right-6 w-80 bg-white/95 backdrop-blur-xl border-2 border-[#C5A059] shadow-2xl rounded-2xl p-4 z-50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#C5A059]/20 text-[#3E2723] rounded-full animate-pulse"><Notification className="w-6 h-6" /></div>
              <div className="flex-1">
                <h4 className="font-black text-[#3E2723] text-sm">🎂 NEW ORDER ARRIVED!</h4>
                <p className="text-sm font-bold text-[#C5A059] mt-0.5">{newOrderPopup.id}</p>
                <p className="text-xs font-medium text-foreground mt-1 truncate">{newOrderPopup.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {newOrderPopup.items?.map((i: any) => i.name).join(", ")}
                </p>
                <p className="text-xs font-bold text-emerald-600 mt-1">₹{newOrderPopup.grandTotal?.toFixed(0)}</p>
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => { setNewOrderPopup(null); setFilter("NEW"); }}
                    className="flex-1 bg-[#3E2723] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#3E2723]/90 transition-transform active:scale-95"
                  >
                    View Details
                  </button>
                  <button onClick={() => setNewOrderPopup(null)} className="px-3 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200">
                    Dismiss
                  </button>
                </div>
              </div>
              <button onClick={() => setNewOrderPopup(null)} className="text-gray-400 hover:text-gray-600 shrink-0"><CloseSquare className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Order Modal */}
      <AnimatePresence>
        {editOrder && (
          <OrderEditModal 
            order={editOrder} 
            onClose={() => setEditOrder(null)} 
            onSuccess={() => setToastData({ show: true, msg: "Order updated successfully", rec: editOrder.customerPhone })} 
          />
        )}
      </AnimatePresence>

      {/* Vendor Assign Modal */}
      <AnimatePresence>
        {vendorAssignOrder && (
          <VendorAssignModal 
            order={vendorAssignOrder} 
            onClose={() => setVendorAssignOrder(null)} 
            onWhatsApp={(msg) => setToastData({ show: true, msg, rec: vendorAssignOrder.customerPhone })} 
          />
        )}
      </AnimatePresence>

      {/* WhatsApp Toast */}
      <WhatsAppToast 
        show={toastData.show} 
        message={toastData.msg} 
        recipient={toastData.rec} 
        onClose={() => setToastData(prev => ({ ...prev, show: false }))} 
      />

      {/* Timeline Modal */}
      <AnimatePresence>
        {timelineOrder && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={()=>setTimelineOrder(null)}>
            <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:60}}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e=>e.stopPropagation()}>
              <div className="bg-[#3E2723] p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5" />
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-widest">Order Timeline</h3>
                    <p className="text-white/60 text-[10px]">{timelineOrder.id}</p>
                  </div>
                </div>
                <button onClick={()=>setTimelineOrder(null)} className="text-white/80 hover:text-white"><CloseSquare className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {(timelineOrder.timeline||[]).length===0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">No events yet.</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-5">
                      {[...(timelineOrder.timeline||[]) as TimelineEvent[]].reverse().map((ev,i)=>(
                        <div key={i} className="flex gap-4 items-start pl-2">
                          <div className="w-6 h-6 rounded-full bg-[#C5A059] border-2 border-white shadow-sm shrink-0 flex items-center justify-center z-10">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{ev.event}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{ev.actor} &bull; {new Date(ev.timestamp).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time internal staff messaging hub */}
      <StaffChatWidget 
        senderId={employeeId || "SALES-01"} 
        senderName="Pooja Mehta" 
        senderRole="sales" 
        branch={activeBranch} 
        channel="sales" 
      />
    </motion.div>
  );
}

export default function OrderManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-bold">Loading Sales display...</div>}>
      <SalesDashboardContent />
    </Suspense>
  );
}

function OrderDetailsCard({ order, onViewTimeline, onEdit, onAssignVendor, onWhatsApp, onMutated }: { order: Order; onViewTimeline: () => void; onEdit: () => void; onAssignVendor: () => void; onWhatsApp: (msg: string) => void; onMutated: () => void }) {
  const { updateOrderStatus, updateOrderFields, updateVendorTaskStatus } = useOrders();
  const [selectedDiscount, setSelectedDiscount] = useState<number>(50);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const isLocked = ["CHEF_ACCEPTED","MAKING","DECORATING","READY_FOR_PICKUP","PENDING_ASSIGNMENT","ASSIGNED_TO_DRIVER","PICKED_UP","ON_THE_WAY","DELIVERED"].includes(order.status);
  const canEdit = !isLocked;

  const handleApprove = async () => {
    await updateOrderStatus(order.id,"WAITING_FOR_CHEF");
    onWhatsApp("Hi! Your order is confirmed and sent to the kitchen. 🎂");
    onMutated();
  };

  const handleCollectPayment = async () => {
    await updateOrderFields(order.id, { pendingBalance: 0, advancePaid: order.grandTotal });
    onWhatsApp("Thank you! Your payment has been received and balance is settled. 🎉");
    onMutated();
  };

  const handleSendQuote = async () => {
    setSubmittingQuote(true);
    try {
      await updateOrderStatus(order.id, "QUOTE_SENT", false, "Salesperson", { discount: selectedDiscount });
      onWhatsApp(`Special discount of ₹${selectedDiscount} applied! Your new total is ₹${order.grandTotal - selectedDiscount}`);
      onMutated();
    } catch (e) {
      console.error(e);
      alert("Failed to apply quote discount");
    } finally {
      setSubmittingQuote(false);
    }
  };

  const statusLabel = (s: string) => {
    if(s==="NEW") return "Pending Verification";
    if(s==="QUOTE_DRAFT") return "Quote Requested (Bargain)";
    if(s==="QUOTE_SENT") return "Quote Sent (Awaiting Pay)";
    if(s==="WAITING_FOR_CHEF") return "Waiting for Chef";
    if(s==="CHEF_ACCEPTED") return "Chef Accepted";
    if(s==="MAKING") return "Chef is Baking";
    if(s==="DECORATING") return "Chef is Decorating";
    if(s==="READY_FOR_PICKUP") return "Ready for Pickup";
    if(s==="PENDING_ASSIGNMENT") return "In Delivery Pool";
    if(s==="ON_THE_WAY") return "Out for Delivery";
    if(s==="DELIVERED") return "DELIVERED";
    return s.replace(/_/g," ");
  };

  const pendingVendorTasks = order.vendorTasks?.filter(vt => vt.status === 'pending') || [];

  return (
    <motion.div layout initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
      className="bg-white/80 backdrop-blur-md border border-[#C5A059]/20 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row group hover:border-[#C5A059]/50 transition-all duration-300 hover:shadow-md relative">

      <div className="w-full h-24 md:w-44 md:h-auto bg-secondary/30 shrink-0 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-[#C5A059]/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={order.cakeImage||"https://images.unsplash.com/photo-1562777717-b6c338435d72?auto=format&fit=crop&q=80&w=200&h=200"} alt="Cake" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
        {order.isSurprise && (
          <div className="absolute bottom-2 right-2 bg-purple-500/90 text-white backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
            <Gift className="w-2.5 h-2.5" /> Surprise
          </div>
        )}
      </div>

      <div className="p-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-xl font-serif font-black text-[#3E2723]">{order.id}</h3>
            <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
              {statusLabel(order.status)}
            </span>
            {order.delayLevel==="delayed" && <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse"><Warning2 className="w-2.5 h-2.5"/>Delayed</span>}
            {order.delayLevel==="warning" && <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><Warning2 className="w-2.5 h-2.5"/>Issue</span>}
            {isLocked && <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><Lock1 className="w-2.5 h-2.5"/>Locked</span>}
            {(order as any).transferHistory && (order as any).transferHistory.length > 0 && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                Transferred
              </span>
            )}
          </div>
          
          {/* Transfer History View */}
          {(order as any).transferHistory && (order as any).transferHistory.length > 0 && (
            <div className="mb-3 p-2.5 bg-emerald-50/30 border border-emerald-100 rounded-lg flex items-center gap-2 overflow-x-auto hide-scrollbar shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]">
              <span className="text-[9px] font-black text-emerald-600/70 uppercase tracking-widest shrink-0">Branch Ops:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-900 shrink-0">{toBranchShortName((order as any).transferHistory[0].from)}</span>
                {(order as any).transferHistory.map((th: any, i: number) => (
                  <span key={i} className="flex items-center gap-1.5 shrink-0">
                    <span className="text-emerald-300 text-[10px] font-black">➔</span>
                    <span className="text-xs font-bold text-emerald-900">{th.to}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            {order.items.map((item,i)=>(
              <p key={i} className="text-sm font-bold text-foreground">{item.qty}x {item.name || (item as any).productName}{item.weight&&<span className="text-muted-foreground font-normal"> ({item.weight})</span>}</p>
            ))}
          </div>
          {order.items.some(i=>i.notes) && (
            <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs font-bold italic">
              Note: &quot;{order.items.find(i=>i.notes)?.notes}&quot;
            </div>
          )}
          {order.customerInstructions && (
            <div className="mt-2.5 p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-900 text-xs font-bold italic">
              Instructions: &quot;{order.customerInstructions}&quot;
            </div>
          )}
          {/* Ingredient Requests */}
          {(order.ingredientRequests||[]).some(r=>r.status==="pending") && (
            <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-md">
              <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Ingredient Requests from Kitchen</p>
              {order.ingredientRequests?.filter(r=>r.status==="pending").map((r: any,i: number)=>(
                <p key={i} className="text-xs font-bold text-rose-800">&bull; {r.itemName}{r.note?` (${r.note})`:""}</p>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Customer</p>
                <p className="text-xs font-bold text-foreground">{order.customerName}</p>
                <p className="text-[10px] text-muted-foreground">{order.customerPhone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Payment</p>
                <p className="text-xs font-bold text-foreground">Total: ₹{order.grandTotal} &middot; Pending: <span className="text-destructive">₹{order.pendingBalance}</span></p>
                {order.pendingBalance>0 && <p className="text-[10px] text-rose-600 font-bold">Pending: ₹{order.pendingBalance}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 p-2 rounded-lg">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold" suppressHydrationWarning>Due: {new Date(order.timeTarget).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:true})}</span>
            </div>
            {order.vendorTasks && order.vendorTasks.length>0 && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {order.vendorTasks.map((vt,i) => {
                  const labelMap = {
                    pending: "Pending",
                    accepted: "Assigned",
                    in_progress: "In Progress",
                    ready: "✓ Ready"
                  };
                  return (
                    <span key={i} className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${vt.status==="ready"?"bg-emerald-50 text-emerald-700 border-emerald-200": vt.status === "accepted" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20"}`}>
                      <Reserve className="w-2.5 h-2.5" />{vt.vendorType} - {vt.vendorName ? `${vt.vendorName} (${labelMap[vt.status]})` : labelMap[vt.status]}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bargain Negotiation Control Panel */}
          {order.status === "QUOTE_DRAFT" && (
            <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Negotiate Price & Discount</span>
              <div className="flex gap-2">
                {[50, 100, 150, 200].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedDiscount(amt)}
                    className={`flex-1 py-1 rounded text-xs font-bold transition-all ${selectedDiscount === amt ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white border border-border text-foreground hover:bg-secondary'}`}
                  >
                    -₹{amt}
                  </button>
                ))}
              </div>
              <button
                disabled={submittingQuote}
                onClick={handleSendQuote}
                className="w-full bg-[#C5A059] text-white py-2 rounded-md text-xs font-bold hover:bg-[#b08c48] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                Send Negotiated Quote (New Total: ₹{order.grandTotal - selectedDiscount})
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-4 flex gap-2 pt-3 border-t border-border relative z-10 items-center">
            {order.status==="NEW" && (
              <button onClick={handleApprove} className="flex-1 bg-emerald-500 text-white px-3 py-3 md:py-2 rounded-xl md:rounded-md text-sm md:text-xs font-bold hover:bg-emerald-600 flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95">
                <TickCircle className="w-4 h-4 md:w-3.5 md:h-3.5" /> Approve
              </button>
            )}
            {order.pendingBalance > 0 && order.status !== "NEW" && (
              <button onClick={handleCollectPayment} className="flex-1 bg-amber-500 text-white px-3 py-3 md:py-2 rounded-xl md:rounded-md text-sm md:text-xs font-bold hover:bg-amber-600 flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95">
                <Gift className="w-4 h-4 md:w-3.5 md:h-3.5" /> Collect ₹{order.pendingBalance}
              </button>
            )}
            {order.pendingBalance === 0 && order.status !== "NEW" && canEdit && (
              <button onClick={onAssignVendor} className="flex-1 bg-purple-500 text-white px-3 py-3 md:py-2 rounded-xl md:rounded-md text-sm md:text-xs font-bold hover:bg-purple-600 flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 md:hidden">
                <Reserve className="w-4 h-4" /> Assign Partner
              </button>
            )}
            
            {/* Desktop: Show all secondary buttons */}
            <div className="hidden md:flex gap-2 flex-1">
               {canEdit && (
                 <button onClick={onAssignVendor} className="flex-1 bg-purple-500 text-white px-3 py-2 rounded-md text-xs font-bold hover:bg-purple-600 flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95">
                   <Reserve className="w-3.5 h-3.5" /> Assign Vendor
                 </button>
               )}
               {canEdit && (
                 <button onClick={onEdit} className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md text-xs font-bold hover:bg-blue-600 flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95">
                   <Edit2 className="w-3.5 h-3.5" /> Edit Order
                 </button>
               )}
               <button onClick={onViewTimeline} className="px-3 py-2 bg-white border border-border text-foreground rounded-md text-xs font-bold hover:bg-secondary flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                 <Clock className="w-3.5 h-3.5 text-[#C5A059]" /> Timeline
               </button>
               <button onClick={()=>onWhatsApp(`Hi ${order.customerName.split(' ')[0]}, this is Gopal Cakes calling...`)} className="px-3 py-2 bg-white border border-border text-foreground rounded-md text-xs font-bold hover:bg-secondary flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                 <Call className="w-3.5 h-3.5 text-[#C5A059]" /> Call
               </button>
            </div>

            {/* Mobile: More Actions Button */}
            <button onClick={() => setShowMoreActions(true)} className="md:hidden aspect-square px-3 py-3 bg-white text-gray-700 rounded-xl font-bold flex items-center justify-center transition-colors active:scale-95 shadow-sm border border-gray-200">
               <span className="text-xl leading-none -mt-1 font-serif">&#8942;</span>
            </button>
          </div>

          {/* Mobile Bottom Sheet for More Actions */}
          <AnimatePresence>
            {showMoreActions && (
              <>
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowMoreActions(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] md:hidden" />
                <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring", bounce:0, duration:0.4}} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] p-6 pb-safe pt-4 z-[160] md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col gap-3">
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
                  <h4 className="text-center font-black text-[#3E2723] font-serif text-xl mb-4">Order {order.id} Actions</h4>
                  
                  {canEdit && (
                    <button onClick={() => { setShowMoreActions(false); onEdit(); }} className="w-full bg-blue-50 text-blue-700 py-4 rounded-2xl font-bold flex items-center gap-3 px-4 border border-blue-200 active:scale-95 transition-transform text-left">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><Edit2 className="w-5 h-5 text-blue-600" /></div>
                      <div>
                        <div className="text-sm">Edit Order Details</div>
                        <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Modify items & info</div>
                      </div>
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={() => { setShowMoreActions(false); onAssignVendor(); }} className="w-full bg-purple-50 text-purple-700 py-4 rounded-2xl font-bold flex items-center gap-3 px-4 border border-purple-200 active:scale-95 transition-transform text-left">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0"><Reserve className="w-5 h-5 text-purple-600" /></div>
                      <div>
                        <div className="text-sm">Assign Vendor Partner</div>
                        <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Select fulfillment partners</div>
                      </div>
                    </button>
                  )}
                  <button onClick={() => { setShowMoreActions(false); onViewTimeline(); }} className="w-full bg-orange-50 text-orange-700 py-4 rounded-2xl font-bold flex items-center gap-3 px-4 border border-orange-200 active:scale-95 transition-transform text-left">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-orange-600" /></div>
                    <div>
                      <div className="text-sm">View Order Timeline</div>
                      <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Track order history</div>
                    </div>
                  </button>
                  <button onClick={() => { setShowMoreActions(false); onWhatsApp(`Hi ${order.customerName.split(' ')[0]}, this is Gopal Cakes calling...`); }} className="w-full bg-emerald-50 text-emerald-700 py-4 rounded-2xl font-bold flex items-center gap-3 px-4 border border-emerald-200 active:scale-95 transition-transform text-left">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Call className="w-5 h-5 text-emerald-600" /></div>
                    <div>
                      <div className="text-sm">Call Customer</div>
                      <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest">{order.customerPhone}</div>
                    </div>
                  </button>
                  
                  <button onClick={() => setShowMoreActions(false)} className="w-full mt-2 py-4 rounded-2xl font-bold text-gray-500 bg-gray-50 active:scale-95 transition-transform">
                    Cancel
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function VendorAssignModal({ order, onClose, onWhatsApp }: { order: Order; onClose: () => void; onWhatsApp: (msg: string) => void }) {
  const { updateOrderFields } = useOrders();
  const [selectedVendors, setSelectedVendors] = useState<Array<{name: string, type: "photo"|"flower"|"acrylic"}>>([]);

  const handleToggleVendor = (vendorName: string, vendorType: "photo" | "flower" | "acrylic") => {
    setSelectedVendors(prev => {
      const exists = prev.find(v => v.type === vendorType && v.name === vendorName);
      if (exists) return prev.filter(v => v.type !== vendorType || v.name !== vendorName);
      return [...prev, { name: vendorName, type: vendorType }];
    });
  };

  const handleConfirmVendorAssignment = () => {
    const newTasks = [...(order.vendorTasks || [])];
    selectedVendors.forEach(v => {
      const existingIndex = newTasks.findIndex(vt => vt.vendorType === v.type);
      if (existingIndex >= 0) {
        newTasks[existingIndex] = { ...newTasks[existingIndex], status: 'accepted', vendorName: v.name };
      } else {
        newTasks.push({ vendorType: v.type, status: 'accepted', vendorName: v.name, instructions: 'Assigned manually by Sales' });
      }
    });
    
    updateOrderFields(order.id, { vendorTasks: newTasks });
    if(selectedVendors.length > 0) onWhatsApp(`Notified partners for Order ${order.id}.`);
    onClose();
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl relative w-full max-w-lg flex flex-col items-center overflow-hidden">
        {/* Elegant top decoration */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-400 via-purple-600 to-indigo-600" />
        
        <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground bg-secondary p-2 rounded-full transition-all hover:scale-110 active:scale-95"><CloseSquare className="w-5 h-5" /></button>
        
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
           <Reserve className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="font-serif text-3xl font-black text-[#3E2723] mb-2 text-center">Assign Partners</h3>
        <p className="text-xs font-bold text-muted-foreground mb-8 uppercase tracking-widest text-center">
          Select fulfillment partners for {order.id}
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
          {[
            { name: "PrintMagic Studio", type: "photo" as const, icon: "📷", desc: "Photo Prints" },
            { name: "Blossom Florist", type: "flower" as const, icon: "🌸", desc: "Fresh Flowers" },
            { name: "LaserCut Pro", type: "acrylic" as const, icon: "✨", desc: "Acrylic Toppers" }
          ].map(v => {
            const isSelected = selectedVendors.some(sv => sv.name === v.name && sv.type === v.type);
            return (
              <button key={v.name} onClick={() => handleToggleVendor(v.name, v.type)} className={`border-2 rounded-2xl p-5 flex flex-col items-center gap-2 transition-all hover:scale-105 shadow-sm relative ${isSelected ? 'bg-purple-50 border-purple-500 shadow-purple-500/20' : 'bg-white border-border hover:bg-gray-50'}`}>
                <span className="w-12 h-12 bg-white border border-border rounded-full flex items-center justify-center shadow-sm text-gray-800 font-black text-2xl">{v.icon}</span>
                <span className="font-bold text-sm text-gray-900 text-center leading-tight">{v.name}</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center">{v.desc}</span>
                {isSelected && <TickCircle className="w-6 h-6 text-purple-600 absolute -top-3 -right-3 bg-white rounded-full" />}
              </button>
            );
          })}
        </div>
        
        <button onClick={handleConfirmVendorAssignment} disabled={selectedVendors.length===0} className="w-full py-4 bg-purple-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
          {selectedVendors.length > 0 ? (
             <>Confirm {selectedVendors.length} Partner{selectedVendors.length!==1?'s':''}</>
          ) : (
             <>Select a Partner</>
          )}
        </button>
      </div>
    </motion.div>
  )
}

