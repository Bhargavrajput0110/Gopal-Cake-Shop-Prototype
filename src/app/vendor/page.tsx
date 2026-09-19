"use client";
import { useEffect, useState } from "react";
import { formatTime, formatDate, formatDayLabel } from "@/lib/formatTime";
import { TickCircle, Refresh2, Gallery, Location, Danger, CloseSquare, Clock, DocumentDownload, Maximize, Flash, Play, BagTick, DocumentUpload, Copy, TickSquare } from "iconsax-react";
import { motion, AnimatePresence } from "framer-motion";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";
import { useSession } from "next-auth/react";
import { authSignOut } from "@/lib/authUtils";
import { useRouter } from "next/navigation";

// Custom Hook for SLA Countdown
const useSLA = (timeTarget: string | undefined, isCompleted: boolean) => {
  const [timeLeftStr, setTimeLeftStr] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!timeTarget || isCompleted) {
      if (isCompleted) setTimeLeftStr("Delivered");
      return;
    }

    const updateSLA = () => {
      const now = new Date().getTime();
      const target = new Date(timeTarget).getTime();
      const msLeft = target - now;
      
      if (msLeft <= 0) {
        setTimeLeftStr("LATE");
        setIsUrgent(true);
      } else {
        const minLeft = Math.floor(msLeft / 60000);
        if (minLeft < 120) { // Under 2 hours is urgent for vendors
          setIsUrgent(true);
        } else {
          setIsUrgent(false);
        }

        if (minLeft < 60) {
          setTimeLeftStr(`Due in ${minLeft}m`);
        } else {
          const h = Math.floor(minLeft / 60);
          const m = minLeft % 60;
          setTimeLeftStr(`Due in ${h}h ${m}m`);
        }
      }
    };

    updateSLA();
    const interval = setInterval(updateSLA, 60000); 
    return () => clearInterval(interval);
  }, [timeTarget, isCompleted]);

  return { timeLeftStr, isUrgent };
};

export default function VendorTasks() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeVendor, setActiveVendor] = useState<{id: string, name: string, type: string} | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user) {
      setActiveVendor({
        id: session.user.id,
        name: session.user.name || "Vendor Studio",
        type: session.user.role || "Vendor Partner"
      });
    }
  }, [session, status, router]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/vendor/tasks`);
      const json = await res.json();
      
      if (json.success) {
        // Map backend schema to UI format
        const mapped = json.data.map((item: any) => ({
          id: item.id,
          vendorId: item.assignedVendor?.id || "UNKNOWN",
          instructions: item.instructions || item.notes || "",
          order: {
            orderNumber: item.order?.orderNumber || "Task",
            branch: { name: item.order?.branch?.name || "Kitchen" },
            targetDate: item.order?.targetDate
          },
          productName: item.productName,
          quantity: item.quantity,
          status: item.status,
          parentItem: {
            productName: item.parentItem?.productName || item.productName || "Unknown Item",
            notes: item.instructions || item.notes || item.parentItem?.notes || "",
            designImageUrl: item.parentItem?.designImageUrl || item.designImageUrl || item.image || "",
            gallery: (item.parentItem?.media && item.parentItem.media.length > 0)
              ? item.parentItem.media.map((m: any) => m.url)
              : (item.media && item.media.length > 0)
              ? item.media.map((m: any) => m.url)
              : null
          }
        }));
        setTasks(mapped);
      }
    } catch (e) {
      console.error(e);
      setToastMessage("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeVendor) fetchTasks();
  }, [activeVendor]);

  const onUpdate = async (id: string, action: string, mediaUrl?: string) => {
    // Optimistic Update
    const originalTasks = [...tasks];
    let nextStatus = action === 'ACCEPTED' ? 'accepted' : action === 'MAKING' ? 'in_production' : 'ready';
    
    setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));

    try {
      const res = await fetch(`/api/v1/vendor/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, mediaUrl })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (action === 'READY_FOR_PICKUP') {
        setToastMessage(`Masterpiece submitted successfully!`);
      } else {
        setToastMessage(action === 'ACCEPTED' ? `Assignment Accepted.` : `Production Started.`);
      }
      fetchTasks();
    } catch (e) {
      console.error(e);
      setTasks(originalTasks); // Rollback
      setToastMessage("Failed to update status");
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  if (status === 'loading' || isLoading || !activeVendor) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh] bg-gray-50">
        <Refresh2 className="animate-spin w-10 h-10 text-amber-600 mb-3" />
        <span className="font-ui text-xs font-bold uppercase tracking-widest text-gray-500">Loading Studio Tasks...</span>
      </div>
    );
  }

  const myTasks = tasks;
  const displayedTasks = myTasks.filter(t => activeTab === 'ACTIVE' ? t.status !== 'COMPLETED' : t.status === 'COMPLETED');

  // STUDIO DASHBOARD
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] bg-gray-900 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3"
          >
            <TickCircle className="w-6 h-6 text-emerald-400" />
            <span className="font-ui text-[10px] uppercase tracking-widest font-black text-white">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-gray-900">{activeVendor.name}</h1>
            <p className="font-ui text-[9px] uppercase tracking-widest font-bold text-gray-500 mt-1">{activeVendor.type}</p>
          </div>
          <button 
            onClick={() => {
              authSignOut("/login")
              document.cookie = "e2e-bypass-auth=; path=/; max-age=0";
              router.push("/login");
            }}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full font-ui text-[9px] uppercase tracking-widest font-black transition-colors"
          >
            Switch Studio
          </button>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 pt-4 flex gap-6">
          <button 
            onClick={() => setActiveTab('ACTIVE')}
            className={`pb-4 border-b-2 transition-colors font-ui text-[10px] uppercase tracking-widest font-black ${activeTab === 'ACTIVE' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Active Assignments
          </button>
          <button 
            onClick={() => setActiveTab('COMPLETED')}
            className={`pb-4 border-b-2 transition-colors font-ui text-[10px] uppercase tracking-widest font-black ${activeTab === 'COMPLETED' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Completed History
          </button>
        </div>
      </header>

      {/* Task Board */}
      <div className="max-w-7xl mx-auto px-6 pt-10">
        {displayedTasks.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <TickCircle className="w-12 h-12" />
            </div>
            <h2 className="font-display font-black text-4xl text-gray-900 mb-2">Queue Clear</h2>
            <p className="font-editorial italic text-gray-500 text-xl">
              {activeTab === 'ACTIVE' ? 'All assignments are complete. Take a break!' : 'No completed history yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {displayedTasks.map((task) => {
              const o = task.order || {};
              const p = task.parentItem || {};
              
              let statusLabel = 'Pending Review';
              let btnAction = 'ACCEPTED';
              let btnLabel = 'ACCEPT ASSIGNMENT';
              let btnColor = 'bg-gray-900 text-white hover:bg-gray-800';
              
              const s = (task.status || '').toLowerCase();
              
              if (s === 'accepted' || s === 'chef_accepted') {
                statusLabel = 'Accepted';
                btnAction = 'MAKING';
                btnLabel = 'START PRODUCTION';
                btnColor = 'bg-indigo-600 text-white hover:bg-indigo-700';
              } else if (s === 'making' || s === 'in_production') {
                statusLabel = 'In Production';
                btnAction = 'READY_FOR_PICKUP';
                btnLabel = 'MARK AS READY';
                btnColor = 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
              } else if (s === 'ready' || s === 'ready_for_pickup') {
                statusLabel = 'Ready for Pickup';
                btnAction = '';
                btnLabel = '✓ READY FOR PICKUP';
                btnColor = 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 cursor-default';
              } else if (s === 'completed' || s === 'delivered') {
                statusLabel = 'Completed';
                btnAction = '';
                btnLabel = 'DELIVERED';
                btnColor = 'bg-gray-100 text-gray-400 cursor-not-allowed';
              }

              return (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  o={o} 
                  p={p} 
                  statusLabel={statusLabel}
                  btnAction={btnAction}
                  btnLabel={btnLabel}
                  btnColor={btnColor}
                  onUpdate={onUpdate}
                  onImageClick={setFullscreenImage}
                  isCompleted={task.status === 'COMPLETED'}
                  isPhotographer={activeVendor.id === 'VENDOR_PHOTO'}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <button onClick={() => setFullscreenImage(null)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><CloseSquare className="w-8 h-8"/></button>
            <motion.img 
              initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}}
              src={fullscreenImage} 
              alt="Reference Fullscreen" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
            />
            <button className="absolute bottom-10 px-8 py-4 bg-white text-gray-900 rounded-full font-ui text-[11px] uppercase tracking-widest font-black shadow-2xl flex items-center gap-2 hover:bg-gray-100">
              <DocumentDownload className="w-5 h-5"/> Download Image
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Sub-component for the Task Card to isolate SLA hook
function TaskCard({ task, o, p, statusLabel, btnAction, btnLabel, btnColor, onUpdate, onImageClick, isCompleted, isPhotographer }: any) {
  const { timeLeftStr, isUrgent } = useSLA(o.targetDate, isCompleted);
  const targetDate = o.targetDate ? new Date(o.targetDate) : new Date();
  const [copied, setCopied] = useState(false);

  const s = (task.status || '').toLowerCase();
  
  // Progress Step index (0: Pending, 1: Accepted, 2: Making, 3: Ready/Completed)
  let stepIndex = 0;
  if (s === 'accepted' || s === 'chef_accepted') stepIndex = 1;
  if (s === 'making' || s === 'in_production') stepIndex = 2;
  if (s === 'ready' || s === 'ready_for_pickup' || s === 'completed' || s === 'delivered') stepIndex = 3;

  const copyOrderId = () => {
    if (o.orderNumber) {
      navigator.clipboard.writeText(o.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={`bg-white rounded-[2.5rem] shadow-[0_16px_48px_rgba(74,59,53,0.06)] border ${isCompleted ? 'border-gray-200 opacity-80' : 'border-gray-200/80 hover:border-amber-400/50 hover:shadow-[0_24px_64px_rgba(74,59,53,0.1)]'} transition-all duration-500 overflow-hidden flex flex-col lg:flex-row group`}
    >
      {/* Visual Reference (Left Column) */}
      <div className="lg:w-2/5 bg-gray-900/5 relative overflow-hidden flex flex-col min-h-[340px] border-r border-gray-100">
        {p.gallery && p.gallery.length > 0 ? (
           <div className="flex-1 flex flex-col p-6 bg-slate-900 text-white">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-display font-black text-lg text-amber-300">Reference Assets</h3>
               <span className="px-3 py-1 bg-white/10 rounded-full font-ui text-[9px] uppercase tracking-widest font-black text-gray-300">
                 {p.gallery.length} files
               </span>
             </div>
             
             <div className="grid grid-cols-2 gap-3 mb-4">
               {p.gallery.map((img: string, idx: number) => (
                 <div key={idx} className={`relative overflow-hidden rounded-xl shadow-md border border-white/20 group/img ${idx === 0 && p.gallery.length % 2 !== 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'}`}>
                   <img src={img} alt={`Gallery ${idx}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
                     <button onClick={() => onImageClick(img)} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors shadow-lg" title="View Fullscreen">
                       <Maximize className="w-5 h-5" />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        ) : p.designImageUrl ? (
          <div className="relative flex-1 flex items-center justify-center group/img min-h-[340px] bg-black">
            <img src={p.designImageUrl} alt="Reference" className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover/img:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            
            {/* Hover Action */}
            <div className="absolute inset-0 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4 z-10">
              <button onClick={() => onImageClick(p.designImageUrl)} className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors shadow-2xl border border-white/40" title="View Fullscreen">
                <Maximize className="w-6 h-6" />
              </button>
            </div>
            
            <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center z-10">
              <span className="font-ui text-[9px] uppercase tracking-widest font-black text-amber-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-amber-400/30">
                📷 Reference Design
              </span>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 flex flex-col items-center justify-center flex-1 min-h-[340px] bg-gray-100">
            <Gallery className="w-14 h-14 mb-2 text-gray-300" />
            <span className="font-ui text-[10px] uppercase tracking-widest font-bold text-gray-400">No Custom Photo</span>
          </div>
        )}
      </div>

      {/* Details (Right Column) */}
      <div className="lg:w-3/5 p-8 md:p-10 flex flex-col justify-between">
        
        {/* Step Progress Bar */}
        <div className="mb-6 bg-gray-50 border border-gray-200/80 p-3 rounded-2xl">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest mb-2 px-1">
            <span className={stepIndex >= 1 ? 'text-amber-700' : 'text-gray-400'}>1. Accepted</span>
            <span className={stepIndex >= 2 ? 'text-indigo-700' : 'text-gray-400'}>2. Production</span>
            <span className={stepIndex >= 3 ? 'text-emerald-700' : 'text-gray-400'}>3. Ready</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden flex">
            <div className={`h-full transition-all duration-500 ${stepIndex >= 1 ? 'bg-amber-500 w-1/3' : 'w-0'}`} />
            <div className={`h-full transition-all duration-500 ${stepIndex >= 2 ? 'bg-indigo-600 w-1/3' : 'w-0'}`} />
            <div className={`h-full transition-all duration-500 ${stepIndex >= 3 ? 'bg-emerald-500 w-1/3' : 'w-0'}`} />
          </div>
        </div>

        {/* Order ID & Title */}
        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg">
                #{o.orderNumber || 'Task'}
              </span>
              {o.orderNumber && (
                <button 
                  onClick={copyOrderId} 
                  className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                  title="Copy Order ID"
                >
                  {copied ? <TickSquare className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <h2 className={`font-display font-black text-3xl md:text-4xl leading-tight ${isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>{task.productName}</h2>
          </div>
          <div className="text-right shrink-0 bg-amber-50/70 border border-amber-200/80 px-5 py-3 rounded-2xl shadow-sm">
            <p className="font-ui text-[8px] uppercase tracking-widest font-black text-amber-800 mb-0.5">Required Qty</p>
            <p className="font-display font-black text-3xl text-amber-950">{task.quantity}</p>
          </div>
        </div>

        {/* SLA & Location */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-2xl border ${isUrgent && !isCompleted ? 'bg-rose-50 border-rose-200' : isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50/50 border-amber-200/70'}`}>
            <p className={`font-ui text-[9px] uppercase tracking-widest font-black mb-1 flex items-center gap-1.5 ${isUrgent && !isCompleted ? 'text-rose-600' : isCompleted ? 'text-emerald-600' : 'text-amber-800'}`}>
              <Clock className="w-3.5 h-3.5"/> {isCompleted ? 'Delivery Status' : 'Target SLA'}
            </p>
            <p className={`font-display font-black text-xl ${isUrgent && !isCompleted ? 'text-rose-600' : isCompleted ? 'text-emerald-600' : 'text-gray-900'}`}>{timeLeftStr}</p>
            {!isCompleted && o.targetDate && (
              <p className="font-ui text-[10px] font-bold text-amber-900/80 mt-1">
                📅 {formatDayLabel(o.targetDate)} ({formatDate(o.targetDate)}) · {formatTime(o.targetDate)}
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
            <p className="font-ui text-[9px] uppercase tracking-widest font-black text-gray-500 mb-1 flex items-center gap-1.5">
              <Location className="w-3.5 h-3.5 text-indigo-600"/> Destination
            </p>
            <p className="font-display font-black text-lg text-gray-900 leading-tight">{o.branch?.name || 'Main Kitchen'}</p>
            <p className="font-ui text-[9px] font-bold text-gray-500 mt-1">Deliver to Decorator Counter</p>
          </div>
        </div>

        {/* Sales Instructions Box */}
        {(task.instructions || p.notes) && !isCompleted && (
          <div className="mb-6 p-5 bg-purple-50/80 rounded-2xl border-2 border-purple-200/80 flex gap-3.5 text-purple-950 shadow-sm">
            <Danger className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-ui text-[9px] uppercase tracking-widest font-black text-purple-800 mb-1">
                💬 Sales Instructions & Special Requirements
              </p>
              <p className="font-editorial italic text-base text-purple-900 font-bold leading-relaxed">
                &quot;{task.instructions || p.notes}&quot;
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-gray-100 mt-auto">
          {s === 'ready' || s === 'ready_for_pickup' || isCompleted ? (
            <div className="w-full py-5 rounded-2xl bg-emerald-100/80 border-2 border-emerald-300 text-emerald-800 font-ui text-[11px] uppercase tracking-widest font-black flex items-center justify-center gap-2 shadow-sm">
              <TickCircle className="w-5 h-5 text-emerald-600" />
              Ready for Pickup (Submitted to Branch)
            </div>
          ) : (
            <button 
              disabled={isCompleted}
              onClick={() => onUpdate(task.id, btnAction)}
              className={`w-full py-5 rounded-2xl font-ui text-[11px] uppercase tracking-[0.2em] font-black transition-all duration-300 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
                btnAction === 'ACCEPTED' 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' 
                  : btnAction === 'MAKING' 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
              }`}
            >
              {btnAction === 'ACCEPTED' && <Flash className="w-4 h-4" />}
              {btnAction === 'MAKING' && <Play className="w-4 h-4" />}
              {btnAction === 'READY_FOR_PICKUP' && <BagTick className="w-4 h-4" />}
              {btnLabel}
            </button>
          )}
        </div>

      </div>
    </motion.div>
  );
}
