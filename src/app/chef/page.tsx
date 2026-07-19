"use client";

import { useState, useEffect } from "react";
import { useOrders, Order, IngredientRequest } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/ui/BackButton";
import { Reserve, Warning2, TickCircle, Clock, CloseSquare, Danger, Bag, Refresh2 } from "iconsax-react";
import { toBranchId, BRANCHES, BranchId, toBranchShortName } from "@/lib/branches";

// Standard bakery ingredients for the missing ingredients modal
const COMMON_INGREDIENTS = [
  "Chocolate Sponge", "Vanilla Sponge", "Red Velvet Sponge", 
  "Fresh Cream", "Buttercream", "Dark Chocolate Ganache", 
  "White Chocolate", "Fondant (White)", "Fondant (Colors)", 
  "Fresh Strawberries", "Mixed Fruits", "Edible Prints", "Acrylic Topper",
];

// Custom Hook for Dynamic SLA Countdown & Progress
const useSLA = (timeTarget: string | undefined, createdAt: string) => {
  const [timeLeftStr, setTimeLeftStr] = useState("");
  const [progress, setProgress] = useState(0); // 0 to 100
  const [status, setStatus] = useState<"safe" | "warning" | "danger">("safe");

  useEffect(() => {
    if (!timeTarget) {
      setTimeLeftStr("No Deadline");
      return;
    }

    const updateSLA = () => {
      const now = new Date().getTime();
      const target = new Date(timeTarget).getTime();
      const created = new Date(createdAt).getTime();
      
      const totalDuration = target - created;
      const elapsed = now - created;
      
      let p = (elapsed / totalDuration) * 100;
      if (p < 0) p = 0;
      if (p > 100) p = 100;
      setProgress(p);

      const msLeft = target - now;
      if (msLeft <= 0) {
        setTimeLeftStr("OVERDUE");
        setStatus("danger");
      } else {
        const minLeft = Math.floor(msLeft / 60000);
        if (minLeft < 60) {
          setTimeLeftStr(`Due in ${minLeft}m`);
        } else {
          const h = Math.floor(minLeft / 60);
          const m = minLeft % 60;
          setTimeLeftStr(`Due in ${h}h ${m}m`);
        }

        if (p > 85) setStatus("danger");
        else if (p > 60) setStatus("warning");
        else setStatus("safe");
      }
    };

    updateSLA();
    const interval = setInterval(updateSLA, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [timeTarget, createdAt]);

  return { timeLeftStr, progress, status };
};

export default function ChefDashboardPage() {
  const { orders, updateOrderFields } = useOrders();
  
  // UI Mode: Mock Login for Chef
  const [activeBranch, setActiveBranch] = useState<BranchId>("khanderao");
  const [activeTab, setActiveTab] = useState<"queue" | "myTasks" | "ready">("queue");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtering orders for the active branch
  const branchOrders = orders.filter(o => toBranchId(o.branch) === activeBranch);

  // Queue
  const queueOrders = branchOrders
    .filter(o => o.status === "WAITING_FOR_CHEF")
    .sort((a, b) => new Date(a.timeTarget).getTime() - new Date(b.timeTarget).getTime());
  
  // My Tasks
  const myTasksOrders = branchOrders
    .filter(o => ["CHEF_ACCEPTED", "MAKING", "DECORATING"].includes(o.status))
    .sort((a, b) => new Date(a.timeTarget).getTime() - new Date(b.timeTarget).getTime());
    
  // Ready
  const readyOrders = branchOrders
    .filter(o => o.status === "READY_FOR_PICKUP")
    .sort((a, b) => new Date(b.timeline?.[b.timeline.length - 1]?.timestamp || b.createdAt).getTime() - new Date(a.timeline?.[a.timeline.length - 1]?.timestamp || a.createdAt).getTime());

  // Interactive Checklist State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Modals
  const [showMissingModal, setShowMissingModal] = useState<Order | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [missingNote, setMissingNote] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Priority Beep
  useEffect(() => {
    const hasPriority = queueOrders.some(o => o.priorityLevel === "high" || o.priorityLevel === "vip");
    if (!hasPriority) return;

    const playBeep = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15); // short sharp beep
      } catch (e) {}
    };

    playBeep();
    const intervalId = setInterval(playBeep, 4000);
    return () => clearInterval(intervalId);
  }, [queueOrders]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  const handleAcceptOrder = async (order: Order) => {
    await updateOrderFields(order.id, {
      status: "MAKING",
      assignedChef: "CHEF_01",
      productionStartTime: new Date().toISOString(),
      timeline: [
        ...(order.timeline || []),
        { event: "Chef started production", actor: "Chef", timestamp: new Date().toISOString() }
      ]
    });
    showToast(`Ticket ${order.id.split('-').pop()} moved to My Tasks!`);
  };

  const handleMarkReady = async (order: Order) => {
    await updateOrderFields(order.id, {
      status: "READY_FOR_PICKUP",
      delayLevel: "none",
      timeline: [
        ...(order.timeline || []),
        { event: "Order ready for pickup/delivery", actor: "Chef", timestamp: new Date().toISOString() }
      ]
    });
    showToast(`Ticket ${order.id.split('-').pop()} complete!`);
  };

  const handleSubmitMissingIngredients = () => {
    if (!showMissingModal || selectedIngredients.length === 0) return;
    
    const newRequests: IngredientRequest[] = selectedIngredients.map(item => ({
      id: `ING-${Math.random().toString(36).substr(2, 9)}`,
      itemCode: item.toUpperCase().replace(/\s+/g, '_'),
      itemName: item,
      note: missingNote,
      requestedBy: "Chef",
      status: "pending",
      timestamp: new Date().toISOString(),
    }));

    updateOrderFields(showMissingModal.id, {
      ingredientRequests: [...(showMissingModal.ingredientRequests || []), ...newRequests],
      delayLevel: "warning",
      timeline: [
        ...(showMissingModal.timeline || []),
        { event: `Reported missing ingredients: ${selectedIngredients.join(", ")}`, actor: "Chef", timestamp: new Date().toISOString() }
      ]
    });

    setShowMissingModal(null);
    setSelectedIngredients([]);
    setMissingNote("");
  };

  // --- Components ---
  
  // Kitchen Order Ticket (KOT) Component
  const TicketCard = ({ order, isQueue = false, isReady = false }: { order: Order, isQueue?: boolean, isReady?: boolean }) => {
    const isUrgent = order.priorityLevel === "high" || order.priorityLevel === "vip";
    const { timeLeftStr, progress, status } = useSLA(order.timeTarget, order.createdAt);
    
    // Theme logic based on KDS standard
    let cardClass = "bg-white border-2 border-gray-200 shadow-md";
    let headerClass = "bg-gray-100 text-gray-800 border-b-2 border-gray-200";
    
    if (isUrgent && isQueue) {
      cardClass = "bg-white border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse-border";
      headerClass = "bg-rose-500 text-white border-b-2 border-rose-600";
    } else if (isReady) {
      cardClass = "bg-emerald-50 border-2 border-emerald-500 shadow-md";
      headerClass = "bg-emerald-500 text-white border-b-2 border-emerald-600";
    }

    return (
      <div className={`rounded-xl flex flex-col overflow-hidden transition-all ${cardClass}`}>
        
        {/* Ticket Header */}
        <div className={`p-4 flex justify-between items-center ${headerClass}`}>
          <div>
            <h3 className="font-black text-2xl tracking-tighter">#{order.id.split('-').pop()}</h3>
            <span className="font-bold text-xs uppercase tracking-widest opacity-80">{order.orderType}</span>
          </div>
          <div className="text-right">
            {!isReady && (
              <>
                <div className="flex items-center justify-end gap-1 font-black text-lg">
                  <Clock className="w-5 h-5" /> {timeLeftStr}
                </div>
                {order.priorityLevel === "vip" && <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-widest mt-1 inline-block">VIP</span>}
                {order.priorityLevel === "high" && <span className="bg-white text-rose-600 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-widest mt-1 inline-block">RUSH</span>}
              </>
            )}
            {isReady && <span className="font-black text-xl uppercase">READY</span>}
          </div>
        </div>

        {/* SLA Progress Bar (Only for active tasks) */}
        {!isQueue && !isReady && (
          <div className="w-full h-2 bg-gray-100">
            <div 
              className={`h-full transition-all duration-1000 ${status === 'danger' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Ticket Body (Items) */}
        <div className="flex-1 p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-10">
          
          {order.cakeImage && (
            <div className="mb-4 relative group cursor-pointer border-2 border-dashed border-gray-300 p-1 rounded-xl" onClick={() => setFullscreenImage(order.cakeImage!)}>
              <img src={order.cakeImage} alt="Ref" className="w-full h-32 object-cover rounded-lg group-hover:opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="bg-black/70 text-white font-bold text-xs px-3 py-1 rounded-full backdrop-blur-sm">ENLARGE</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {order.items.map((item, idx) => {
              const isChecked = checkedItems[`${order.id}-${idx}`] || false;
              
              return (
                <div 
                  key={idx} 
                  onClick={() => !isQueue && !isReady && toggleCheck(order.id, idx)}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${!isQueue && !isReady ? 'cursor-pointer active:scale-95' : ''} ${isChecked ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-100 shadow-sm'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg shrink-0 ${isChecked ? 'bg-gray-300 text-gray-600' : 'bg-gray-900 text-white'}`}>
                    {item.qty}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-black text-gray-900 text-lg leading-tight ${isChecked ? 'line-through' : ''}`}>{item.name}</p>
                    {item.weight && <p className="font-bold text-gray-500 text-xs uppercase mt-0.5">{item.weight}</p>}
                    {item.notes && <p className={`mt-2 font-bold text-sm p-2 rounded-lg ${isChecked ? 'bg-gray-200 text-gray-600' : 'bg-rose-100 text-rose-800'}`}>* {item.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Ingredients Warning */}
          {order.ingredientRequests && order.ingredientRequests.filter(r=>r.status==="pending").length > 0 && !isReady && (
            <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-400 rounded-xl">
              <p className="font-black text-amber-900 text-xs uppercase tracking-widest flex items-center gap-1 mb-1"><Warning2 className="w-4 h-4"/> WAITING ON INGREDIENTS</p>
              <p className="font-bold text-amber-800 text-sm">
                {order.ingredientRequests.filter(r=>r.status==="pending").map(r => r.itemName).join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* Ticket Footer Actions */}
        <div className="p-4 bg-gray-50 border-t-2 border-gray-200 flex gap-2">
          {isQueue ? (
            <button onClick={() => handleAcceptOrder(order)} className={`flex-1 py-4 font-black uppercase tracking-widest text-sm rounded-xl transition-transform active:scale-95 text-white ${isUrgent ? 'bg-rose-600 shadow-[0_4px_15px_rgba(225,29,72,0.4)]' : 'bg-gray-900 shadow-md'}`}>
              Accept Order
            </button>
          ) : !isReady ? (
            <>
              <button onClick={() => setShowMissingModal(order)} className="flex-1 py-4 bg-white border-2 border-rose-200 text-rose-700 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-rose-50 active:scale-95 flex flex-col items-center justify-center gap-1">
                <Warning2 className="w-5 h-5" /> Issue
              </button>
              <button onClick={() => handleMarkReady(order)} className="flex-[2] py-4 bg-emerald-500 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-emerald-600 shadow-md active:scale-95 flex items-center justify-center gap-2">
                <TickCircle className="w-6 h-6" /> Mark Ready
              </button>
            </>
          ) : (
            <div className="flex-1 py-3 text-center text-emerald-700 font-black text-sm uppercase tracking-widest">
              Awaiting Dispatch / Pickup
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20 relative">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-border {
          0%, 100% { border-color: #f43f5e; box-shadow: 0 0 15px rgba(244,63,94,0.3); }
          50% { border-color: #fda4af; box-shadow: 0 0 25px rgba(244,63,94,0.6); }
        }
        .animate-pulse-border { animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}} />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3"
          >
            <TickCircle className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-sm uppercase tracking-widest text-white">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Navigation Bar */}
      <div className="bg-gray-900 text-white sticky top-0 z-40 shadow-xl">
        <div className="absolute top-6 right-6 md:top-8 md:right-8 z-[100]">
          <BackButton fallback="/login" label="Switch Account" variant="ghost" className="text-white hover:bg-white/10" />
        </div>
        <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Reserve className="w-8 h-8 text-amber-400" /> KDS Terminal
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Station:</span>
              <select 
                value={activeBranch} 
                onChange={(e) => setActiveBranch(e.target.value as BranchId)}
                className="bg-gray-800 text-amber-400 font-bold text-xs uppercase tracking-widest px-2 py-1 rounded border border-gray-700 outline-none"
              >
                {BRANCHES.map(b => (
                  <option key={b.id} value={b.id}>{b.shortName} KITCHEN</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex bg-gray-800 p-1 rounded-xl w-full md:w-auto">
            <button onClick={() => setActiveTab("queue")} className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'queue' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-white'}`}>
              Queue 
              {queueOrders.length > 0 && <span className={`px-2 py-0.5 rounded text-[10px] ${activeTab === 'queue' ? 'bg-rose-500 text-white' : 'bg-gray-700'}`}>{queueOrders.length}</span>}
            </button>
            <button onClick={() => setActiveTab("myTasks")} className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'myTasks' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-white'}`}>
              Active 
              {myTasksOrders.length > 0 && <span className={`px-2 py-0.5 rounded text-[10px] ${activeTab === 'myTasks' ? 'bg-gray-900 text-white' : 'bg-gray-700'}`}>{myTasksOrders.length}</span>}
            </button>
            <button onClick={() => setActiveTab("ready")} className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'ready' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
              Ready
            </button>
          </div>
        </div>
      </div>

      {/* Main KDS Board */}
      <div className="p-4 md:p-8">
        {activeTab === "queue" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {queueOrders.length === 0 ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-400">
                <Reserve className="w-20 h-20 mb-4 opacity-20" />
                <h3 className="text-3xl font-black mb-2 text-gray-300">QUEUE CLEAR</h3>
                <p className="font-bold text-sm uppercase tracking-widest">Waiting for incoming tickets...</p>
              </div>
            ) : (
              queueOrders.map(order => <TicketCard key={order.id} order={order} isQueue={true} />)
            )}
          </div>
        )}

        {activeTab === "myTasks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myTasksOrders.length === 0 ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-400">
                <Refresh2 className="w-20 h-20 mb-4 opacity-20" />
                <h3 className="text-3xl font-black mb-2 text-gray-300">NO ACTIVE TICKETS</h3>
                <p className="font-bold text-sm uppercase tracking-widest">Accept an order from the queue</p>
              </div>
            ) : (
              myTasksOrders.map(order => <TicketCard key={order.id} order={order} />)
            )}
          </div>
        )}

        {activeTab === "ready" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {readyOrders.length === 0 ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-400">
                <Bag className="w-20 h-20 mb-4 opacity-20" />
                <h3 className="text-3xl font-black mb-2 text-gray-300">NO READY ORDERS</h3>
              </div>
            ) : (
              readyOrders.map(order => <TicketCard key={order.id} order={order} isReady={true} />)
            )}
          </div>
        )}
      </div>

      {/* Missing Ingredients Modal - KDS Styled */}
      <AnimatePresence>
        {showMissingModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-4 border-rose-500">
              
              <div className="flex justify-between items-start mb-6 shrink-0 border-b-2 border-gray-100 pb-4">
                <div>
                  <h3 className="text-3xl font-black text-rose-600 flex items-center gap-3 tracking-tight">
                    <Warning2 className="w-8 h-8" />
                    REPORT ISSUE
                  </h3>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">Ticket #{showMissingModal.id.split('-').pop()}</p>
                </div>
                <button onClick={() => setShowMissingModal(null)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"><CloseSquare className="w-6 h-6"/></button>
              </div>

              <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar space-y-6">
                <div>
                  <p className="text-sm font-black text-gray-900 mb-3 uppercase tracking-widest">Select missing items:</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_INGREDIENTS.map(ing => {
                      const isSelected = selectedIngredients.includes(ing);
                      return (
                        <button
                          key={ing}
                          onClick={() => {
                            setSelectedIngredients(prev => prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]);
                          }}
                          className={`px-4 py-3 rounded-xl text-sm font-black border-2 transition-all ${
                            isSelected 
                              ? 'bg-rose-100 border-rose-500 text-rose-900' 
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {ing}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-black text-gray-900 mb-3 uppercase tracking-widest">Additional Notes:</p>
                  <textarea 
                    value={missingNote}
                    onChange={(e) => setMissingNote(e.target.value)}
                    placeholder="Type specific details here..."
                    className="w-full h-24 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t-2 border-gray-100 flex gap-3 shrink-0">
                <button onClick={() => setShowMissingModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-black uppercase tracking-widest text-sm rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button 
                  onClick={handleSubmitMissingIngredients}
                  disabled={selectedIngredients.length === 0}
                  className="flex-[2] py-4 bg-rose-600 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors"
                >
                  NOTIFY SALES
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <button onClick={() => setFullscreenImage(null)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><CloseSquare className="w-8 h-8"/></button>
            <motion.img 
              initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}}
              src={fullscreenImage} 
              alt="Cake Fullscreen" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
