"use client";

import { useState } from "react";
import { useOrders, Order } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";
import { BoxTick, TickCircle, Location, Camera, ShieldTick, Danger, TruckFast, Receipt1, Clock } from "iconsax-react";
import { AuroraBackground } from "@/components/aceternity/AuroraBackground";
import NumberTicker from "@/components/magicui/NumberTicker";

export default function DeliveryAgentPage() {
  const { orders } = useOrders();
  
  const openJobs = orders.filter(o => o.status === "pending_assignment");
  const myJobs = orders.filter(o => ["assigned_to_driver", "picked_up_by_driver", "on_the_way"].includes(o.status));
  const completedJobs = orders.filter(o => o.status === "delivered");

  const cashToCollect = myJobs.reduce((acc, job) => acc + job.pendingBalance, 0);
  const cashCollected = completedJobs.reduce((acc, job) => acc + job.pendingBalance, 0);



  const itemVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <AuroraBackground className="h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden !justify-start" data-lenis-prevent>
      
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl px-6 py-4 sticky top-0 z-30 border-b border-white shadow-sm shrink-0">
        <div className="flex items-center justify-between w-full mx-auto">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#3E2723] tracking-tight font-serif drop-shadow-sm">Delivery Command</h1>
            <p className="text-[10px] lg:text-xs font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
              Active Driver &bull; Khanderao Branch
            </p>
          </div>
          <div className="bg-[#3E2723] text-white p-2.5 lg:p-3 rounded-2xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform">
            <TruckFast className="w-5 h-5 lg:w-6 lg:h-6" variant="Bold" />
          </div>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="p-4 lg:p-6 w-full mx-auto h-full pb-20">
        <div className="flex flex-col xl:grid xl:grid-cols-3 gap-8 h-full items-start overflow-x-auto hide-scrollbar">
          
          {/* COLUMN 1: OPEN JOBS */}
          <div className="flex flex-col h-full max-h-full min-h-[400px] w-full shrink-0">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#3E2723] flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" variant="Bold" /> Open Pool
              </h2>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">{openJobs.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-4">
              <AnimatePresence>
                {openJobs.length === 0 ? (
                  <motion.div key="empty-open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-10 opacity-50">
                    <BoxTick className="w-12 h-12 text-[#3E2723] mb-2" variant="Outline" />
                    <p className="text-xs font-bold">No open assignments.</p>
                  </motion.div>
                ) : (
                  openJobs.map(job => (
                    <motion.div key={job.id} variants={itemVariants} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.9 }}>
                      <JobCard order={job} type="open" />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* COLUMN 2: ACTIVE DELIVERIES */}
          <div className="flex flex-col h-full max-h-full min-h-[400px] w-full shrink-0">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#3E2723] flex items-center gap-2">
                <TruckFast className="w-5 h-5 text-amber-600" variant="Bold" /> My Queue
              </h2>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">{myJobs.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-4">
              <AnimatePresence>
                {myJobs.length === 0 ? (
                  <motion.div key="empty-active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-10 opacity-50">
                    <Location className="w-12 h-12 text-[#3E2723] mb-2" variant="Outline" />
                    <p className="text-xs font-bold">You have no active deliveries.</p>
                  </motion.div>
                ) : (
                  myJobs.map(job => (
                    <motion.div key={job.id} variants={itemVariants} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.9 }}>
                      <JobCard order={job} type="active" />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* COLUMN 3: METRICS & COMPLETED */}
          <div className="flex flex-col h-full max-h-full min-h-[400px] w-full shrink-0">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#3E2723] flex items-center gap-2">
                <ShieldTick className="w-5 h-5 text-emerald-600" variant="Bold" /> Dashboard
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-4">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="uiverse-card p-4 rounded-3xl flex flex-col items-center justify-center border-emerald-500/30">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mb-1 text-center">Collected Today</p>
                  <p className="text-xl lg:text-2xl font-black text-emerald-600 drop-shadow-sm flex items-center">
                    ₹<NumberTicker value={cashCollected} />
                  </p>
                </div>
                <div className="uiverse-card p-4 rounded-3xl flex flex-col items-center justify-center border-rose-500/30">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mb-1 text-center">To Collect</p>
                  <p className="text-xl lg:text-2xl font-black text-rose-600 drop-shadow-sm flex items-center">
                    ₹<NumberTicker value={cashToCollect} />
                  </p>
                </div>
                <div className="uiverse-card p-4 rounded-3xl flex flex-col items-center justify-center col-span-2">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mb-1">Total Delivered</p>
                  <p className="text-3xl font-black text-[#3E2723] drop-shadow-sm">
                    <NumberTicker value={completedJobs.length} />
                  </p>
                </div>
              </div>

              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-black/10 pb-2 mb-3">Completed History</h3>
              <AnimatePresence>
                {completedJobs.length === 0 ? (
                  <motion.div key="empty-history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-6 opacity-50 text-center">
                    <Receipt1 className="w-8 h-8 text-[#3E2723] mb-2" variant="Outline" />
                    <p className="text-xs font-bold">No completed orders yet.</p>
                  </motion.div>
                ) : (
                  completedJobs.map(job => (
                    <motion.div key={job.id} variants={itemVariants} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.9 }}>
                      <CompletedCard order={job} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </AuroraBackground>
  );
}

function JobCard({ order, type }: { order: Order, type: "open" | "active" }) {
  const { updateOrderStatus } = useOrders();
  const [showPOD, setShowPOD] = useState(false);

  const handleAccept = () => updateOrderStatus(order.id, "assigned_to_driver");
  const handlePickup = () => updateOrderStatus(order.id, "picked_up_by_driver");
  const handleStart = () => updateOrderStatus(order.id, "on_the_way");
  const handleDeliver = () => {
    setShowPOD(false);
    updateOrderStatus(order.id, "delivered");
  };

  return (
    <div className="uiverse-card animated-shiny-border rounded-3xl overflow-hidden relative group border-transparent shadow-sm">
      {/* Status Bar Indicator */}
      <div className={`h-1.5 w-full ${type === "open" ? "bg-blue-500" : "bg-amber-500"} shadow-sm relative z-10`}></div>
      
      <div className="p-4 lg:p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg lg:text-xl font-black text-[#3E2723] drop-shadow-sm">{order.id}</h3>
            <p className="text-[10px] font-bold text-gray-600 mt-0.5">{order.customerName}</p>
          </div>
          {order.pendingBalance > 0 ? (
            <div className="bg-rose-50 px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl text-right border border-rose-100 shadow-sm">
              <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Collect Cash</p>
              <p className="text-sm lg:text-base font-black text-rose-700">₹{order.pendingBalance}</p>
            </div>
          ) : (
            <div className="bg-emerald-50 px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl text-right border border-emerald-100 shadow-sm">
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Prepaid</p>
              <p className="text-sm lg:text-base font-black text-emerald-700 flex items-center gap-1 justify-end"><TickCircle className="w-3.5 h-3.5" variant="Bold" /> Paid</p>
            </div>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 mb-4 border border-white flex items-start gap-2 shadow-inner group/pin hover:-translate-y-2 hover:shadow-xl transition-all cursor-pointer relative">
          <Location className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5 group-hover/pin:animate-bounce group-hover/pin:text-emerald-500 transition-colors" variant="Bold" />
          <p className="text-[11px] lg:text-xs font-bold text-gray-800 line-clamp-2 leading-tight">{order.deliveryAddress}</p>
          <div className="absolute inset-0 border-2 border-emerald-500 rounded-2xl opacity-0 group-hover/pin:opacity-100 transition-opacity"></div>
        </div>

        {type === "open" && (
          <button 
            onClick={handleAccept}
            className="cyber-button w-full py-4 text-sm font-black tracking-widest"
          >
            ACCEPT ORDER
          </button>
        )}

        {type === "active" && (
          <div className="space-y-2">
            {order.status === "assigned_to_driver" && (
              <button onClick={handlePickup} className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md shadow-blue-500/20">
                Order Pick Up
              </button>
            )}
            {order.status === "picked_up_by_driver" && (
              <button onClick={handleStart} className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md shadow-amber-500/20">
                Out for Delivery
              </button>
            )}
            {order.status === "on_the_way" && (
              <button onClick={() => setShowPOD(true)} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-emerald-500/30 border border-emerald-400">
                Deliver & Collect Money
              </button>
            )}
          </div>
        )}
      </div>

      {/* POD Modal (Glassmorphism overlay) */}
      <AnimatePresence>
        {showPOD && (
          <motion.div 
            key="pod-modal"
            initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 bg-white/40 backdrop-blur-2xl z-50 flex flex-col"
          >
            <div className="p-4 lg:p-6 border-b border-white/50 bg-white/60 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-xl lg:text-2xl font-black text-[#3E2723] font-serif drop-shadow-sm">Order Delivered</h3>
                <p className="text-[10px] lg:text-xs font-bold text-gray-600 mt-1">{order.id}</p>
              </div>
              <button onClick={() => setShowPOD(false)} className="text-gray-500 text-xs font-black bg-gray-200/50 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">Close</button>
            </div>
            
            <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
              {order.pendingBalance > 0 && (
                <div className="cyber-brutal-sos p-6 lg:p-8 rounded-3xl text-center bg-rose-50 border-4 border-rose-200 shadow-xl mt-4 mb-6 relative overflow-visible">
                  <p className="text-sm lg:text-base font-black text-rose-600 uppercase tracking-[0.3em] mb-4 flex items-center justify-center gap-2">
                    <Danger className="w-6 h-6 animate-pulse" variant="Bold" /> Mandatory Collection
                  </p>
                  <p className="text-5xl lg:text-6xl font-black text-rose-700 mb-8 drop-shadow-md leading-normal py-2">₹{order.pendingBalance}</p>
                  <label className="flex items-center justify-center gap-4 font-black text-rose-900 bg-white py-5 lg:py-6 rounded-2xl shadow-md border-4 border-rose-300 cursor-pointer hover:bg-rose-100 hover:scale-[1.02] transition-all text-base lg:text-lg">
                    <input type="checkbox" className="w-8 h-8 accent-rose-600 rounded-md border-2 border-rose-400 shrink-0" />
                    <span>CASH COLLECTED & VERIFIED</span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <button className="flex flex-col items-center justify-center p-6 bg-white/60 rounded-3xl border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 transition-colors shadow-sm">
                  <Camera className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400 mb-2" variant="Bold" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Take Photo</span>
                </button>
                <button className="flex flex-col items-center justify-center p-6 bg-white/60 rounded-3xl border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 transition-colors shadow-sm">
                  <ShieldTick className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400 mb-2" variant="Bold" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">E-Signature</span>
                </button>
              </div>
            </div>

            <div className="p-4 lg:p-6 border-t border-white/50 bg-white/60">
              <button onClick={handleDeliver} className="uiverse-button w-full py-4 lg:py-5 text-sm lg:text-base font-black tracking-widest">
                COMPLETE DELIVERY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CompletedCard({ order }: { order: Order }) {
  return (
    <div className="bg-white/40 backdrop-blur-md rounded-2xl p-3 border border-white/50 flex items-center justify-between shadow-sm hover:bg-white/60 transition-colors">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-100 p-2 rounded-xl border border-emerald-200">
          <TickCircle className="w-5 h-5 text-emerald-600" variant="Bold" />
        </div>
        <div>
          <p className="text-xs font-black text-[#3E2723]">{order.id}</p>
          <p className="text-[9px] font-bold text-muted-foreground">{order.customerName}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Collected</p>
        <p className="text-xs font-black text-emerald-700">₹{order.pendingBalance}</p>
      </div>
    </div>
  );
}
