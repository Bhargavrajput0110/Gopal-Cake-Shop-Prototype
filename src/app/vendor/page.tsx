"use client";
import { useEffect, useState } from "react";
import { TickCircle, Refresh2, Gallery, Location, Calendar2, Danger, CloseSquare, Clock, ArrowRight, Colorfilter, Diagram, Camera, DocumentDownload, Maximize, CloudAdd } from "iconsax-react";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/ui/BackButton";

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
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeVendor, setActiveVendor] = useState<{id: string, name: string, type: string} | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // In prototype, we use the activeVendor ID. In real app, the token handles this.
      const url = activeVendor ? `/api/v1/vendor/tasks?vendorId=${activeVendor.id}` : `/api/v1/vendor/tasks`;
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.success) {
        // Map backend schema to UI format
        const mapped = json.data.map((item: any) => ({
          id: item.id,
          vendorId: item.assignedVendor?.id || "UNKNOWN",
          order: {
            orderNumber: item.order.orderNumber,
            branch: { name: item.order.branch.name },
            targetDate: item.order.targetDate
          },
          productName: item.productName,
          quantity: item.quantity,
          status: item.status,
          parentItem: {
            productName: item.parentItem?.productName || "Unknown Item",
            notes: item.notes || item.parentItem?.notes || "",
            designImageUrl: item.parentItem?.designImageUrl || "",
            gallery: item.parentItem?.media?.map((m: any) => m.url) || []
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const vId = params.get('vendorId');
      if (vId === 'VENDOR_ACRYLIC') setActiveVendor({ id: 'VENDOR_ACRYLIC', name: 'Creative Acrylics', type: 'Custom Toppers & MDF' });
      else if (vId === 'VENDOR_FLORIST') setActiveVendor({ id: 'VENDOR_FLORIST', name: 'Sayaji Florists', type: 'Premium Botanicals' });
      else if (vId === 'VENDOR_PHOTO') setActiveVendor({ id: 'VENDOR_PHOTO', name: 'Gopal Photography Studio', type: 'Product & Event Photography' });
    }
  }, []);

  useEffect(() => {
    if (activeVendor) fetchTasks();
  }, [activeVendor]);

  const updateTask = async (id: string, action: string) => {
    // Optimistic Update
    const originalTasks = [...tasks];
    let nextStatus = action === 'ACCEPTED' ? 'CHEF_ACCEPTED' : action;
    if (action === 'READY_FOR_PICKUP') nextStatus = 'READY_FOR_PICKUP';
    
    setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));

    try {
      const res = await fetch(`/api/v1/vendor/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (action === 'READY_FOR_PICKUP') {
        setToastMessage(`Masterpiece submitted successfully!`);
      } else {
        setToastMessage(action === 'ACCEPTED' ? `Assignment Accepted.` : `Production Started.`);
      }
    } catch (e) {
      console.error(e);
      setTasks(originalTasks); // Rollback
      setToastMessage("Failed to update status");
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-950"><Refresh2 className="animate-spin w-12 h-12 text-gray-500" /></div>;

  // PREMIUM VENDOR LOGIN
  if (!activeVendor) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row relative">
        <div className="absolute top-6 left-6 z-[110]">
          <BackButton fallback="/login" label="Exit to Staff Login" variant="ghost" className="text-white hover:text-gray-950 hover:bg-white" />
        </div>
        {/* Left: Branding */}
        <div className="flex-1 p-12 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1600')] bg-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent"></div>
          
          <div className="relative z-10 max-w-lg">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20">
              <Diagram className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6">Partner<br/><span className="text-gray-500">Studio</span></h1>
            <p className="font-editorial italic text-xl text-gray-400">Exclusive portal for Gopal Cake Shop's creative vendors and suppliers.</p>
          </div>
        </div>

        {/* Right: Login Selection */}
        <div className="flex-1 bg-gray-900 p-8 md:p-12 lg:p-24 flex flex-col justify-center">
          <h2 className="font-ui text-[10px] uppercase tracking-widest font-black text-gray-500 mb-8">Select Your Studio</h2>
          
          <div className="space-y-4">
            <button 
              onClick={() => setActiveVendor({ id: 'VENDOR_ACRYLIC', name: 'Creative Acrylics', type: 'Custom Toppers & MDF' })}
              className="w-full bg-gray-800 hover:bg-gray-800/80 border border-gray-700 hover:border-gray-500 transition-all p-6 rounded-3xl flex items-center gap-6 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                <Colorfilter className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-black text-2xl text-white group-hover:text-indigo-400 transition-colors">Creative Acrylics</h3>
                <p className="font-ui text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-1">Custom Toppers & MDF</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-600 ml-auto group-hover:text-white transition-colors" />
            </button>
            
            <button 
              onClick={() => setActiveVendor({ id: 'VENDOR_FLORIST', name: 'Sayaji Florists', type: 'Premium Botanicals' })}
              className="w-full bg-gray-800 hover:bg-gray-800/80 border border-gray-700 hover:border-gray-500 transition-all p-6 rounded-3xl flex items-center gap-6 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                <Gallery className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-black text-2xl text-white group-hover:text-rose-400 transition-colors">Sayaji Florists</h3>
                <p className="font-ui text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-1">Premium Botanicals</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-600 ml-auto group-hover:text-white transition-colors" />
            </button>
            
            <button 
              onClick={() => setActiveVendor({ id: 'VENDOR_PHOTO', name: 'Gopal Photography Studio', type: 'Product & Event Photography' })}
              className="w-full bg-gray-800 hover:bg-gray-800/80 border border-gray-700 hover:border-gray-500 transition-all p-6 rounded-3xl flex items-center gap-6 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-black text-2xl text-white group-hover:text-blue-400 transition-colors">Gopal Photography Studio</h3>
                <p className="font-ui text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-1">Product & Event Photography</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-600 ml-auto group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myTasks = tasks.filter(t => t.vendorId === activeVendor.id);
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
              setActiveVendor(null);
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', '/vendor');
              }
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
              
              if (task.status === 'CHEF_ACCEPTED') {
                statusLabel = 'Accepted';
                btnAction = 'MAKING';
                btnLabel = 'START PRODUCTION';
                btnColor = 'bg-indigo-600 text-white hover:bg-indigo-700';
              } else if (task.status === 'MAKING') {
                statusLabel = 'In Production';
                btnAction = 'READY_FOR_PICKUP';
                btnLabel = 'MARK AS READY';
                btnColor = 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
              } else if (task.status === 'COMPLETED') {
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
                  onUpdate={updateTask}
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={`bg-white rounded-[2rem] shadow-sm border ${isCompleted ? 'border-gray-100 opacity-75' : 'border-gray-200'} overflow-hidden flex flex-col lg:flex-row group`}
    >
      {/* Visual Reference (Left/Top) */}
      <div className="lg:w-2/5 bg-gray-100 relative overflow-hidden flex flex-col min-h-[300px]">
        {p.gallery ? (
           <div className="flex-1 flex flex-col p-6 bg-gray-50 border-r border-gray-200">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-display font-black text-xl text-gray-900">Reference Assets</h3>
               <span className="px-3 py-1 bg-gray-200 rounded-full font-ui text-[9px] uppercase tracking-widest font-black text-gray-600">
                 {p.gallery.length} files
               </span>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mb-6">
               {p.gallery.map((img: string, idx: number) => (
                 <div key={idx} className={`relative overflow-hidden rounded-2xl shadow-sm border border-gray-200 group/img ${idx === 0 && p.gallery.length % 2 !== 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'}`}>
                   <img src={img} alt={`Gallery ${idx}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                   
                   {/* Hover Overlay with Action Icons */}
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
                     <button onClick={() => onImageClick(img)} className="p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/40 transition-colors shadow-lg" title="View Fullscreen">
                       <Maximize className="w-5 h-5" />
                     </button>
                     <button className="p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/40 transition-colors shadow-lg" title="Download Asset">
                       <DocumentDownload className="w-5 h-5" />
                     </button>
                   </div>
                 </div>
               ))}
             </div>

             <button className="mt-auto w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-ui text-[10px] uppercase tracking-widest font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
               <DocumentDownload className="w-5 h-5" />
               Download All Assets (.zip)
             </button>
           </div>
        ) : p.designImageUrl ? (
          <div className="relative flex-1 flex items-center justify-center group/img">
            <img src={p.designImageUrl} alt="Reference" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-105" />
            
            {/* Hover Overlay with Action Icons */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button onClick={() => onImageClick(p.designImageUrl)} className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors shadow-lg" title="View Fullscreen">
                <Maximize className="w-6 h-6" />
              </button>
              <button className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors shadow-lg" title="Download Asset">
                <DocumentDownload className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 flex flex-col items-center justify-center flex-1">
            <Gallery className="w-12 h-12 mb-2 opacity-30" />
            <span className="font-ui text-[10px] uppercase tracking-widest font-bold">No Reference Image</span>
          </div>
        )}
        
        {/* Status Badge Over Image */}
        <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-900 font-ui text-[10px] uppercase tracking-widest font-black shadow-lg">
          {statusLabel}
        </div>
      </div>

      {/* Details (Right/Bottom) */}
      <div className="lg:w-3/5 p-8 md:p-12 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="font-ui text-[10px] uppercase tracking-widest font-black text-indigo-600 mb-2">#{o.orderNumber || 'Task'}</p>
            <h2 className={`font-display font-black text-4xl leading-none ${isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>{task.productName}</h2>
          </div>
          <div className="text-right shrink-0 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100">
            <p className="font-ui text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-1">Required Qty</p>
            <p className="font-display font-black text-4xl text-gray-900">{task.quantity}</p>
          </div>
        </div>

        {/* SLA & Location */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className={`p-5 rounded-2xl border ${isUrgent && !isCompleted ? 'bg-rose-50 border-rose-200' : isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
            <p className={`font-ui text-[9px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2 ${isUrgent && !isCompleted ? 'text-rose-600' : isCompleted ? 'text-emerald-600' : 'text-gray-500'}`}>
              <Clock className="w-4 h-4"/> {isCompleted ? 'Delivery Status' : 'Delivery SLA'}
            </p>
            <p className={`font-display font-bold text-2xl ${isUrgent && !isCompleted ? 'text-rose-600' : isCompleted ? 'text-emerald-600' : 'text-gray-900'}`}>{timeLeftStr}</p>
            {!isCompleted && <p className="font-ui text-[10px] font-bold text-gray-500 mt-1">{targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
          </div>
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="font-ui text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-2 flex items-center gap-2">
              <Location className="w-4 h-4"/> Destination
            </p>
            <p className="font-display font-bold text-xl text-gray-900">{o.branch?.name}</p>
            <p className="font-ui text-[10px] font-bold text-gray-500 mt-1">Deliver to Kitchen</p>
          </div>
        </div>

        {/* Notes / Masterpiece Context */}
        {p.notes && !isCompleted && (
          <div className="mb-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
            <Danger className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-ui text-[9px] uppercase tracking-widest font-black text-amber-700 mb-2">Designer Notes ({p.productName})</p>
              <p className="font-editorial italic text-lg text-amber-900 leading-relaxed">{p.notes}</p>
            </div>
          </div>
        )}

        {/* Photographers: Upload Work Dropzone */}
        {isPhotographer && !isCompleted && btnAction === 'READY_FOR_PICKUP' && (
          <div className="mb-8 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group/upload">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover/upload:scale-110 transition-transform">
              <CloudAdd className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="font-display font-bold text-xl text-gray-900 mb-1">Upload Deliverables</p>
            <p className="font-ui text-[10px] uppercase tracking-widest font-bold text-gray-500">Drag & Drop Photos Here (0 uploaded)</p>
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-auto pt-6 border-t border-gray-100">
          <button 
            disabled={isCompleted}
            onClick={() => onUpdate(task.id, btnAction)}
            className={`w-full py-6 rounded-2xl font-ui text-[11px] uppercase tracking-widest font-black transition-transform ${!isCompleted && 'active:scale-[0.98]'} ${btnColor}`}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
