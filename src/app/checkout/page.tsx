"use client";

import { BackButton } from "@/components/ui/BackButton";
import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { TickCircle, ArrowRight2, Location, Card, Bag, Refresh2 } from "iconsax-react";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type CheckoutStage = 'ADDRESS' | 'PAYMENT' | 'REVIEW';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  
  const [stage, setStage] = useState<CheckoutStage>('ADDRESS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey] = useState(() => uuidv4());
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '',
    house: '', street: '', area: '', city: 'Vadodara', pin: '', landmark: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [branchId, setBranchId] = useState<string>('');

  useEffect(() => {
    fetch('/api/v1/branches').then(r => r.json()).then(data => {
      if (data.success && data.data && data.data.length > 0) {
        setBranchId(data.data[0].id);
      }
    }).catch(console.error);
  }, []);

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Bag className="w-12 h-12 text-secondary opacity-30 mb-6" />
        <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Your Cart is Empty</h1>
        <p className="font-serif italic text-foreground/50 mb-8">Let's find something delicious for you.</p>
        <Link href="/menu" className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105">
          Explore Catalogue
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        idempotencyKey: idempotencyKey,
        customer: { name: formData.name, phone: formData.phone, email: formData.email },
        address: { house: formData.house, street: formData.street, area: formData.area, city: formData.city, pin: formData.pin, landmark: formData.landmark },
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, variant: i.variant, messageOnCake: i.messageOnCake })),
        paymentMethod,
        branchId: branchId || 'dummy-branch-id', 
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
      };

      const res = await fetch('/api/v1/public/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      clearCart();
      router.push(`/track/${data.trackingId}`);
    } catch (err: any) {
      alert(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 pt-24 md:pt-32">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8">
        
        <BackButton fallback="/menu" label="Back" variant="link" className="px-0 mb-6 text-foreground/60 hover:text-primary uppercase tracking-widest text-xs font-bold" />

        {/* Editorial Header */}
        <div className="mb-12 md:mb-16 border-b border-border/40 pb-6 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-sans font-bold text-secondary tracking-[0.3em] uppercase block mb-3">Secure Checkout</span>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground leading-[1.1]">Complete your<br /><span className="italic font-light text-secondary">Order</span></h1>
          </div>
          <button onClick={() => router.push('/menu')} className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors">
            Return to Catalogue
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Main Checkout Flow */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Stage: Address */}
            <section className={`transition-all duration-500 ${stage !== 'ADDRESS' ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}`}>
              <h2 className="font-serif text-3xl font-bold mb-8 flex items-center">
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary mr-4 font-bold mt-1">Step 01</span>
                Delivery Details
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Full Name *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Phone Number *</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">House / Flat No. *</label>
                  <input type="text" value={formData.house} onChange={e => setFormData({...formData, house: e.target.value})} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Street / Society *</label>
                    <input type="text" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Area / Sector *</label>
                    <input type="text" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">City</label>
                    <input type="text" disabled value={formData.city} className="w-full bg-transparent border-0 border-b-2 border-border/20 px-0 py-2 text-lg font-serif text-foreground/50 cursor-not-allowed" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">PIN Code *</label>
                    <input type="text" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors" />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      if (formData.name && formData.phone && formData.house && formData.area && formData.pin) setStage('PAYMENT');
                      else alert('Please fill required fields');
                    }}
                    className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest py-4 px-10 rounded-full shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105"
                  >
                    Continue to Payment <ArrowRight2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* Stage: Payment */}
            <AnimatePresence>
              {stage === 'PAYMENT' && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t border-border/40">
                  <h2 className="font-serif text-3xl font-bold mb-8 flex items-center">
                    <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary mr-4 font-bold mt-1">Step 02</span>
                    Payment Method
                  </h2>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'CASH', label: 'Cash on Delivery', desc: 'Pay when you receive the order' },
                      { id: 'UPI', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
                      { id: 'CARD', label: 'Credit/Debit Card', desc: 'Powered by Razorpay' }
                    ].map(method => (
                      <label key={method.id} className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all border ${paymentMethod === method.id ? 'bg-primary/5 border-primary shadow-sm' : 'border-border/40 hover:border-primary/30 bg-transparent'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${paymentMethod === method.id ? 'border-primary' : 'border-foreground/30'}`}>
                          {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <div className="font-serif font-bold text-lg text-foreground">{method.label}</div>
                          <div className="text-sm font-serif italic text-foreground/60">{method.desc}</div>
                        </div>
                      </label>
                    ))}
                    
                    <div className="flex flex-col-reverse md:flex-row gap-4 pt-6">
                      <button onClick={() => setStage('ADDRESS')} className="py-4 px-8 rounded-full border border-border/40 font-bold text-[10px] uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors">
                        Back to Address
                      </button>
                      <button onClick={() => setStage('REVIEW')} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest py-4 px-10 rounded-full shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105">
                        Review Order <ArrowRight2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Stage: Review */}
            <AnimatePresence>
              {stage === 'REVIEW' && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t border-border/40">
                  <h2 className="font-serif text-3xl font-bold mb-8 flex items-center">
                    <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary mr-4 font-bold mt-1">Step 03</span>
                    Final Review
                  </h2>
                  
                  <div className="space-y-6 mb-10">
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
                      <div className="flex justify-between items-end border-b border-primary/10 pb-4">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Deliver To</span>
                        <span className="font-serif font-bold text-lg text-foreground">{formData.name}</span>
                      </div>
                      <p className="font-serif text-foreground/80 leading-relaxed">
                        {formData.house}, {formData.street}<br/>
                        {formData.area}, {formData.city} - {formData.pin}
                      </p>
                    </div>
                    
                    <div className="p-6 bg-secondary/5 border border-secondary/20 rounded-2xl flex justify-between items-center">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Payment Method</span>
                      <span className="font-serif font-bold text-lg text-secondary">{paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse md:flex-row gap-4">
                    <button onClick={() => setStage('PAYMENT')} disabled={isSubmitting} className="py-4 px-8 rounded-full border border-border/40 font-bold text-[10px] uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50">
                      Back
                    </button>
                    <button onClick={handlePlaceOrder} disabled={isSubmitting} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest py-4 px-10 rounded-full shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100">
                      {isSubmitting ? <><Refresh2 className="w-4 h-4 animate-spin" /> Processing...</> : <>Place Order <TickCircle className="w-4 h-4" /></>}
                    </button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

          </div>

          {/* Right Sidebar: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 bg-background border border-border/40 rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-foreground mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 relative">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Bag className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif font-bold text-sm text-foreground line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] font-sans font-bold uppercase text-foreground/50 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-serif font-bold text-sm">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/40 pt-6 space-y-3">
                <div className="flex justify-between text-sm font-serif text-foreground/70">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm font-serif text-foreground/70">
                  <span>Delivery</span>
                  <span>Calculated next step</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border/40">
                  <span className="font-serif font-bold text-xl text-foreground">Total</span>
                  <span className="font-serif font-bold text-2xl text-secondary">₹{subtotal}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
