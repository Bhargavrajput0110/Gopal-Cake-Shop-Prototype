"use client";

import React, { useEffect, useState } from 'react';
import { Box, Location, TickCircle, Reserve, Clock, Warning2, ArrowRight, Home2, Receipt21, Star1, Map } from "iconsax-react";
import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const resolvedParams = React.use(params);

  useEffect(() => {
    fetch(`/api/v1/public/orders/${resolvedParams.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-background to-background"></div>
        <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin z-10"></div>
        <p className="mt-6 text-amber-500 font-ui text-[10px] uppercase tracking-[0.3em] font-black z-10 animate-pulse">Locating Order</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/10 via-background to-background"></div>
        <Warning2 className="w-16 h-16 text-rose-500 mb-6 z-10" />
        <h1 className="text-3xl font-display font-black text-white mb-2 z-10">Order Not Found</h1>
        <p className="text-gray-400 font-editorial italic mb-8 z-10">{error}</p>
        <Link href="/" className="px-8 py-4 bg-white text-black rounded-full font-ui text-[10px] uppercase tracking-[0.2em] font-black shadow-lg hover:scale-105 transition-transform z-10">
          Return Home
        </Link>
      </div>
    );
  }

  // Determine stage (0 to 4)
  const getStageIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('received') || s.includes('new')) return 0;
    if (s.includes('preparing') || s.includes('making') || s.includes('chef') || s.includes('baking')) return 1;
    if (s.includes('ready')) return 2;
    if (s.includes('out') || s.includes('way') || s.includes('picked')) return 3;
    if (s.includes('delivered') || s.includes('completed')) return 4;
    return 0;
  };

  const currentStage = getStageIndex(order.status);
  const isDelivered = currentStage === 4;

  const stages = [
    { title: "Confirmed", subtitle: "We've received it", icon: Clock },
    { title: "Preparing", subtitle: "Chef is baking", icon: Reserve },
    { title: "Ready", subtitle: "Awaiting dispatch", icon: Box },
    { title: "On The Way", subtitle: "Out for delivery", icon: Location },
    { title: "Delivered", subtitle: "Enjoy your cake!", icon: TickCircle },
  ];

  const getStageTimestamp = (stageIndex: number) => {
    if (!order.timeline || !Array.isArray(order.timeline)) return null;
    const event = order.timeline.find((t: any) => getStageIndex(t.status) === stageIndex);
    return event ? event.createdAt : null;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative pb-32">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-500/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-20%] w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-emerald-500/5 to-transparent blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 relative z-10 pt-6">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <BackButton fallback="/" label="Back to Shop" variant="ghost" className="px-0 text-gray-400 hover:text-white" />
          <Link href="/" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Home2 className="w-5 h-5" />
          </Link>
        </header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <p className="font-ui text-[10px] uppercase tracking-[0.3em] font-black text-amber-500 mb-3">Order Tracking</p>
          <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-2">#{order.orderNumber || order.id.split('-').pop()}</h1>
          <p className="font-editorial italic text-gray-400 text-lg">ETA: {order.timeTarget ? new Date(order.timeTarget).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Today'}</p>
        </motion.div>

        {/* Live Status Hero */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.1 }}
          className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 mb-10 overflow-hidden text-center"
        >
          {/* Animated Glow Behind Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-[60px]"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: isDelivered ? [0, 5, -5, 0] : 0
              }} 
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl ${isDelivered ? 'bg-emerald-500 text-white' : 'bg-gradient-to-tr from-amber-500 to-amber-300 text-amber-950'}`}
            >
              {React.createElement(stages[currentStage]?.icon || Warning2, { className: "w-12 h-12", variant: "Bold" })}
            </motion.div>
            
            <h2 className="font-display font-black text-3xl mb-2">{order.status}</h2>
            <p className="font-ui text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
              {isDelivered ? 'Delivered successfully' : 'Live updates active'}
            </p>
          </div>
        </motion.div>

        {/* Progress Stepper */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 mb-10"
        >
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />
            <div 
              className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-amber-400 to-emerald-400 transition-all duration-1000"
              style={{ height: `${(currentStage / (stages.length - 1)) * 100}%` }}
            />

            <div className="space-y-10">
              {stages.map((stage, idx) => {
                const isActive = idx === currentStage;
                const isPast = idx < currentStage;
                const timestamp = getStageTimestamp(idx);
                
                return (
                  <div key={idx} className="relative flex items-center gap-6 z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#050505] transition-all duration-500 ${isActive ? 'bg-amber-400 text-amber-950 scale-110 shadow-[0_0_20px_rgba(251,191,36,0.4)]' : isPast ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                      <stage.icon className="w-5 h-5" variant={isActive || isPast ? "Bold" : "Outline"} />
                    </div>
                    <div>
                      <h3 className={`font-display font-black text-xl mb-0.5 transition-colors ${isActive ? 'text-amber-400' : isPast ? 'text-white' : 'text-gray-500'}`}>{stage.title}</h3>
                      <p className="font-ui text-[9px] uppercase tracking-[0.2em] font-bold text-gray-500">{stage.subtitle}</p>
                      {timestamp && (
                        <p className="font-editorial text-xs text-gray-400 mt-1 italic">
                          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Order Details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <h3 className="font-ui text-[10px] uppercase tracking-[0.2em] font-black flex items-center gap-2">
              <Receipt21 className="w-4 h-4 text-amber-400" /> Order Summary
            </h3>
            <span className="font-display font-black text-xl">₹{order.totalAmount}</span>
          </div>
          <div className="p-6 space-y-4">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <Box className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white truncate text-lg leading-tight">{item.productName}</h4>
                  <p className="font-ui text-[9px] uppercase tracking-[0.2em] font-bold text-gray-500 mt-1">Qty: {item.quantity} {item.variant ? `• ${item.variant}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Support Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="mt-8 flex justify-center"
        >
          <button className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-ui text-[9px] uppercase tracking-[0.2em] font-black text-gray-300 transition-colors flex items-center gap-2">
            Need Help? Contact Store
          </button>
        </motion.div>

      </div>
    </div>
  );
}

