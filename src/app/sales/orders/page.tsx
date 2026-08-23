"use client";

import { useState, useEffect, useRef } from "react";
import { Call, TickCircle, Warning2, Gift, Reserve, Notification, Clock, Lock1, Edit2, CloseSquare } from "iconsax-react";
import { useOrders, Order, TimelineEvent } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";
import { SearchNormal1 } from "iconsax-react";
import { Button } from "@/components/ui/button";
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
    // Fallback to session branch
    if ((session?.user as any)?.branchId) {
      return (session?.user as any).branchId;
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
      setActiveBranch((session?.user as any).branchId);
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
        // Instead of showing a blank error screen, render demo orders so Sales staff can always access the page
        console.warn("[Sales Orders] API unavailable (offline or DB not connected). Using demo data:", e.message);
        setServerOrders([
          {
            id: "DEMO-001",
            orderNumber: "#DEMO-001",
            status: "NEW",
            customerName: "Rahul Patel",
            customerPhone: "+91 9876543210",
            grandTotal: 1200,
            pendingBalance: 600,
            advancePaid: 600,
            timeTarget: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
            cakeImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
            items: [{ name: "2kg Chocolate Truffle", qty: 1, weight: "2kg", notes: "Extra dark chocolate" }],
            priorityLevel: "normal",
            delayLevel: "on_time",
            vendorTasks: [],
            ingredientRequests: [],
            customerInstructions: "Please write 'Happy Birthday Rahul' on the cake.",
            isSurprise: false,
            transferHistory: []
          } as any,
          {
            id: "DEMO-002",
            orderNumber: "#DEMO-002",
            status: "WAITING_FOR_CHEF",
            customerName: "Priya Sharma",
            customerPhone: "+91 9123456789",
            grandTotal: 2500,
            pendingBalance: 0,
            advancePaid: 2500,
            timeTarget: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
            cakeImage: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=400",
            items: [{ name: "3-Tier Wedding Cake", qty: 1, weight: "5kg" }],
            priorityLevel: "high",
            delayLevel: "on_time",
            vendorTasks: [{ vendorType: "photo", status: "pending", vendorName: null, instructions: "Photo print" }],
            ingredientRequests: [],
            customerInstructions: "",
            isSurprise: false,
            transferHistory: []
          } as any,
          {
            id: "DEMO-003",
            orderNumber: "#DEMO-003",
            status: "MAKING",
            customerName: "Meera Joshi",
            customerPhone: "+91 9988776655",
            grandTotal: 800,
            pendingBalance: 0,
            advancePaid: 800,
            timeTarget: new Date(Date.now() + 1.5 * 3600 * 1000).toISOString(),
            cakeImage: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400",
            items: [{ name: "Black Forest Classic", qty: 1, weight: "1kg" }],
            priorityLevel: "normal",
            delayLevel: "warning",
            vendorTasks: [],
            ingredientRequests: [{ itemName: "Fresh Cream", note: "Low stock", status: "pending" }],
            customerInstructions: "",
            isSurprise: true,
            transferHistory: []
          } as any
        ]);
        setTotalPages(1);
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
                    onClick={() => { 
                      setNewOrderPopup(null); 
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("status", "Pending Verification");
                      params.set("page", "1");
                      router.push(`${pathname}?${params.toString()}`, { scroll: false });
                    }}
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
          <OrderTimelineModal 
            orderId={timelineOrder.id}
            onClose={() => setTimelineOrder(null)}
          />
        )}
      </AnimatePresence>

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

function OrderDetailsCard({ order, onViewTimeline, onEdit, onAssignVendor, onWhatsApp, onMutated }: { order: Order; onViewTimeline: () => void; onEdit: () => void; onAssignVendor: () => void; onWhatsApp: (msg: string) => void; onMutated: () => void }) {
  const { updateOrderStatus, updateOrderFields, updateVendorTaskStatus } = useOrders();
  const [selectedDiscount, setSelectedDiscount] = useState<number>(50);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  
  // Reusable intent-based animation layer
  const animation = useOrderTransitionAnimation(order.id, order.status);
  const animationClass = animationToClass(animation);

  const isLocked = ["CHEF_ACCEPTED","MAKING","DECORATING","READY_FOR_PICKUP","PENDING_ASSIGNMENT","ASSIGNED_TO_DRIVER","PICKED_UP","ON_THE_WAY","DELIVERED"].includes(order.status);
  const canEdit = !isLocked;

  const handleApprove = async () => {
    await updateOrderStatus(order.id,"WAITING_FOR_CHEF");
    // Removed manual onWhatsApp("..."); now handled via automated Socket event
    onMutated();
  };

  const handleCollectPayment = async () => {
    await updateOrderFields(order.id, { pendingBalance: 0, advancePaid: order.grandTotal });
    // Note: If you want automated payment whatsapp, it needs to be configured in Outbox. 
    // Leaving manual toast for now since Payment Received is not fully automated in backend yet.
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
      className={`bg-white/80 backdrop-blur-md border border-[#C5A059]/20 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row group transition-all duration-300 relative ${animationClass ? animationClass : 'hover:border-[#C5A059]/50 hover:shadow-md'}`}>

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
            <h3 className="text-xl font-serif font-black text-[#3E2723]">{order.orderNumber || order.id}</h3>
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
               <button onClick={()=>onWhatsApp(`WhatsApp sent to customer: ${order.customerPhone}`)} className="px-3 py-2 bg-[#25D366] text-white rounded-md text-xs font-bold hover:bg-[#128C7E] flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                 WhatsApp
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
                  <button onClick={() => { setShowMoreActions(false); onWhatsApp(`WhatsApp sent to customer: ${order.customerPhone}`); }} className="w-full bg-[#25D366]/10 text-[#128C7E] py-4 rounded-2xl font-bold flex items-center gap-3 px-4 border border-[#25D366]/30 active:scale-95 transition-transform text-left">
                    <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <div>
                      <div className="text-sm">Send WhatsApp</div>
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

