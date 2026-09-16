"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { SearchNormal1, CloseSquare, ArrowSwapHorizontal, ArchiveBook, Send, TruckFast, Warning2 } from "iconsax-react";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/ui/BackButton";
import { toBranchShortName } from "@/lib/branches";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const BRANCHES = [
  { id: "khanderao", name: "Khanderao Market", shortName: "Khanderao" },
  { id: "uma", name: "Uma Char Rasta", shortName: "Uma" },
  { id: "varasiya", name: "Factory Warashiya", shortName: "Warashiya" },
  { id: "elora", name: "Ellora Park", shortName: "Ellora Park" }
] as const;

// Statuses that are eligible for branch transfer
const TRANSFERABLE_STATUSES = [
  "NEW", "WAITING_FOR_CHEF", "CHEF_ACCEPTED", "MAKING", "DECORATING",
  "READY_FOR_PICKUP", "PENDING_ASSIGNMENT"
];

function matchesOrderQuery(order: any, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase().replace(/^#/, "");
  if (!q) return true;

  const orderNum = (order.orderNumber || order.id || "").toLowerCase();
  const idStr = (order.id || "").toLowerCase();
  const trackingStr = (order.trackingId || "").toLowerCase();
  const custName = (order.customerName || order.customer?.name || "").toLowerCase();
  const phone = (order.customerPhone || order.customer?.phone || "").toLowerCase();
  const status = (order.status || "").toLowerCase().replace(/_/g, " ");

  if (orderNum.includes(q) || idStr.includes(q) || trackingStr.includes(q) || custName.includes(q) || phone.includes(q) || status.includes(q)) {
    return true;
  }

  if (Array.isArray(order.items)) {
    for (const item of order.items) {
      const name = (item.name || item.product?.name || "").toLowerCase();
      if (name.includes(q)) return true;
    }
  }

  const cleanOrderNum = orderNum.replace(/[^a-z0-9]/g, "");
  const cleanQ = q.replace(/[^a-z0-9]/g, "");
  if (cleanQ && cleanOrderNum.endsWith(cleanQ)) return true;

  return false;
}

function matchesTransferQuery(t: any, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase().replace(/^#/, "");
  if (!q) return true;

  const order = t.order || {};
  const orderNum = (order.orderNumber || order.id || t.orderId || "").toLowerCase();
  const idStr = (t.id || order.id || "").toLowerCase();
  const custName = (order.customerName || order.customer?.name || "").toLowerCase();
  const phone = (order.customerPhone || order.customer?.phone || "").toLowerCase();
  const fromBranch = (toBranchShortName(t.fromBranchId) || "").toLowerCase();
  const toBranch = (toBranchShortName(t.toBranchId) || "").toLowerCase();
  const status = (t.status || "").toLowerCase().replace(/_/g, " ");

  if (orderNum.includes(q) || idStr.includes(q) || custName.includes(q) || phone.includes(q) || fromBranch.includes(q) || toBranch.includes(q) || status.includes(q)) {
    return true;
  }

  const cleanOrderNum = orderNum.replace(/[^a-z0-9]/g, "");
  const cleanQ = q.replace(/[^a-z0-9]/g, "");
  if (cleanQ && cleanOrderNum.endsWith(cleanQ)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Utility: convert a Date object to "YYYY-MM-DDTHH:mm" in LOCAL timezone
// This is what <input type="datetime-local"> expects — local time, no offset.
// ---------------------------------------------------------------------------
function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function BranchTransferPage() {
  const [activeTab, setActiveTab] = useState<"local" | "outgoing" | "incoming">("local");
  const [search, setSearch] = useState("");

  const { data: session } = useSession();
  const activeBranch = (session?.user as any)?.branchId || "";

  // Fetch orders directly via SWR so newly created orders always appear
  const { data: ordersData, mutate: mutateOrders, isLoading: ordersLoading } = useSWR(
    `/api/v1/orders?limit=200`,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch transfers
  const { data: incoming, mutate: mutateIncoming } = useSWR(`/api/v1/transfers?mode=incoming`, fetcher);
  const { data: outgoing, mutate: mutateOutgoing } = useSWR(`/api/v1/transfers?mode=outgoing`, fetcher);

  const rawOrders = ordersData?.data || (Array.isArray(ordersData) ? ordersData : []);
  const localOrders = rawOrders.filter((o: any) => TRANSFERABLE_STATUSES.includes(o.status));

  const filteredActiveOrders = localOrders.filter((o: any) => matchesOrderQuery(o, search));
  const filteredOutgoing = Array.isArray(outgoing) ? outgoing.filter((t: any) => matchesTransferQuery(t, search)) : [];
  const filteredIncoming = Array.isArray(incoming) ? incoming.filter((t: any) => matchesTransferQuery(t, search)) : [];

  const handleRefresh = () => {
    mutateOrders();
    mutateIncoming();
    mutateOutgoing();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 min-h-[calc(100vh-8rem)] flex flex-col pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="mb-2">
            <BackButton fallback="/sales" label="Back to Sales" variant="outline" size="sm" />
          </div>
          <h2 className="text-3xl font-black tracking-tight font-serif text-[#3E2723] flex items-center gap-2">
            Branch Transfers
          </h2>
          <p className="text-muted-foreground text-xs mt-0.5 tracking-wide">Manage internal logistics and order routing between branches.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="shrink-0 self-start sm:self-auto px-4 py-2 rounded-xl border border-[#C5A059]/40 bg-white text-[#3E2723] text-xs font-bold hover:bg-[#FFF8F0] transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 shrink-0 border-b border-[#C5A059]/20 pb-2 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab("local")}
          className={`flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-t-xl font-bold transition-all ${activeTab === "local" ? "bg-white border border-b-0 border-[#C5A059]/30 text-[#3E2723] shadow-[0_-2px_10px_rgba(0,0,0,0.02)] relative after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-white z-10" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}
        >
          <Send className="w-4 h-4" /> Transfer an Order
          {localOrders.length > 0 && <span className="bg-[#3E2723] text-white px-1.5 py-0.5 rounded-full text-[10px] ml-1">{localOrders.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-t-xl font-bold transition-all ${activeTab === "outgoing" ? "bg-white border border-b-0 border-[#C5A059]/30 text-[#3E2723] shadow-[0_-2px_10px_rgba(0,0,0,0.02)] relative after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-white z-10" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}
        >
          <TruckFast className="w-4 h-4" /> Outgoing
          {outgoing?.length > 0 && <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[10px] ml-1">{outgoing.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab("incoming")}
          className={`flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-t-xl font-bold transition-all ${activeTab === "incoming" ? "bg-white border border-b-0 border-[#C5A059]/30 text-[#3E2723] shadow-[0_-2px_10px_rgba(0,0,0,0.02)] relative after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-white z-10" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}
        >
          <ArchiveBook className="w-4 h-4" /> Incoming
          {incoming?.length > 0 && <span className="bg-[#C5A059] text-white px-1.5 py-0.5 rounded-full text-[10px] ml-1">{incoming.length}</span>}
        </button>
      </div>

      <div className="relative shrink-0 -mt-4 z-0">
        <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          type="text"
          placeholder="Search by last 4 digits (e.g. 3B5E, CE8D), order #, customer name, or phone..."
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#C5A059]/30 bg-white backdrop-blur-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-4 flex-1">
        {activeTab === "local" && ordersLoading && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm font-bold animate-pulse">
            Loading orders...
          </div>
        )}
        {activeTab === "local" && !ordersLoading && filteredActiveOrders.map((order: any) => (
          <LocalOrderCard
            key={order.id}
            order={order}
            activeBranch={activeBranch}
            onTransfer={() => { mutateOutgoing(); mutateOrders(); setActiveTab("outgoing"); }}
          />
        ))}
        {activeTab === "outgoing" && filteredOutgoing.map((t: any) => (
          <TransferCard key={t.id} transfer={t} type="outgoing" mutate={() => mutateOutgoing()} />
        ))}
        {activeTab === "incoming" && filteredIncoming.map((t: any) => (
          <TransferCard key={t.id} transfer={t} type="incoming" mutate={() => mutateIncoming()} />
        ))}
        {((activeTab === "local" && !ordersLoading && filteredActiveOrders.length === 0) ||
          (activeTab === "outgoing" && filteredOutgoing.length === 0) ||
          (activeTab === "incoming" && filteredIncoming.length === 0)) && (
          <div className="flex flex-col items-center justify-center h-48 bg-white/50 border border-dashed border-[#C5A059]/30 rounded-xl">
            <ArrowSwapHorizontal className="w-8 h-8 text-[#C5A059]/40 mb-2" />
            <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest">
              {search ? `No matching ${activeTab} orders for "${search}"` : `No ${activeTab} records found`}
            </p>
            {activeTab === "local" && !search && (
              <p className="text-muted-foreground text-xs mt-1 text-center px-8">
                Only active orders (NEW → READY FOR PICKUP) appear here
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// LocalOrderCard
// ---------------------------------------------------------------------------
function LocalOrderCard({ order, activeBranch, onTransfer }: any) {
  const [showModal, setShowModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState<string>("varasiya");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ------------------------------------------------------------------
  // Timezone-safe date handling for datetime-local input
  //
  // The problem with the old code:
  //   new Date(originalDate.getTime() - (getTimezoneOffset() * 60000))
  // For IST (UTC+5:30), getTimezoneOffset() = -330 (negative!), so that
  // formula ADDS 5.5 hours, corrupting the displayed date.
  //
  // Fix: use JS's local date part methods which already account for TZ.
  // ------------------------------------------------------------------
  const hasOriginalDate = !!(order.timeTarget || order.targetDate);
  const originalDateObj: Date | null = hasOriginalDate
    ? new Date(order.timeTarget || order.targetDate)
    : null;

  // Build the default value for the datetime-local input in local time
  const defaultInput = originalDateObj
    ? toLocalInputValue(originalDateObj)
    : toLocalInputValue(new Date());

  const [newTargetDate, setNewTargetDate] = useState<string>(defaultInput);

  // Only block if: order has a real target date AND new date is LATER than it
  // Pre-poning (earlier) is always allowed. No target date = no restriction.
  const isTimeDelayed =
    hasOriginalDate && originalDateObj !== null
      ? new Date(newTargetDate).getTime() > originalDateObj.getTime() + 60_000
      : false;

  const handleInitiate = async () => {
    setLoading(true);
    try {
      const parsedDate = new Date(newTargetDate);
      const targetISO = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined;
      const res = await fetch("/api/v1/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-branch-id": activeBranch },
        body: JSON.stringify({
          orderId: order.id,
          toBranchId: transferTarget,
          reason: "Manual route",
          newTargetDate: targetISO,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || "Failed to initiate transfer");
      } else {
        setShowModal(false);
        onTransfer();
      }
    } catch (err: any) {
      alert("Error initiating transfer: " + (err?.message || "Server error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-md border border-[#C5A059]/20 rounded-xl shadow-sm p-5 flex flex-col md:flex-row justify-between gap-4 group hover:border-[#C5A059]/50 transition-colors"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-serif font-black text-[#3E2723]">{order.orderNumber || order.id}</h3>
          <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
            {order.status ? order.status.replace(/_/g, " ") : "PENDING"}
          </span>
        </div>
        <p className="text-sm font-bold text-foreground mb-1">{order.customerName || "Walk-in Customer"}</p>
        <p className="text-xs text-muted-foreground">
          Pickup:{" "}
          {order.timeTarget || order.pickupTime
            ? new Date(order.timeTarget || order.pickupTime).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
            : "ASAP"}
        </p>
      </div>
      <div className="shrink-0 pt-2 md:pt-0">
        <button
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
        >
          <Send className="w-4 h-4" /> Initiate Transfer
        </button>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {showModal && (
              <motion.div
                key="transfer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto"
                onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative my-auto"
                  style={{ maxHeight: "calc(100vh - 4rem)", overflowY: "auto" }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-6">
                    <button
                      onClick={() => setShowModal(false)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                    >
                      <CloseSquare className="w-5 h-5" />
                    </button>

                    <h3 className="font-serif text-xl font-black text-[#3E2723] mb-4 pr-8">
                      Transfer {order.orderNumber || order.id}
                    </h3>

                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                      Destination Branch
                    </p>
                    <select
                      value={transferTarget}
                      onChange={e => setTransferTarget(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold mb-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {BRANCHES.filter(b => b.id !== activeBranch).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>

                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                      Adjust Timeline
                      {hasOriginalDate && originalDateObj && (
                        <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">
                          (customer deadline: {originalDateObj.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })})
                        </span>
                      )}
                    </p>
                    <input
                      type="datetime-local"
                      value={newTargetDate}
                      onChange={e => setNewTargetDate(e.target.value)}
                      className={`w-full bg-white border rounded-lg px-3 py-2 text-sm font-bold mb-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                        isTimeDelayed ? "border-red-500" : "border-gray-200"
                      }`}
                    />
                    <div className="h-6 mb-4">
                      {isTimeDelayed ? (
                        <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                          <Warning2 className="w-3 h-3" /> Cannot set later than the customer&apos;s pickup deadline.
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          ✓{" "}
                          {hasOriginalDate
                            ? "You can prepone the deadline for this branch."
                            : "No deadline restriction — any time is fine."}
                        </span>
                      )}
                    </div>

                    <button
                      disabled={loading || isTimeDelayed}
                      onClick={handleInitiate}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg"
                    >
                      {loading ? "Sending..." : "Confirm Transfer"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// TransferCard
// ---------------------------------------------------------------------------
function TransferCard({ transfer, type, mutate }: any) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      const branchId = type === "incoming" ? transfer.toBranchId : transfer.fromBranchId;
      const res = await fetch(`/api/v1/transfers/${transfer.id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-branch-id": branchId },
        body: JSON.stringify({ notes: `Performed ${action} from UI` }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || `Failed to ${action} transfer`);
      } else {
        mutate();
      }
    } catch (err: any) {
      alert(`Error during ${action}: ` + (err?.message || "Server error"));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (s: string) => {
    if (s === "PENDING") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (s === "ACCEPTED") return "bg-blue-100 text-blue-800 border-blue-200";
    if (s === "REJECTED") return "bg-red-100 text-red-800 border-red-200";
    if (s === "IN_TRANSIT") return "bg-orange-100 text-orange-800 border-orange-200";
    if (s === "RECEIVED") return "bg-green-100 text-green-800 border-green-200";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col md:flex-row justify-between gap-4 relative overflow-hidden">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-serif font-black text-[#3E2723]">{transfer.order.orderNumber}</h3>
          <span className={`border px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${getStatusColor(transfer.status)}`}>
            {transfer.status.replace(/_/g, " ")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-1">
          <span>{toBranchShortName(transfer.fromBranchId)}</span>
          <span className="text-emerald-500">➔</span>
          <span>{toBranchShortName(transfer.toBranchId)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{new Date(transfer.createdAt).toLocaleString()}</p>
      </div>

      <div className="shrink-0 pt-2 md:pt-0 flex flex-col gap-2 justify-center">
        {type === "incoming" && transfer.status === "PENDING" && (
          <div className="flex gap-2">
            <button
              disabled={loading}
              onClick={() => handleAction("reject")}
              className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              disabled={loading}
              onClick={() => handleAction("accept")}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 disabled:opacity-50"
            >
              Accept
            </button>
          </div>
        )}
        {type === "incoming" && transfer.status === "IN_TRANSIT" && (
          <button
            disabled={loading}
            onClick={() => handleAction("receive")}
            className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 shadow-md"
          >
            Mark Received
          </button>
        )}
        {type === "outgoing" && transfer.status === "ACCEPTED" && (
          <button
            disabled={loading}
            onClick={() => handleAction("dispatch")}
            className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 shadow-md"
          >
            Dispatch Now
          </button>
        )}
      </div>
    </div>
  );
}
