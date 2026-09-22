"use client";

import { useState, useEffect, useRef } from "react";
import { Call, TickCircle, Warning2, Gift, Reserve, Notification, Clock, Lock1, Edit2, CloseSquare, Receipt21 } from "iconsax-react";
import { useOrders, Order, TimelineEvent } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";
import { SearchNormal1 } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { ReceiptStub } from "@/app/sales/pos/components/ReceiptStub";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense } from "react";
import { StaffChatWidget } from "@/components/chat/StaffChatWidget";
import { toBranchId, toBranchShortName, BRANCHES, type BranchId } from "@/lib/branches";
import { useSession } from "next-auth/react";


import { fetchClient } from "@/lib/api/client";
import { OrderEditModal } from "@/components/sales/OrderEditModal";
import { OrderTimelineModal } from "@/components/sales/OrderTimelineModal";
import { SalesFilterBar } from "@/components/sales/SalesFilterBar";
import { WhatsAppToast } from "@/components/ui/WhatsAppToast";
import { BackButton } from "@/components/ui/BackButton";
import { useOrderTransitionAnimation, TransitionAnimation } from "@/hooks/useOrderTransitionAnimation";

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
  const { data: session } = useSession();
  const { updateOrderStatus, updateOrderFields, socket } = useOrders();
  const [serverOrders, setServerOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filter = searchParams.get("status") || "All";
  const search = searchParams.get("search") || "";
  const dateFilter = searchParams.get("date") || "all";
  const customDate = searchParams.get("customDate") || "";
  
  // Edit & Toast State
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [vendorAssignOrder, setVendorAssignOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [toastData, setToastData] = useState({ show: false, msg: "", rec: "" });

  const employeeId = searchParams.get("employeeId") || "";

  // Determine branch using canonical IDs
  const [activeBranch, setActiveBranch] = useState<BranchId>(() => {
    if (employeeId) {
      if (employeeId.includes("-UMA-")) return "uma";
      if (employeeId.includes("-KHM-")) return "khanderao";
      if (employeeId.includes("-ELR-")) return "elora";
      if (employeeId.includes("-WAS-")) return "varasiya";
    }
    // Fallback to session branch - convert CUID to canonical short code
    if ((session?.user as any)?.branchId) {
      return toBranchId((session?.user as any).branchId);
    }
    return "khanderao"; // Default
  });

  useEffect(() => {
    if (employeeId) {
      if (employeeId.includes("-UMA-")) setActiveBranch("uma");
      else if (employeeId.includes("-KHM-")) setActiveBranch("khanderao");
      else if (employeeId.includes("-ELR-")) setActiveBranch("elora");
      else if (employeeId.includes("-WAS-")) setActiveBranch("varasiya");
    } else if ((session?.user as any)?.branchId) {
      // Convert real DB CUID to canonical short code
      setActiveBranch(toBranchId((session?.user as any).branchId));
    }
  }, [employeeId, session?.user]);

  const fetchOrders = async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      params.append("branch", activeBranch);
      
      let statusParams = "";
      if (filter === "Pending Verification") statusParams = "NEW,QUOTE_DRAFT,QUOTE_SENT";
      else if (filter === "Waiting for Chef") statusParams = "WAITING_FOR_CHEF";
      else if (filter === "In Kitchen") statusParams = "CHEF_ACCEPTED,MAKING,DECORATING";
      else if (filter === "Ready") statusParams = "READY_FOR_PICKUP";
      else if (filter === "Delivery") statusParams = "PENDING_ASSIGNMENT,ASSIGNED_TO_DRIVER,PICKED_UP,ON_THE_WAY,DELIVERED";
      else if (filter === "Due Soon") params.append("dueSoon", "true");
      else if (filter === "Issues") params.append("hasIssues", "true");
      
      if (statusParams) params.append("status", statusParams);
      if (search.trim()) params.append("search", search.trim());
      
      const driverId = searchParams.get("driverId");
      if (driverId) params.append("driverId", driverId);
      
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
      
      const res = await fetchClient<any>(`/orders?${params.toString()}`, { signal });
      if (res.success) {
        setServerOrders(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      } else {
        throw new Error(res.error?.message || "Failed to fetch orders");
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("[Sales Orders] API error:", e.message);
        setError(e.message || "Failed to load orders. Please refresh.");
        setServerOrders([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);

    const handlePopState = () => {
      fetchOrders();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      controller.abort();
      window.removeEventListener("popstate", handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, search, dateFilter, customDate, activeBranch]);

  useEffect(() => {
    if (socket) {
      const handleNotificationSent = (data: any) => {
        if (data.channel === 'WHATSAPP') {
          let msg = "WhatsApp sent successfully!";
          if (data.template === "order_confirmed") msg = "Order Confirmed message sent! 🎂";
          else if (data.template === "payment_received") msg = "Payment receipt sent! 🎉";
          else if (data.template === "order_ready") msg = "Order Ready for Pickup message sent!";
          else if (data.template === "driver_assigned") msg = "Driver assignment sent!";
          else if (data.template === "order_delivered") msg = "Delivery confirmation sent!";
          
          setToastData({ show: true, msg, rec: data.recipient });
        }
      };
      
      const handleOrderUpdate = () => {
        fetchOrders();
      };
      
      socket.on('notification_sent', handleNotificationSent);
      socket.on('order_created', handleOrderUpdate);
      socket.on('order_updated', handleOrderUpdate);
      
      return () => {
        socket.off('notification_sent', handleNotificationSent);
        socket.off('order_created', handleOrderUpdate);
        socket.off('order_updated', handleOrderUpdate);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, page, filter, search, dateFilter, customDate, activeBranch]);

  // Polling fallback: when Socket.IO is unavailable (Vercel/serverless),
  // poll every 30 seconds so new orders always appear automatically.
  useEffect(() => {
    const isSocketConnected = socket && (socket as any).connected;
    if (isSocketConnected) return; // Socket is live — no need to poll

    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, page, filter, search, dateFilter, customDate, activeBranch]);

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

  const [newOrderPopup, setNewOrderPopup] = useState<Order | null>(null);
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null);
  const seenOrderIds = useRef<Set<string>>(new Set());

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

      <SalesFilterBar />

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
                  onReceipt={()=>setReceiptOrder(order)}
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
          <motion.div key="new-order-popup" initial={{opacity:0,scale:0.8,y:-20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.8,y:-20}}
            className="fixed top-16 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-24 sm:top-auto sm:w-80 bg-white/95 backdrop-blur-xl border-2 border-[#C5A059] shadow-2xl rounded-2xl p-4 z-50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#C5A059]/20 text-[#3E2723] rounded-full animate-pulse"><Notification className="w-6 h-6" /></div>
              <div className="flex-1">
                <h4 className="font-black text-[#3E2723] text-sm">🎂 NEW ORDER ARRIVED!</h4>
                <p className="text-sm font-bold text-[#C5A059] mt-0.5">{newOrderPopup.orderNumber || newOrderPopup.id}</p>
                <p className="text-xs font-medium text-foreground mt-1 truncate">{newOrderPopup.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {newOrderPopup.items?.map((i: any) => i.name).join(", ")}
                </p>
                <p className="text-xs font-bold text-emerald-600 mt-1">₹{newOrderPopup.grandTotal?.toFixed(0)}</p>
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => { 
                      setNewOrderPopup(null); 
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("status", "Pending Verification");
                      params.set("page", "1");
                      router.push(`${pathname}?${params.toString()}`, { scroll: false });
                    }}
                    className="flex-1 bg-[#3E2723] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#3E2723]/90 transition-transform active:scale-95 shadow-sm"
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
          <OrderTimelineModal 
            orderId={timelineOrder.id}
            onClose={() => setTimelineOrder(null)}
          />
        )}
      </AnimatePresence>

      {/* Bill & Receipt Modal */}
      {receiptOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full relative p-4 max-h-[90vh] overflow-y-auto my-auto shadow-2xl">
            <button
              onClick={() => setReceiptOrder(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10 p-1"
            >
              <CloseSquare className="w-6 h-6" />
            </button>
            <ReceiptStub orderId={receiptOrder.id} onClose={() => setReceiptOrder(null)} />
          </div>
        </div>
      )}

      {/* Real-time internal staff messaging hub */}
      <StaffChatWidget 
        senderId={employeeId || session?.user?.id || "SALES-01"} 
        senderName={session?.user?.name || "Staff"} 
        senderRole={(session?.user as any)?.role?.toLowerCase() || "sales"} 
        branch={activeBranch} 
        channel="sales" 
      />
    </motion.div>
  );
}

const ANIMATION_STYLES = `
  @keyframes slideHighlight {
    0% { transform: translateX(-10px); background-color: rgb(243 232 255); }
    100% { transform: translateX(0); background-color: transparent; }
  }
  @keyframes successPulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
  @keyframes dispatchSlide {
    0% { transform: translateX(20px); opacity: 0.8; }
    100% { transform: translateX(0); opacity: 1; }
  }

  .animate-slideHighlight { animation: slideHighlight 1s ease-out; }
  .animate-successPulse { animation: successPulse 1.5s ease-out; }
  .animate-dispatchSlide { animation: dispatchSlide 1s ease-out; }
`;

function animationToClass(animation: TransitionAnimation): string {
  if (animation.type === "NONE") return "";
  
  if (!animation.shouldAnimate) {
    // Reduced motion fallbacks (accessible static styling)
    switch (animation.type) {
      case "ERROR": return "ring-2 ring-destructive";
      case "SUCCESS": 
      case "CELEBRATION": return "ring-2 ring-emerald-500";
      default: return "";
    }
  }

  // Full CSS animations
  switch (animation.type) {
    case "HIGHLIGHT": return "animate-slideHighlight";
    case "SUCCESS": return "animate-successPulse ring-2 ring-emerald-500/50";
    case "DISPATCH": return "animate-dispatchSlide";
    case "CELEBRATION": return "animate-successPulse ring-2 ring-emerald-500";
    case "ERROR": return "ring-2 ring-destructive animate-pulse";
    default: return "";
  }
}

export default function OrderManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-bold">Loading Sales display...</div>}>
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_STYLES }} />
      <SalesDashboardContent />
    </Suspense>
  );
}

function OrderDetailsCard({ order, onViewTimeline, onReceipt, onEdit, onAssignVendor, onWhatsApp, onMutated }: { order: Order; onViewTimeline: () => void; onReceipt: () => void; onEdit: () => void; onAssignVendor: () => void; onWhatsApp: (msg: string) => void; onMutated: () => void }) {
  const { updateOrderStatus, updateOrderFields, updateVendorTaskStatus } = useOrders();
  const [quotePrice, setQuotePrice] = useState<number>(order.grandTotal || 0);
  const [selectedDiscount, setSelectedDiscount] = useState<number>(0);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isHandingOver, setIsHandingOver] = useState(false);
  const [isNotifyingReady, setIsNotifyingReady] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [refImageModal, setRefImageModal] = useState<{ images: string[]; idx: number } | null>(null);
  
  // Reusable intent-based animation layer
  const animation = useOrderTransitionAnimation(order.id, order.status);
  const animationClass = animationToClass(animation);

  const isLocked = ["CHEF_ACCEPTED","MAKING","DECORATING","READY_FOR_PICKUP","PENDING_ASSIGNMENT","ASSIGNED_TO_DRIVER","PICKED_UP","ON_THE_WAY","DELIVERED","COMPLETED","CANCELLED"].includes(order.status as string);
  const canEdit = !isLocked;

  const handleNotifyReady = async () => {
    if (isNotifyingReady) return;
    setIsNotifyingReady(true);
    try {
      const res = await fetch(`/api/v1/orders/${order.id}/actions/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Salesperson confirmed cake is ready for pickup at branch.' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send ready notification');
      }
      onWhatsApp("WhatsApp notification sent to customer: Your cake is ready for pickup! 🎂");
      onMutated();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to notify customer");
    } finally {
      setIsNotifyingReady(false);
    }
  };

  const handleHandover = async () => {
    if (isHandingOver) return;
    setIsHandingOver(true);
    try {
      await updateOrderStatus(order.id, "COMPLETED");
      onMutated();
    } catch (e: any) {
      console.error("[Handover] Error:", e);
      alert(e?.message || "Failed to process handover");
    } finally {
      setIsHandingOver(false);
    }
  };

  const handleApprove = async () => {
    await updateOrderStatus(order.id,"WAITING_FOR_CHEF");
    onMutated();
  };

  const handleCollectPayment = async () => {
    try {
      const response = await fetch(`/api/v1/orders/${order.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: order.pendingBalance, method: 'CASH' })
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.error || "Failed to record payment");
        return;
      }

      let handedOver = data.handedOver === true;

      onWhatsApp(handedOver ? "Thank you! Your payment is received and your order is handed over. 🍰" : "Thank you! Your payment has been received and balance is settled. 🍰");
      onMutated();
    } catch (e) {
      console.error(e);
      alert("Error recording payment");
    }
  };

  const handleSendQuote = async () => {
    if (quotePrice <= 0) {
      alert("Please enter a valid quote price greater than ₹0.");
      return;
    }
    setSubmittingQuote(true);
    try {
      const finalTotal = Math.max(0, quotePrice - selectedDiscount);
      await updateOrderFields(order.id, { 
        grandTotal: finalTotal,
        pendingBalance: finalTotal - (order.advancePaid || 0)
      });
      await updateOrderStatus(order.id, "QUOTE_SENT", false, "Salesperson", { discount: selectedDiscount, basePrice: quotePrice });
      
      let msg = `Automated WhatsApp quote of ₹${finalTotal} sent via Meta Cloud API to customer (${order.customerPhone}).`;
      if (selectedDiscount > 0) msg = `Automated WhatsApp quote of ₹${finalTotal} (included ₹${selectedDiscount} discount) sent via Meta Cloud API.`;
      
      onWhatsApp(msg);
      onMutated();
    } catch (e) {
      console.error(e);
      alert("Failed to send automated quote");
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

  // Use first reference image as thumbnail if no cakeImage, so salesperson sees the customer's ref photo
  const allRefImages = order.items.flatMap((i: any) => i.referenceImages || []);
  const cakeImageUrl = order.cakeImage || allRefImages[0] || "https://images.unsplash.com/photo-1562777717-b6c338435d72?auto=format&fit=crop&q=80&w=600&h=600";

  return (
    <>
      <motion.div layout initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
        className={`bg-white backdrop-blur-md rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row group transition-all duration-300 relative border ${
          order.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50/30 opacity-80' :
          order.status === 'CANCELLED' ? 'border-rose-200 bg-rose-50/20 opacity-75' :
          animationClass ? `border-[#C5A059]/20 ${animationClass}` :
          'border-[#C5A059]/20 hover:border-[#C5A059]/50 hover:shadow-lg'
        }`}>


        {/* Large Prominent Cake Image Section (Zomato/Blinkit Partner Style) */}
        <div 
          onClick={() => setIsImageZoomed(true)}
          className="w-full h-56 sm:h-64 md:w-52 md:h-auto bg-slate-900 shrink-0 relative cursor-pointer overflow-hidden group/img border-b md:border-b-0 md:border-r border-[#C5A059]/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={cakeImageUrl} 
            alt="Cake preview" 
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
          
          {/* Badge indicating this is the Design Reference */}
          {allRefImages.length > 0 && (
            <div className="absolute top-0 left-0 w-full bg-blue-600/90 text-white text-[9px] font-black uppercase tracking-widest text-center py-1 backdrop-blur-sm shadow-sm z-10">
              Design Ref
            </div>
          )}

          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <span className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
              🔍 Tap to Zoom
            </span>
          </div>

          {order.isSurprise && (
            <div className="absolute top-2 right-2 bg-purple-600/90 text-white backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Gift className="w-3 h-3" /> Surprise
            </div>
          )}

          {/* Quick Cake Spec Bar overlaid on photo bottom */}
          <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-bold bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-lg flex items-center justify-between">
            <span className="truncate">{order.items[0]?.name || "Custom Cake"}</span>
            {order.items[0]?.weight && <span className="bg-[#C5A059] text-white text-[10px] font-black px-1.5 py-0.5 rounded ml-1 shrink-0">{order.items[0].weight}</span>}
          </div>
        </div>

        <div className="p-4 sm:p-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-serif font-black text-[#3E2723]">{order.orderNumber || order.id}</h3>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest shadow-2xs border ${
                order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                'bg-[#C5A059]/10 text-[#3E2723] border-[#C5A059]/30'
              }`}>
                {statusLabel(order.status)}
              </span>
              {order.delayLevel==="delayed" && <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse"><Warning2 className="w-3 h-3"/>Delayed</span>}
              {order.delayLevel==="warning" && <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Warning2 className="w-3 h-3"/>Issue</span>}
              {isLocked && !(["COMPLETED","CANCELLED"] as string[]).includes(order.status as string) && <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Lock1 className="w-3 h-3"/>Locked</span>}
            </div>

            
            {/* Transfer History View */}
            {(order as any).transferHistory && (order as any).transferHistory.length > 0 && (
              <div className="mb-3 p-2 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center gap-2 overflow-x-auto hide-scrollbar">
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest shrink-0">Branch Ops:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-emerald-900 shrink-0">{toBranchShortName((order as any).transferHistory[0].from)}</span>
                  {(order as any).transferHistory.map((th: any, i: number) => (
                    <span key={i} className="flex items-center gap-1.5 shrink-0">
                      <span className="text-emerald-400 text-[10px] font-black">➔</span>
                      <span className="text-xs font-bold text-emerald-900">{th.to}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {order.items.map((item,i)=>(
                <div key={i} className="flex flex-col">
                  <p className="text-sm font-black text-gray-900">
                    {item.qty}x {item.name || (item as any).productName}
                    {item.weight&&<span className="text-muted-foreground font-semibold"> ({item.weight})</span>}
                    {(item as any).flavor && <span className="ml-1 text-xs text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">• {(item as any).flavor}</span>}
                  </p>
                  {(item as any).referenceImages && (item as any).referenceImages.length > 0 && (
                    <div className="flex gap-2 mt-1.5 flex-wrap items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-1">Design Ref:</span>
                      {/* Small preview thumbnails (max 3) */}
                      {(item as any).referenceImages.slice(0, 3).map((img: string, idx: number) => (
                        <button
                          key={`ref-${idx}`}
                          onClick={() => setRefImageModal({ images: (item as any).referenceImages, idx })}
                          className="w-8 h-8 rounded-md overflow-hidden border-2 border-blue-300 hover:border-blue-500 transition-all shadow-sm shrink-0"
                          title={`View reference photo ${idx + 1}`}
                        >
                          <img src={img} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      <button
                        onClick={() => setRefImageModal({ images: (item as any).referenceImages, idx: 0 })}
                        className="text-[10px] font-black bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 flex items-center gap-1 transition-colors shadow-sm"
                      >
                        {(item as any).referenceImages.length} Photo{(item as any).referenceImages.length > 1 ? 's' : ''}
                      </button>
                    </div>
                  )}

                  {(item as any).printImages && (item as any).printImages.length > 0 && (
                    <div className="flex gap-2 mt-1.5 flex-wrap items-center bg-purple-50 p-2 rounded-lg border border-purple-200">
                      <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest mr-1">Photo Print:</span>
                      {/* Small preview thumbnails (max 3) */}
                      {(item as any).printImages.slice(0, 3).map((img: string, idx: number) => (
                        <button
                          key={`print-${idx}`}
                          onClick={() => setRefImageModal({ images: (item as any).printImages, idx })}
                          className="w-8 h-8 rounded-md overflow-hidden border-2 border-purple-400 hover:border-purple-600 transition-all shadow-sm shrink-0"
                          title={`View print photo ${idx + 1}`}
                        >
                          <img src={img} alt={`Print ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      <button
                        onClick={() => setRefImageModal({ images: (item as any).printImages, idx: 0 })}
                        className="text-[10px] font-black bg-purple-600 text-white px-2 py-1 rounded-lg hover:bg-purple-700 flex items-center gap-1 transition-colors shadow-sm"
                      >
                        {(item as any).printImages.length} Print{(item as any).printImages.length > 1 ? 's' : ''}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {order.items.some(i=>i.notes) && (
              <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-300/60 rounded-xl text-amber-950 text-xs font-bold">
                <span className="text-[10px] font-black uppercase text-amber-700 block mb-0.5">Cake Customization Note:</span>
                &quot;{order.items.find(i=>i.notes)?.notes}&quot;
              </div>
            )}
            {order.customerInstructions && (
              <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-xs font-bold">
                <span className="text-[10px] font-black uppercase text-blue-700 block mb-0.5">Delivery Instructions:</span>
                &quot;{order.customerInstructions}&quot;
              </div>
            )}
            {order.vendorTasks && order.vendorTasks.length > 0 && (
              <div className="mt-2.5 p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 text-xs font-bold space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 block">
                  🤝 Assigned Partners ({order.vendorTasks.length}):
                </span>
                {order.vendorTasks.map((vt, idx) => (
                  <div key={idx} className="flex flex-col text-[11px] text-purple-900 bg-white/70 p-2 rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between font-extrabold">
                      <span>{vt.vendorName || vt.vendorType}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 bg-purple-200 text-purple-800 rounded font-black">{vt.status}</span>
                    </div>
                    {vt.instructions && <p className="text-[11px] font-medium text-purple-800 mt-0.5 italic">&quot;{vt.instructions}&quot;</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3 bg-secondary/20 p-3 rounded-xl border border-black/5">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-0.5">Customer</p>
                  <p className="text-sm font-black text-gray-900">{order.customerName}</p>
                  <a href={`tel:${order.customerPhone}`} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                    <Call className="w-3 h-3 text-blue-600" /> {order.customerPhone}
                  </a>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-0.5">Payment</p>
                  <div className="flex flex-col items-end gap-0.5">
                    <p className="text-xs font-bold text-muted-foreground">Total: ₹{order.grandTotal || 0}</p>
                    {order.status === "QUOTE_DRAFT" ? (
                      <p className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md mt-0.5">Quote Requested</p>
                    ) : order.status === "QUOTE_SENT" ? (
                      <p className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md mt-0.5">Quote Sent (Due: ₹{order.pendingBalance || order.grandTotal})</p>
                    ) : order.status === "CANCELLED" ? (
                      <p className="text-xs font-black text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md mt-0.5">Cancelled</p>
                    ) : order.pendingBalance > 0 ? (
                      <p className="text-xs font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md mt-0.5">Due: ₹{order.pendingBalance}</p>
                    ) : order.grandTotal === 0 ? (
                      <p className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md mt-0.5">Quote Pending</p>
                    ) : (
                      <p className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-0.5">Paid Full</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-100 p-2.5 rounded-xl border border-slate-200 font-bold">
                <Clock className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span suppressHydrationWarning>Due: {new Date(order.timeTarget).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:true})}</span>
              </div>
            </div>

            {/* Bargain Negotiation Control Panel */}
            {order.status === "QUOTE_DRAFT" && (
              <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Send Quote to Customer</span>
                
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-muted-foreground">Price: ₹</span>
                  <input 
                    type="number"
                    min="0"
                    value={quotePrice || ''}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setQuotePrice(val);
                    }}
                    className="flex-1 bg-white border border-border rounded-md px-2 py-1.5 text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Enter custom cake price..."
                  />
                </div>

                <div className="flex gap-2">
                  {[0, 50, 100, 150].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSelectedDiscount(amt)}
                      className={`flex-1 py-1 rounded text-xs font-bold transition-all ${selectedDiscount === amt ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white border border-border text-foreground hover:bg-secondary'}`}
                    >
                      {amt === 0 ? 'No Disc.' : `-₹${amt}`}
                    </button>
                  ))}
                </div>
                <button
                  disabled={submittingQuote || quotePrice <= 0}
                  onClick={handleSendQuote}
                  className="w-full bg-[#C5A059] text-white py-2 rounded-md text-xs font-bold hover:bg-[#b08c48] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  Send Negotiated Quote (Final Total: ₹{Math.max(0, quotePrice - selectedDiscount)})
                </button>
              </div>
            )}

            {/* Zomato / Blinkit Partner Style 1-Tap Action Bar */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap gap-2 items-center">
              {/* Primary Workflow Button */}
              {order.status === "QUOTE_SENT" && (
                <button 
                  onClick={async () => {
                    try {
                      await updateOrderStatus(order.id, "QUOTE_SENT", false, "Salesperson", { basePrice: order.grandTotal });
                      onWhatsApp(`Automated WhatsApp quote re-sent via Meta API to ${order.customerPhone}`);
                      onMutated();
                    } catch (e) {
                      alert("Failed to re-send automated quote");
                    }
                  }} 
                  className="flex-1 min-w-[150px] bg-[#25D366] text-white px-3 py-3 rounded-xl text-xs font-black hover:bg-[#128C7E] flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Resend Automated Quote (Meta API)
                </button>
              )}
              {order.status==="NEW" && (
                <button onClick={handleApprove} className="flex-1 min-w-[120px] bg-emerald-600 text-white px-3 py-3 rounded-xl text-sm font-black hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform">
                  <TickCircle className="w-5 h-5" /> Approve
                </button>
              )}
              {order.pendingBalance > 0 && !(["NEW","QUOTE_DRAFT","QUOTE_SENT","COMPLETED","CANCELLED"] as string[]).includes(order.status as string) && (

                <button onClick={handleCollectPayment} className="flex-1 min-w-[140px] bg-amber-500 text-white px-3 py-3 rounded-xl text-sm font-black hover:bg-amber-600 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform">
                  <Gift className="w-5 h-5" /> Collect ₹{order.pendingBalance}
                </button>
              )}
              {order.status === "READY_FOR_PICKUP" && (order.orderType === "pickup" || (order as any).deliveryType === "PICKUP") && (() => {
                const hasReceivedTransfer = (order as any).transfers?.some((t: any) => t.status === 'RECEIVED');
                return (
                  <button 
                    disabled={isNotifyingReady}
                    onClick={handleNotifyReady} 
                    className={`flex-1 min-w-[150px] text-white px-3 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform disabled:opacity-50 ${hasReceivedTransfer ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    title={hasReceivedTransfer ? "Cake has arrived at this branch — notify customer via WhatsApp" : "Notify customer via WhatsApp that cake is ready for pickup at store"}
                  >
                    {isNotifyingReady ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Notifying...</span>
                      </>
                    ) : (
                      <>
                        <Notification className="w-4 h-4 text-white" />
                        {hasReceivedTransfer ? "Notify Customer" : "Ready For Pickup"}
                      </>
                    )}
                  </button>
                );
              })()}

              {order.pendingBalance === 0 && order.status === "READY_FOR_PICKUP" && (order.orderType === "pickup" || (order as any).deliveryType === "PICKUP") && (
                <button 
                  disabled={isHandingOver}
                  onClick={handleHandover} 
                  className="flex-1 min-w-[130px] bg-[#3E2723] text-white px-3 py-3 rounded-xl text-xs font-black hover:bg-[#2c1c19] flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isHandingOver ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Handing over...</span>
                    </>
                  ) : (
                    <>
                      <TickCircle className="w-5 h-5 text-[#C5A059]" /> Handover Cake
                    </>
                  )}
                </button>
              )}

              {/* Quick Call & WhatsApp Buttons on Mobile Phone */}
              <a 
                href={`tel:${order.customerPhone}`}
                className="md:hidden p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-black flex items-center justify-center active:scale-95 shadow-sm"
                title="Call Customer"
              >
                <Call className="w-5 h-5" />
              </a>
              <button 
                onClick={() => {
                  const cleanPhone = order.customerPhone.replace(/\D/g, "");
                  const waUrl = `https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(order.customerName.split(' ')[0])},%20regarding%20your%20Gopal%20Cakes%20order%20${encodeURIComponent(order.orderNumber || order.id)}:`;
                  window.open(waUrl, "_blank");
                  onWhatsApp(`Opened WhatsApp for ${order.customerPhone}`);
                }}
                className="md:hidden p-3 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 rounded-xl font-black flex items-center justify-center active:scale-95 shadow-sm"
                title="WhatsApp Customer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </button>
              
              {/* Desktop Secondary Buttons */}
              <div className="hidden md:flex gap-2 flex-1">
                 {canEdit && (
                   <button onClick={onAssignVendor} className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95">
                     <Reserve className="w-3.5 h-3.5" /> Assign Vendor
                   </button>
                 )}
                 {canEdit && (
                   <button onClick={onEdit} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95">
                     <Edit2 className="w-3.5 h-3.5" /> Edit Order
                   </button>
                 )}
                 <button onClick={onViewTimeline} className="px-3 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                   <Clock className="w-3.5 h-3.5 text-[#C5A059]" /> Timeline
                 </button>
                 <button onClick={onReceipt} className="px-3 py-2 bg-white border border-[#C5A059]/40 text-[#3E2723] rounded-lg text-xs font-bold hover:bg-[#FDFBF7] flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                   <Receipt21 className="w-3.5 h-3.5 text-[#C5A059]" /> Bill
                 </button>
                 <a href={`tel:${order.customerPhone}`} className="px-3 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                   <Call className="w-3.5 h-3.5 text-blue-600" /> Call
                 </a>
                 <button 
                   onClick={() => {
                     const cleanPhone = order.customerPhone.replace(/\D/g, "");
                     const waUrl = `https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(order.customerName.split(' ')[0])},%20regarding%20your%20Gopal%20Cakes%20order%20${encodeURIComponent(order.orderNumber || order.id)}:`;
                     window.open(waUrl, "_blank");
                     onWhatsApp(`Opened WhatsApp for ${order.customerPhone}`);
                   }} 
                   className="px-3 py-2 bg-[#25D366] text-white rounded-lg text-xs font-bold hover:bg-[#128C7E] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                 >
                   WhatsApp
                 </button>
              </div>

              {/* Mobile Menu for Edit / Timeline / Vendor */}
              <button onClick={() => setShowMoreActions(true)} className="md:hidden px-3 py-3 bg-gray-100 text-gray-800 rounded-xl font-bold flex items-center justify-center transition-colors active:scale-95 shadow-sm border border-gray-200">
                 <span className="text-xl leading-none -mt-1 font-serif">&#8942;</span>
              </button>
            </div>

            {/* Mobile Bottom Sheet for More Actions */}
            <AnimatePresence>
              {showMoreActions && (
                <>
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowMoreActions(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] md:hidden" />
                  <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring", bounce:0, duration:0.4}} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] p-6 pb-safe pt-4 z-[160] md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col gap-3">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
                    <h4 className="text-center font-black text-[#3E2723] font-serif text-xl mb-4">Order Actions: {order.orderNumber || order.id}</h4>
                    
                    {canEdit && (
                      <button onClick={() => { setShowMoreActions(false); onEdit(); }} className="w-full bg-blue-50 text-blue-700 py-4 rounded-2xl font-bold flex items-center gap-3 px-4 border border-blue-200 active:scale-95 transition-transform text-left">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><Edit2 className="w-5 h-5 text-blue-600" /></div>
                        <div>
                          <div className="text-sm font-black">Edit Order Details</div>
                          <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Modify items, prices & customer info</div>
                        </div>
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={() => { setShowMoreActions(false); onAssignVendor(); }} className="w-full bg-purple-50 text-purple-700 py-4 rounded-2xl font-bold flex items-center gap-3 px-4 border border-purple-200 active:scale-95 transition-transform text-left">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0"><Reserve className="w-5 h-5 text-purple-600" /></div>
                        <div>
                          <div className="text-sm font-black">Assign Vendor Partner</div>
                          <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Assign photo prints, flowers or toppers</div>
                        </div>
                      </button>
                    )}
                    <button onClick={() => { setShowMoreActions(false); onViewTimeline(); }} className="w-full bg-orange-50 text-orange-700 py-4 rounded-2xl font-bold flex items-center gap-3 px-4 border border-orange-200 active:scale-95 transition-transform text-left">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-orange-600" /></div>
                      <div>
                        <div className="text-sm font-black">View Order Timeline</div>
                        <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Track status changes & kitchen events</div>
                      </div>
                    </button>
                    <a href={`tel:${order.customerPhone}`} onClick={() => setShowMoreActions(false)} className="w-full bg-emerald-50 text-emerald-700 py-4 rounded-2xl font-bold flex items-center gap-3 px-4 border border-emerald-200 active:scale-95 transition-transform text-left">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Call className="w-5 h-5 text-emerald-600" /></div>
                      <div>
                        <div className="text-sm font-black">Call Customer</div>
                        <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest">{order.customerPhone}</div>
                      </div>
                    </a>
                    
                    <button onClick={() => setShowMoreActions(false)} className="w-full mt-2 py-4 rounded-2xl font-black text-gray-600 bg-gray-100 active:scale-95 transition-transform">
                      Close Menu
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Cake Image Zoom Modal */}
      <AnimatePresence>
        {isImageZoomed && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsImageZoomed(false)} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-4">
            <button onClick={() => setIsImageZoomed(false)} className="absolute top-6 right-6 text-white bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all">
              <CloseSquare className="w-6 h-6" />
            </button>
            <div className="max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cakeImageUrl} alt="Full cake view" className="w-full h-full object-contain max-h-[80vh]" />
              <div className="bg-black/80 text-white p-4 flex justify-between items-center text-sm font-bold">
                <div>
                  <p className="text-base text-[#C5A059] font-serif">{order.orderNumber || order.id}</p>
                  <p className="text-xs text-gray-300">{order.items[0]?.name} ({order.items[0]?.weight})</p>
                </div>
                <button onClick={() => setIsImageZoomed(false)} className="px-4 py-2 bg-[#C5A059] text-white rounded-lg text-xs font-bold hover:bg-[#b08c48]">
                  Close View
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reference Images Lightbox */}
      <AnimatePresence>
        {refImageModal && (
          <motion.div
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={() => setRefImageModal(null)}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[400] flex flex-col items-center justify-center p-4"
          >
            <button onClick={() => setRefImageModal(null)} className="absolute top-6 right-6 text-white bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all z-10">
              <CloseSquare className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center gap-4 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <p className="text-white/60 font-bold text-xs uppercase tracking-widest">
                📸 Reference Photo {refImageModal.idx + 1} of {refImageModal.images.length} — {order.orderNumber}
              </p>
              <img
                src={refImageModal.images[refImageModal.idx]}
                alt={`Reference ${refImageModal.idx + 1}`}
                className="max-h-[65vh] max-w-full rounded-2xl border-2 border-white/20 shadow-2xl object-contain"
              />
              {/* Navigation */}
              <div className="flex items-center gap-3">
                <button
                  disabled={refImageModal.idx === 0}
                  onClick={() => setRefImageModal(prev => prev ? { ...prev, idx: prev.idx - 1 } : null)}
                  className="px-4 py-2 bg-white/20 text-white rounded-xl font-bold text-sm disabled:opacity-30 hover:bg-white/30 transition-colors"
                >← Prev</button>
                {/* Dot indicators */}
                <div className="flex gap-1.5">
                  {refImageModal.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setRefImageModal(prev => prev ? { ...prev, idx: i } : null)}
                      className={`w-2 h-2 rounded-full transition-all ${i === refImageModal.idx ? 'bg-white scale-125' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
                <button
                  disabled={refImageModal.idx === refImageModal.images.length - 1}
                  onClick={() => setRefImageModal(prev => prev ? { ...prev, idx: prev.idx + 1 } : null)}
                  className="px-4 py-2 bg-white/20 text-white rounded-xl font-bold text-sm disabled:opacity-30 hover:bg-white/30 transition-colors"
                >Next →</button>
              </div>
              <a
                href={refImageModal.images[refImageModal.idx]}
                download={`ref-photo-${refImageModal.idx + 1}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
              >
                ⬇️ Download This Photo
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function VendorAssignModal({ order, onClose, onWhatsApp }: { order: Order; onClose: () => void; onWhatsApp: (msg: string) => void }) {
  const { updateOrderFields } = useOrders();
  const [selectedVendors, setSelectedVendors] = useState<Array<{name: string, type: "photo"|"flower"|"acrylic"}>>([]);
  const [vendorNotes, setVendorNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (order.vendorTasks) {
      const initialNotes: Record<string, string> = {};
      const initialSelected: Array<{name: string, type: "photo"|"flower"|"acrylic"}> = [];
      order.vendorTasks.forEach(vt => {
        if (vt.vendorName) {
          initialSelected.push({ name: vt.vendorName, type: vt.vendorType as any });
        }
        if (vt.instructions) {
          initialNotes[vt.vendorType] = vt.instructions;
        }
      });
      if (initialSelected.length > 0) setSelectedVendors(initialSelected);
      if (Object.keys(initialNotes).length > 0) setVendorNotes(initialNotes);
    }
  }, [order]);

  const handleToggleVendor = (vendorName: string, vendorType: "photo" | "flower" | "acrylic") => {
    setSelectedVendors(prev => {
      const exists = prev.find(v => v.type === vendorType && v.name === vendorName);
      if (exists) return prev.filter(v => v.type !== vendorType || v.name !== vendorName);
      return [...prev, { name: vendorName, type: vendorType }];
    });
  };

  const handleConfirmVendorAssignment = async () => {
    const newTasks = [...(order.vendorTasks || [])];
    selectedVendors.forEach(v => {
      const userNote = vendorNotes[v.type]?.trim() || `Assigned to ${v.name} by Sales`;
      const existingIndex = newTasks.findIndex(vt => vt.vendorType === v.type);
      
      if (existingIndex >= 0) {
        newTasks[existingIndex] = {
          ...newTasks[existingIndex],
          status: 'accepted',
          vendorName: v.name,
          instructions: userNote,
          notes: [
            ...(newTasks[existingIndex].notes || []),
            { text: userNote, timestamp: new Date().toISOString(), read: false }
          ]
        };
      } else {
        newTasks.push({
          vendorType: v.type,
          status: 'accepted',
          vendorName: v.name,
          instructions: userNote,
          notes: [
            { text: userNote, timestamp: new Date().toISOString(), read: false }
          ]
        });
      }
    });
    
    await updateOrderFields(order.id, { vendorTasks: newTasks });

    // Persist each assigned vendor task via backend API to ensure real-time vendor delivery
    try {
      for (const v of selectedVendors) {
        const userNote = vendorNotes[v.type]?.trim() || `Assigned to ${v.name}`;
        await fetch(`/api/v1/orders/${order.id}/vendor-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorType: v.type,
            instructions: userNote,
            status: 'accepted'
          })
        });
      }
    } catch(e) {}
    
    if (selectedVendors.length > 0) {
      const notesSummary = selectedVendors.map(v => `${v.name}: "${vendorNotes[v.type] || 'Assigned'}"`).join(' | ');
      onWhatsApp(`WhatsApp notification sent to Partner (${notesSummary})`);
    }
    onClose();
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl relative w-full max-w-lg flex flex-col items-center max-h-[90vh] overflow-y-auto my-auto border border-border">
        {/* Elegant top decoration */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-400 via-purple-600 to-indigo-600" />
        
        <button onClick={onClose} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground bg-secondary p-2 rounded-full transition-all hover:scale-110 active:scale-95"><CloseSquare className="w-5 h-5" /></button>
        
        <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-3 shrink-0">
           <Reserve className="w-7 h-7 text-purple-600" />
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-black text-[#3E2723] mb-1 text-center">Assign Partners</h3>
        <p className="text-[11px] font-bold text-muted-foreground mb-6 uppercase tracking-widest text-center">
          Select fulfillment partners for #{order.orderNumber || order.id.slice(-6)}
        </p>
        
        {/* Partner Selection Cards */}
        <div className="grid grid-cols-3 gap-3 w-full mb-5">
          {[
            { name: "Amit Hemrajani", type: "photo" as const, icon: "📷", desc: "Photo Prints" },
            { name: "Vikas Bhai", type: "flower" as const, icon: "🌸", desc: "Fresh Flowers" },
            { name: "Samir", type: "acrylic" as const, icon: "✨", desc: "Acrylic Toppers" }
          ].map(v => {
            const isSelected = selectedVendors.some(sv => sv.name === v.name && sv.type === v.type);
            return (
              <button 
                key={v.name} 
                onClick={() => handleToggleVendor(v.name, v.type)} 
                className={`border-2 rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-1.5 transition-all active:scale-95 shadow-xs relative ${isSelected ? 'bg-purple-50 border-purple-500 shadow-purple-500/20' : 'bg-white border-border hover:bg-gray-50'}`}
              >
                <span className="w-10 h-10 bg-white border border-border rounded-full flex items-center justify-center shadow-xs text-gray-800 font-black text-xl">{v.icon}</span>
                <span className="font-bold text-xs text-gray-900 text-center leading-tight">{v.name}</span>
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest text-center">{v.desc}</span>
                {isSelected && <TickCircle className="w-5 h-5 text-purple-600 absolute -top-2 -right-2 bg-white rounded-full shadow-sm" />}
              </button>
            );
          })}
        </div>

        {/* Dynamic Instructions & Notes Input for Each Selected Vendor */}
        {selectedVendors.length > 0 && (
          <div className="w-full mb-6 space-y-3 bg-purple-50/70 p-4 rounded-2xl border border-purple-200 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                📝 Partner Instructions / Notes:
              </span>
              <span className="text-[9px] font-bold text-purple-700 bg-purple-200/80 px-2 py-0.5 rounded-full">
                Sent to Vendor
              </span>
            </div>

            {selectedVendors.map(v => (
              <div key={v.type} className="space-y-1 bg-white p-3 rounded-xl border border-purple-200/80 shadow-xs">
                <label className="text-xs font-bold text-gray-900 flex items-center justify-between">
                  <span>{v.name} <span className="text-purple-600 font-normal">({v.type === 'photo' ? 'Photo Print' : v.type === 'flower' ? 'Flowers' : 'Acrylic'})</span></span>
                </label>
                <textarea
                  rows={2}
                  value={vendorNotes[v.type] || ""}
                  onChange={(e) => setVendorNotes(prev => ({ ...prev, [v.type]: e.target.value }))}
                  placeholder={`Write note for ${v.name} (e.g. Red roses only, 6x4 photo glossy, gold acrylic font)...`}
                  className="w-full text-xs font-medium p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all resize-none"
                />
              </div>
            ))}
          </div>
        )}
        
        <button 
          onClick={handleConfirmVendorAssignment} 
          disabled={selectedVendors.length===0} 
          className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 shrink-0"
        >
          {selectedVendors.length > 0 ? (
             <>Confirm & Send Notes ({selectedVendors.length})</>
          ) : (
             <>Select a Partner</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

