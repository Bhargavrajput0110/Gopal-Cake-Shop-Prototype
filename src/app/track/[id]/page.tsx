"use client";

import React, { useEffect, useState } from 'react';
import { Box, Location, TickCircle, Reserve, Clock, Warning2, Home2, Receipt21, Whatsapp } from "iconsax-react";
import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';

export default function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { clearCart } = useCart();
  
  const resolvedParams = React.use(params);

  // Clear cart when customer lands here after a Razorpay payment redirect
  useEffect(() => {
    try {
      const pendingPayment = sessionStorage.getItem('gcs_pending_payment');
      if (pendingPayment) {
        const { trackingId } = JSON.parse(pendingPayment);
        if (trackingId === resolvedParams.id) {
          clearCart();
          sessionStorage.removeItem('gcs_pending_payment');
          sessionStorage.removeItem('gcs_custom_cake_draft');
        }
      }
    } catch (e) {
      // ignore
    }
  }, [resolvedParams.id]);

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
      .catch(() => {
        setError('We could not find this order. Please check your link.');
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
    { title: "Confirmed",  subtitle: "We've received it",  icon: Clock },
    { title: "Preparing",  subtitle: "Chef is baking",     icon: Reserve },
    { title: "Ready",      subtitle: "Awaiting dispatch",  icon: Box },
    { title: "On The Way", subtitle: "Out for delivery",   icon: Location },
    { title: "Delivered",  subtitle: "Enjoy your cake!",   icon: TickCircle },
  ];

  const getStageTimestamp = (stageIndex: number) => {
    if (!order.timeline || !Array.isArray(order.timeline)) return null;
    const event = order.timeline.find((t: any) => getStageIndex(t.status) === stageIndex);
    return event ? event.createdAt : null;
  };

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  const handleShareWhatsApp = () => {
    const lines = [
      `🎂 *Gopal Cake Shop — Order Receipt*`,
      `Order #${order.orderNumber}`,
      ``,
      ...(order.items || []).map((i: any) =>
        `• ${i.productName}${i.variant ? ` (${i.variant})` : ''} × ${i.quantity} — ${fmt((i.price || 0) * i.quantity)}`
      ),
      ``,
      order.deliveryCharge > 0 ? `Delivery: ${fmt(order.deliveryCharge)}` : null,
      order.discount > 0 ? `Discount: -${fmt(order.discount)}` : null,
      `*Total: ${fmt(order.totalAmount)}*`,
      order.totalPaid > 0 ? `Paid: ${fmt(order.totalPaid)}` : null,
      order.balanceDue > 0 ? `Balance Due (pay on ${order.deliveryType === 'PICKUP' ? 'pickup' : 'delivery'}): *${fmt(order.balanceDue)}*` : `✅ Fully Paid`,
      ``,
      `Track your order: ${typeof window !== 'undefined' ? window.location.href : ''}`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
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

        {/* Order Number + ETA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <p className="font-ui text-[10px] uppercase tracking-[0.3em] font-black text-amber-500 mb-3">Order Tracking</p>
          <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-2">#{order.orderNumber}</h1>
          <p className="font-editorial italic text-gray-400 text-lg">
            {order.timeTarget
              ? `Due: ${new Date(order.timeTarget).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${new Date(order.timeTarget).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`
              : 'Today'}
          </p>
        </motion.div>

        {/* Live Status Hero */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.1 }}
          className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 mb-10 overflow-hidden text-center"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-[60px]" />
          <div className="relative z-10 flex flex-col items-center">
            <motion.div 
              animate={{ scale: [1, 1.05, 1], rotate: isDelivered ? [0, 5, -5, 0] : 0 }} 
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl ${
                isDelivered ? 'bg-emerald-500 text-white' : 'bg-gradient-to-tr from-amber-500 to-amber-300 text-amber-950'
              }`}
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
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#050505] transition-all duration-500 ${
                      isActive ? 'bg-amber-400 text-amber-950 scale-110 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                      : isPast ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-gray-500'
                    }`}>
                      <stage.icon className="w-5 h-5" variant={isActive || isPast ? "Bold" : "Outline"} />
                    </div>
                    <div>
                      <h3 className={`font-display font-black text-xl mb-0.5 transition-colors ${
                        isActive ? 'text-amber-400' : isPast ? 'text-white' : 'text-gray-500'
                      }`}>{stage.title}</h3>
                      <p className="font-ui text-[9px] uppercase tracking-[0.2em] font-bold text-gray-500">{stage.subtitle}</p>
                      {timestamp && (
                        <p className="font-editorial text-xs text-gray-400 mt-1 italic">
                          {new Date(timestamp).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── CUSTOMER BILL ──────────────────────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden mb-6"
        >
          {/* Bill header */}
          <div className="p-6 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt21 className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-ui text-[10px] uppercase tracking-[0.2em] font-black text-white">Your Bill</h3>
                <p className="font-editorial text-xs italic text-gray-500 mt-0.5">
                  Gopal Cake Shop • Order #{order.orderNumber}
                </p>
              </div>
            </div>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-full text-[#25D366] font-ui text-[9px] uppercase tracking-[0.15em] font-black transition-colors"
            >
              <Whatsapp className="w-4 h-4" />
              Share
            </button>
          </div>

          {/* Line items */}
          <div className="p-6 space-y-5">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-4 items-start">
                {item.image ? (
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0">
                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                    <Box className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-white text-sm leading-tight">{item.productName}</h4>
                    <span className="font-display font-black text-base text-white shrink-0">
                      {fmt((item.price || 0) * item.quantity)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {item.variant && <span className="font-ui text-[9px] uppercase tracking-wider font-bold text-gray-500">{item.variant}</span>}
                    {item.flavor && <span className="font-ui text-[9px] uppercase tracking-wider font-bold text-gray-500">• {item.flavor}</span>}
                    <span className="font-ui text-[9px] uppercase tracking-wider font-bold text-gray-500">• Qty {item.quantity}</span>
                    {item.quantity > 1 && item.price > 0 && (
                      <span className="font-editorial text-[10px] italic text-gray-600">{fmt(item.price)} each</span>
                    )}
                  </div>
                  {item.messageOnCake && (
                    <p className="mt-1 font-editorial italic text-[11px] text-amber-400/70">✏️ &ldquo;{item.messageOnCake}&rdquo;</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals breakdown */}
          <div className="border-t border-white/10 p-6 space-y-3">
            <div className="flex justify-between">
              <span className="font-ui text-[10px] uppercase tracking-wider font-bold text-gray-400">Subtotal</span>
              <span className="font-display font-bold text-gray-300">{fmt(order.subtotal ?? order.totalAmount)}</span>
            </div>

            {(order.deliveryCharge ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="font-ui text-[10px] uppercase tracking-wider font-bold text-gray-400">Delivery Charge</span>
                <span className="font-display font-bold text-gray-300">{fmt(order.deliveryCharge)}</span>
              </div>
            )}

            {order.deliveryType === 'PICKUP' && (order.deliveryCharge ?? 0) === 0 && (
              <div className="flex justify-between">
                <span className="font-ui text-[10px] uppercase tracking-wider font-bold text-gray-400">Delivery</span>
                <span className="font-display font-bold text-emerald-400">Free (Self Pickup)</span>
              </div>
            )}

            {(order.discount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="font-ui text-[10px] uppercase tracking-wider font-bold text-emerald-400">Discount</span>
                <span className="font-display font-bold text-emerald-400">-{fmt(order.discount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <span className="font-ui text-[11px] uppercase tracking-[0.2em] font-black text-white">Grand Total</span>
              <span className="font-display font-black text-2xl text-amber-400">{fmt(order.totalAmount)}</span>
            </div>
          </div>

          {/* Payment status */}
          <div className="border-t border-white/10 bg-white/[0.02] p-6 space-y-3">
            <p className="font-ui text-[9px] uppercase tracking-[0.2em] font-black text-gray-500 mb-1">Payment Status</p>

            {(order.payments || []).map((p: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center">
                <div>
                  <span className="font-ui text-[10px] uppercase tracking-wider font-bold text-gray-300">
                    {p.type === 'ADVANCE' ? '50% Advance' : p.type === 'FULL' ? 'Full Payment' : 'Amount'} Paid
                  </span>
                  {p.paidAt && (
                    <span className="ml-2 font-editorial italic text-[10px] text-gray-600">
                      {new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                  )}
                </div>
                <span className="font-display font-bold text-emerald-400">{fmt(p.amount)}</span>
              </div>
            ))}

            {(order.balanceDue ?? 0) > 0 ? (
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div>
                  <p className="font-ui text-[10px] uppercase tracking-[0.15em] font-black text-amber-400">Balance Due</p>
                  <p className="font-editorial italic text-[10px] text-gray-500 mt-0.5">
                    Payable {order.deliveryType === 'PICKUP' ? 'at pickup' : 'on delivery'} — cash or UPI
                  </p>
                </div>
                <span className="font-display font-black text-xl text-amber-400">{fmt(order.balanceDue)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <TickCircle className="w-4 h-4 text-emerald-400" variant="Bold" />
                </div>
                <div>
                  <p className="font-ui text-[10px] uppercase tracking-[0.15em] font-black text-emerald-400">Fully Paid</p>
                  <p className="font-editorial italic text-[10px] text-gray-500">No balance due — thank you!</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Support CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <Link
            href="/orders"
            className="px-6 py-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-full font-ui text-[9px] uppercase tracking-[0.2em] font-black text-amber-400 transition-colors flex items-center gap-2"
          >
            <Receipt21 className="w-4 h-4" />
            View All My Orders
          </Link>
          <a
            href="https://wa.me/919712632132"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-ui text-[9px] uppercase tracking-[0.2em] font-black text-gray-300 transition-colors flex items-center gap-2"
          >
            Need Help? Contact Store
          </a>
        </motion.div>

      </div>
    </div>
  );
}
