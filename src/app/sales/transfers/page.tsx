"use client";

import { useState } from "react";
import useSWR from "swr";
import { useOrders } from "@/context/OrderContext";
import { SearchNormal1, Clock, CloseSquare, TickCircle, Warning2, ArrowSwapHorizontal, ArchiveBook, Send, TruckFast, CloseCircle } from "iconsax-react";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/ui/BackButton";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const BRANCHES = [
  { id: "B_KHM", name: "Khanderao Market", shortName: "Khanderao" },
  { id: "B_UMA", name: "Uma Char Rasta", shortName: "Uma" },
  { id: "B_VAR", name: "Varasiya Ring Road", shortName: "Varasiya" },
  { id: "B_ELL", name: "Ellora Park", shortName: "Ellora" }
] as const;

type BranchId = typeof BRANCHES[number]["id"];

function toBranchShortName(id: string) {
  const b = BRANCHES.find(x => x.id === id);
  return b ? b.shortName : id.replace("B_", "");
}

export default function BranchTransferPage() {
  const { orders } = useOrders(); // To get local orders that can be transferred
  const [activeTab, setActiveTab] = useState<"local" | "outgoing" | "incoming">("local");
  const [search, setSearch] = useState("");
  
  // UI Mode: Mock Login Switcher
  const [activeBranch, setActiveBranch] = useState<BranchId>("B_UMA"); 

  // Fetch Transfers
  const { data: incoming, mutate: mutateIncoming } = useSWR(`/api/v1/transfers?mode=incoming`, fetcher);
  const { data: outgoing, mutate: mutateOutgoing } = useSWR(`/api/v1/transfers?mode=outgoing`, fetcher);

  // Local Orders that can be transferred
  const activeOrders = orders.filter(o => o.branch === activeBranch);

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-6 min-h-[calc(100vh-8rem)] flex flex-col pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="mb-2">
            <BackButton fallback="/sales" label="Back to Sales" variant="outline" size="sm" />
          </div>
          <h2 className="text-3xl font-black tracking-tight font-serif text-[#3E2723] flex items-center gap-2">
            Branch Transfers
            <div className="ml-2 flex items-center gap-1 bg-[#3E2723] text-white px-2 py-1 rounded-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] border-r border-[#C5A059]/30 pr-1">MOCK LOGIN</span>
              <select 
                value={activeBranch} 
                onChange={(e) => setActiveBranch(e.target.value as BranchId)}
                className="bg-transparent text-xs font-black uppercase tracking-wider focus:outline-none cursor-pointer"
              >
                {BRANCHES.map(b => (
                  <option key={b.id} value={b.id} className="text-black">{b.shortName} Branch</option>
                ))}
              </select>
            </div>
          </h2>
          <p className="text-muted-foreground text-xs mt-0.5 tracking-wide">Manage internal logistics and order routing between branches.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 shrink-0 border-b border-[#C5A059]/20 pb-2 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab("local")}
          className={`flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-t-xl font-bold transition-all ${activeTab === 'local' ? 'bg-white border border-b-0 border-[#C5A059]/30 text-[#3E2723] shadow-[0_-2px_10px_rgba(0,0,0,0.02)] relative after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-white z-10' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
        >
          <Send className="w-4 h-4" /> Transfer an Order
        </button>
        <button 
          onClick={() => setActiveTab("outgoing")}
          className={`flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-t-xl font-bold transition-all ${activeTab === 'outgoing' ? 'bg-white border border-b-0 border-[#C5A059]/30 text-[#3E2723] shadow-[0_-2px_10px_rgba(0,0,0,0.02)] relative after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-white z-10' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
        >
          <TruckFast className="w-4 h-4" /> Outgoing 
          {outgoing?.length > 0 && <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[10px] ml-1">{outgoing.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab("incoming")}
          className={`flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-t-xl font-bold transition-all ${activeTab === 'incoming' ? 'bg-white border border-b-0 border-[#C5A059]/30 text-[#3E2723] shadow-[0_-2px_10px_rgba(0,0,0,0.02)] relative after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-white z-10' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
        >
          <ArchiveBook className="w-4 h-4" /> Incoming  
          {incoming?.length > 0 && <span className="bg-[#C5A059] text-white px-1.5 py-0.5 rounded-full text-[10px] ml-1">{incoming.length}</span>}
        </button>
      </div>

      <div className="relative shrink-0 -mt-4 z-0">
        <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e=>setSearch(e.target.value)} type="text"
          placeholder="Search..."
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#C5A059]/30 bg-white backdrop-blur-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 shadow-sm" />
      </div>

      <div className="space-y-4 flex-1">
        {activeTab === 'local' && activeOrders.map(order => (
           <LocalOrderCard key={order.id} order={order} activeBranch={activeBranch} onTransfer={() => mutateOutgoing()} />
        ))}
        {activeTab === 'outgoing' && outgoing?.map((t: any) => (
           <TransferCard key={t.id} transfer={t} type="outgoing" mutate={() => mutateOutgoing()} />
        ))}
        {activeTab === 'incoming' && incoming?.map((t: any) => (
           <TransferCard key={t.id} transfer={t} type="incoming" mutate={() => mutateIncoming()} />
        ))}
        {((activeTab === 'local' && activeOrders.length === 0) || 
          (activeTab === 'outgoing' && outgoing?.length === 0) || 
          (activeTab === 'incoming' && incoming?.length === 0)) && (
          <div className="flex flex-col items-center justify-center h-48 bg-white/50 border border-dashed border-[#C5A059]/30 rounded-xl">
            <ArrowSwapHorizontal className="w-8 h-8 text-[#C5A059]/40 mb-2" />
            <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest">No {activeTab} records found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LocalOrderCard({ order, activeBranch, onTransfer }: any) {
  const [showModal, setShowModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState<string>("B_VAR");
  const [loading, setLoading] = useState(false);
  
  // Timeline adjustment logic
  const originalDate = new Date(order.targetDate || new Date().toISOString());
  const formattedOriginalDate = new Date(originalDate.getTime() - (originalDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  const [newTargetDate, setNewTargetDate] = useState<string>(formattedOriginalDate);
  const isTimeDelayed = new Date(newTargetDate).getTime() > originalDate.getTime();

  const handleInitiate = async () => {
    setLoading(true);
    await fetch('/api/v1/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-branch-id': activeBranch },
      body: JSON.stringify({ orderId: order.id, toBranchId: transferTarget, reason: 'Manual route', newTargetDate })
    });
    setLoading(false);
    setShowModal(false);
    onTransfer();
  };

  return (
    <motion.div layout initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}} className="bg-white/80 backdrop-blur-md border border-[#C5A059]/20 rounded-xl shadow-sm p-5 flex flex-col md:flex-row justify-between gap-4 group hover:border-[#C5A059]/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-serif font-black text-[#3E2723]">{order.id}</h3>
          <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
            {order.status.replace(/_/g," ")}
          </span>
        </div>
        <p className="text-sm font-bold text-foreground mb-1">{order.customerName}</p>
      </div>
      <div className="shrink-0 pt-2 md:pt-0">
        <button onClick={() => setShowModal(true)} className="w-full md:w-auto px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95">
          <Send className="w-4 h-4" /> Initiate Transfer
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CloseSquare className="w-5 h-5" /></button>
              <h3 className="font-serif text-xl font-black text-[#3E2723] mb-4">Transfer {order.id}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Destination Branch</p>
              <select value={transferTarget} onChange={e=>setTransferTarget(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold mb-4">
                {BRANCHES.filter(b=>b.id !== activeBranch).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Adjust Timeline</p>
              <input 
                type="datetime-local" 
                value={newTargetDate}
                onChange={e => setNewTargetDate(e.target.value)}
                className={`w-full bg-white border rounded-lg px-3 py-2 text-sm font-bold mb-1 ${isTimeDelayed ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-emerald-500'}`}
              />
              <div className="h-6 mb-4">
                {isTimeDelayed ? (
                  <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><Warning2 className="w-3 h-3"/> Cannot delay past original customer time.</span>
                ) : (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">Timeline can be pre-poned if needed.</span>
                )}
              </div>

              <button disabled={loading || isTimeDelayed} onClick={handleInitiate} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50">
                {loading ? 'Sending...' : 'Confirm Transfer'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TransferCard({ transfer, type, mutate }: any) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string) => {
    setLoading(true);
    // Mock headers based on type to simulate correct active branch
    const mockBranchId = type === 'incoming' ? transfer.toBranchId : transfer.fromBranchId;
    
    await fetch(`/api/v1/transfers/${transfer.id}/${action}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-branch-id': mockBranchId },
      body: JSON.stringify({ notes: `Performed ${action} from UI` })
    });
    mutate();
    setLoading(false);
  };

  const getStatusColor = (s: string) => {
    if(s === 'PENDING') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if(s === 'ACCEPTED') return 'bg-blue-100 text-blue-800 border-blue-200';
    if(s === 'REJECTED') return 'bg-red-100 text-red-800 border-red-200';
    if(s === 'IN_TRANSIT') return 'bg-orange-100 text-orange-800 border-orange-200';
    if(s === 'RECEIVED') return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col md:flex-row justify-between gap-4 relative overflow-hidden">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-serif font-black text-[#3E2723]">{transfer.order.orderNumber}</h3>
          <span className={`border px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${getStatusColor(transfer.status)}`}>
            {transfer.status.replace(/_/g," ")}
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
        {type === 'incoming' && transfer.status === 'PENDING' && (
          <div className="flex gap-2">
            <button disabled={loading} onClick={() => handleAction('reject')} className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50">Reject</button>
            <button disabled={loading} onClick={() => handleAction('accept')} className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 disabled:opacity-50">Accept</button>
          </div>
        )}
        {type === 'incoming' && transfer.status === 'IN_TRANSIT' && (
          <button disabled={loading} onClick={() => handleAction('receive')} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 shadow-md">
            Mark Received
          </button>
        )}
        
        {type === 'outgoing' && transfer.status === 'ACCEPTED' && (
          <button disabled={loading} onClick={() => handleAction('dispatch')} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 shadow-md">
            Dispatch Now
          </button>
        )}
      </div>
    </div>
  );
}
