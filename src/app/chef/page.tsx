"use client";

import { useState, useEffect } from "react";
import { Clock, Timer1, Warning2, TickCircle, ProfileCircle } from "iconsax-react";
import { useOrders, Order } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";
import { Particles } from "@/components/magicui/Particles";
import { BorderBeam } from "@/components/magicui/BorderBeam";
import { TypewriterEffect } from "@/components/aceternity/TypewriterEffect";

const CHEF_ID = "CHEF-101";

export default function ChefKanbanDashboard() {
  const { orders } = useOrders();

  // Sort orders: Priority orders first, then by delivery time (ascending)
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return new Date(a.timeTarget).getTime() - new Date(b.timeTarget).getTime();
  });

  // Kanban Columns
  const incoming = sortedOrders.filter(o => o.status === "accepted_by_chef");
  const inProduction = sortedOrders.filter(o => ["preparing", "decorating"].includes(o.status) && o.assignedChef === CHEF_ID);
  const ready = sortedOrders.filter(o => o.status === "ready_for_pickup");

  return (
    <div className="flex-1 flex flex-col font-sans overflow-hidden min-h-0 bg-[#FAFAF8] relative">
      <Particles className="absolute inset-0 pointer-events-none" quantity={150} staticity={30} color="#C5A059" vx={0.2} vy={-0.2} />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#C5A059]/10 pointer-events-none"></div>
      
      {/* HEADER */}
      <header className="h-16 border-b flex items-center justify-between px-6 shrink-0 z-20 bg-white/80 backdrop-blur-md border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-orange-100 text-orange-800">
            <ProfileCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-widest text-gray-900">CHEF STATION</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-0.5">ID: {CHEF_ID} &bull; Khanderao</p>
          </div>
        </div>

        <div className="hidden md:flex gap-6 text-xs font-bold text-gray-600 mr-4">
          <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            Incoming <strong className="text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-sm">{incoming.length}</strong>
          </span>
          <span className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
            Production <strong className="text-orange-600 bg-white px-2 py-0.5 rounded-md border border-orange-200 shadow-sm">{inProduction.length}</strong>
          </span>
          <span className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            Ready <strong className="text-emerald-600 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-sm">{ready.length}</strong>
          </span>
        </div>
        
        <button 
          onClick={() => { document.cookie = 'gopal_dummy_role=; path=/; max-age=0'; window.location.href='/login'; }}
          className="ml-auto flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50"
        >
          Sign Out
        </button>
      </header>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 hide-scrollbar min-h-0" data-lenis-prevent>
        <div className="flex flex-col md:flex-row h-full gap-6 md:min-w-[1000px] min-h-0">
          
          {/* COLUMN 1: INCOMING */}
          <KanbanColumn title="INCOMING" count={incoming.length} theme="blue">
            {incoming.map(order => (
              <CompactOrderCard key={order.id} order={order} mode="incoming" />
            ))}
          </KanbanColumn>

          {/* COLUMN 2: IN PRODUCTION */}
          <KanbanColumn title="MY PRODUCTION" count={inProduction.length} theme="orange">
            {inProduction.map(order => (
              <CompactOrderCard key={order.id} order={order} mode="production" />
            ))}
          </KanbanColumn>

          {/* COLUMN 3: READY */}
          <KanbanColumn title="READY FOR DISPATCH" count={ready.length} theme="emerald">
            {ready.map(order => (
              <CompactOrderCard key={order.id} order={order} mode="ready" />
            ))}
          </KanbanColumn>

        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ title, count, theme, children }: { title: string, count: number, theme: "blue" | "orange" | "emerald", children: React.ReactNode }) {
  const themeClasses = {
    blue: {
      borderTop: "border-t-blue-500",
      bg: "bg-blue-50/30",
      headerBg: "bg-blue-100/50",
      text: "text-blue-800",
      badgeBg: "bg-blue-200",
      badgeText: "text-blue-900"
    },
    orange: {
      borderTop: "border-t-orange-500",
      bg: "bg-orange-50/30",
      headerBg: "bg-orange-100/50",
      text: "text-orange-800",
      badgeBg: "bg-orange-200",
      badgeText: "text-orange-900"
    },
    emerald: {
      borderTop: "border-t-emerald-500",
      bg: "bg-emerald-50/30",
      headerBg: "bg-emerald-100/50",
      text: "text-emerald-800",
      badgeBg: "bg-emerald-200",
      badgeText: "text-emerald-900"
    }
  }[theme];

  return (
    <div className={`uiverse-card flex-1 flex flex-col min-w-[300px] md:min-w-[340px] max-w-[420px] min-h-0 border-t-[4px] ${themeClasses.borderTop} rounded-3xl overflow-hidden group`}>
      <div className={`p-4 ${themeClasses.headerBg} border-b border-white/50 flex justify-between items-center shrink-0 shadow-sm backdrop-blur-md`}>
        <h2 className={`text-xs font-black tracking-widest uppercase ${themeClasses.text}`}>{title}</h2>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${themeClasses.badgeBg} ${themeClasses.badgeText}`}>{count}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar min-h-0" data-lenis-prevent>
        <AnimatePresence>
          {children}
        </AnimatePresence>
        {count === 0 && (
          <div className="text-center py-12 opacity-50">
            <p className={`text-xs font-bold uppercase tracking-widest ${themeClasses.text}`}>Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CompactOrderCard({ order, mode }: { order: Order, mode: "incoming" | "production" | "ready" }) {
  const { updateOrderStatus, reportIssue } = useOrders();
  const [qcState, setQcState] = useState([false, false, false]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showQC, setShowQC] = useState(false);
  const handlePickup = () => updateOrderStatus(order.id, "preparing", true, CHEF_ID);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDecorate = () => { /* setStatus("Decorating"); */ };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFinish = () => { 
    setShowQC(true); 
    if (qcState.every(v => v)) {
      setShowQC(false);
      updateOrderStatus(order.id, "ready_for_pickup");
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`relative uiverse-card ${order.isPriority ? "priority-alert-border" : ""} rounded-2xl flex flex-col group overflow-hidden ${
        order.isPriority ? "bg-rose-50 border-2 border-transparent" : "bg-white border border-transparent shadow-[0_0_15px_rgba(0,0,0,0.05)]"
      }`}
      style={{ "--card-bg": order.isPriority ? "rgba(255,241,242,0.9)" : "rgba(255,255,255,0.8)" } as React.CSSProperties}
    >
      {!order.isPriority && <BorderBeam duration={8} size={250} colorFrom="#C5A059" colorTo="#3E2723" borderWidth={2} className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-50" />}
      
      {/* HERO IMAGE SECTION */}
      <div className="relative w-full h-36 bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&h=300&q=80" 
          alt="Cake" 
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&h=300" }}
        />
        {/* Top Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70"></div>

        {/* Floating Badges over Image */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-white/90 backdrop-blur-md text-gray-900 px-2 py-1 rounded-lg text-xs font-black tracking-wider shadow-sm">
            {order.id}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {order.isPriority && <span className="neon-pulse-tag px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-lg">PRIORITY</span>}
          {order.vip && <span className="bg-amber-400 text-black px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-lg">VIP</span>}
        </div>

        {/* Floating Timers at Bottom of Image */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <CountdownTimer targetISO={order.timeTarget} />
          {mode === "production" && order.productionStartTime && (
            <ProductionTimer startTime={order.productionStartTime} />
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        
        {/* EXACT DUE TIME */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-100 p-2.5 rounded-xl shadow-sm">
          <Clock className="w-4 h-4 text-blue-600" variant="Bold" />
          <span>Due: <span className="text-gray-900 font-black">{formatTargetTime(order.timeTarget)}</span></span>
        </div>

        {/* ITEMS ONLY - Crystal Clear Sharp Fonts */}
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <p className="text-[15px] font-bold text-gray-900 tracking-tight leading-snug">
                <span className="text-orange-600 mr-1.5">{item.qty}x</span> 
                {item.name}
              </p>
            </div>
          ))}
        </div>

        {/* DEDICATED NOTES SECTION ABOVE BUTTONS */}
        {order.items.some(item => item.notes) && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 shrink-0 relative overflow-hidden shadow-inner">
            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Warning2 className="w-3 h-3 animate-pulse" variant="Bold" /> Critical Instructions
            </p>
            <div className="space-y-1">
              {order.items.filter(i => i.notes).map((item, idx) => (
                <div key={idx} className="flex gap-1.5 items-start">
                  <span className="text-xs text-rose-700/80 font-bold shrink-0">{item.name}:</span>
                  <TypewriterEffect 
                    text={item.notes || ""} 
                    className="text-xs text-rose-900 font-black leading-relaxed" 
                    cursorClassName="bg-rose-600 h-3"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="shrink-0 mt-1">
          {mode === "incoming" && (
            <div className="flex flex-col gap-2 mt-4">
              <button onClick={handlePickup} className="cyber-button w-full text-xs font-black tracking-widest py-3">
                Accept & Start Baking
              </button>
              <button 
                onClick={() => updateOrderStatus(order.id, "cancelled")} 
                className="w-full py-2 bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                Reject Order
              </button>
            </div>
          )}

          {mode === "production" && (
            <div className="flex flex-col gap-3 mt-4">
              <label className="uiverse-checkbox-wrapper p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors shadow-sm bg-white cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={qcState[0]} 
                  onChange={() => {
                    const next = [...qcState];
                    next[0] = !next[0];
                    setQcState(next);
                  }} 
                  className="uiverse-checkbox" 
                />
                <span className={`text-xs font-bold ${qcState[0] ? "text-emerald-700" : "text-gray-700"}`}>All items prepared & packed</span>
              </label>

              <button 
                onClick={() => updateOrderStatus(order.id, "ready_for_pickup")} 
                disabled={!qcState[0]}
                className="cyber-button w-full text-xs font-black tracking-widest py-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                READY FOR DISPATCH
              </button>

              <button 
                onClick={() => reportIssue(order.id, "Ingredient Missing", "normal", "Chef reported missing items")}
                className="w-full mt-1 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Warning2 className="w-4 h-4 animate-pulse" variant="Bold" /> Report Missing Ingredient
              </button>
            </div>
          )}

          {mode === "ready" && (
            <div className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-center text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2">
              <TickCircle className="w-4 h-4" variant="Bold" /> Sitting on counter
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}

// Timers
function CountdownTimer({ targetISO }: { targetISO: string }) {
  const [minsLeft, setMinsLeft] = useState(0);
  useEffect(() => {
    const calc = () => setMinsLeft(Math.floor((new Date(targetISO).getTime() - Date.now()) / 60000));
    calc();
    const int = setInterval(calc, 60000);
    return () => clearInterval(int);
  }, [targetISO]);

  let color = "text-emerald-400 bg-black/60 border-black/40";
  let isGlitch = false;
  if (minsLeft < 0) {
    color = "text-rose-500 bg-black/80 border-rose-500/50 font-black shadow-[0_0_15px_rgba(244,63,94,0.4)]";
    isGlitch = true;
  } else if (minsLeft < 60) {
    color = "text-rose-400 bg-rose-950/80 border-rose-900/50 font-bold animate-pulse";
  } else if (minsLeft < 120) {
    color = "text-amber-400 bg-black/60 border-black/40";
  }

  const textLabel = minsLeft < 0 ? "OVERDUE" : `${Math.floor(minsLeft/60)}h ${minsLeft%60}m left`;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border backdrop-blur-md ${color}`}>
      <Clock className={`w-3 h-3 ${isGlitch ? "animate-spin" : ""}`} variant="Bold" />
      <span 
        className={`text-[10px] tracking-widest whitespace-nowrap font-bold ${isGlitch ? "glitch-text" : ""}`}
        data-text={textLabel}
      >
        {textLabel}
      </span>
    </div>
  );
}

function ProductionTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const calc = () => setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 60000));
    calc();
    const int = setInterval(calc, 60000);
    return () => clearInterval(int);
  }, [startTime]);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 border border-black/40 backdrop-blur-md text-white/80">
      <Timer1 className="w-3 h-3" variant="Bold" />
      <span className="text-[9px] uppercase tracking-widest whitespace-nowrap font-bold">
        Baking: {Math.floor(elapsed/60)}h {elapsed%60}m
      </span>
    </div>
  );
}

function formatTargetTime(isoString: string) {
  const target = new Date(isoString);
  const now = new Date();
  const isToday = target.getDate() === now.getDate() && target.getMonth() === now.getMonth() && target.getFullYear() === now.getFullYear();
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = target.getDate() === tomorrow.getDate() && target.getMonth() === tomorrow.getMonth() && target.getFullYear() === tomorrow.getFullYear();

  const timeStr = target.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;
  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
}
