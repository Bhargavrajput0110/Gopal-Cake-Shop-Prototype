"use client";

import { BackButton } from "@/components/ui/BackButton";
import { NotificationToast } from "@/components/ui/NotificationToast";
import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { TickCircle, ArrowRight2, Location, Card, Bag, Refresh2, Calendar, Clock, Shop } from "iconsax-react";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { WEIGHT_OPTIONS, getActiveFlavours } from '@/lib/flavours';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey] = useState(() => uuidv4());
  const [toast, setToast] = useState<{ id: string; title: string; message: string; variant: 'info' | 'success' | 'warning' } | null>(null);
  
  // Fulfillment Type
  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  
  // Target Date & Time (Default to tomorrow)
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [time, setTime] = useState("18:00");

  // Customer Contact Info
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    house: '',
    street: '',
    area: '',
    city: 'Vadodara',
    pin: '',
    landmark: ''
  });

  // Cake messages state (cartItemId -> message)
  const [messages, setMessages] = useState<Record<string, string>>({});

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string>('');

  // Per-item state overrides for size/weight, flavor, and notes
  const [itemVariants, setItemVariants] = useState<Record<string, string>>({});
  const [itemFlavors, setItemFlavors] = useState<Record<string, string>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

  const flavours = getActiveFlavours();

  useEffect(() => {
    fetch('/api/v1/branches')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setBranches(data.data);
          setBranchId(data.data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Price calculation lookup tables & helper
  const basePrices: Record<string, number> = {
    "250g": 350, "500g": 600, "750g": 850, "1kg": 1100,
    "1.5kg": 1600, "2kg": 2100, "2.5kg": 2600, "3kg": 3100,
    "3.5kg": 3500, "4kg": 4000, "4.5kg": 4400, "5kg": 4900,
    "5.5kg": 5300, "6kg": 5800, "6.5kg": 6300, "7kg": 6800,
    "7.5kg": 7300, "8kg": 7800, "8.5kg": 8300, "9kg": 8300, "9.5kg": 8750, "10kg": 9200,
  };

  const getItemPrice = (item: any): number => {
    const selectedWeight = itemVariants[item.cartItemId] || item.variant || "500g";
    const selectedFlavour = itemFlavors[item.cartItemId] || item.flavor || "Classic";

    // Start with original item base price or fallback
    let itemBasePrice = item.price || 600;
    
    // Scale base price by weight
    if (selectedWeight && basePrices[selectedWeight]) {
      const scale = basePrices[selectedWeight] / basePrices["500g"];
      itemBasePrice = Math.round(itemBasePrice * scale);
    }

    // Add flavour premium (e.g. +50 for any custom/fusion flavour other than Classic/original/empty)
    const isSpecialFlavour = selectedFlavour && 
      selectedFlavour.toLowerCase() !== 'classic' && 
      selectedFlavour.toLowerCase() !== 'original' &&
      selectedFlavour.toLowerCase() !== '';
      
    if (isSpecialFlavour) {
      itemBasePrice += 50;
    }

    return itemBasePrice;
  };

  // Dynamically calculate checkout subtotal based on current selections
  const dynamicSubtotal = items.reduce((acc, item) => acc + (getItemPrice(item) * item.quantity), 0);

  const parseWeightToNumber = (weightStr: string): number => {
    if (!weightStr) return 0.5;
    const num = parseFloat(weightStr);
    if (weightStr.toLowerCase().includes('kg')) return num;
    if (weightStr.toLowerCase().includes('g')) return num / 1000;
    return num;
  };

  const handlePlaceOrder = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("Please fill in your Name and Phone Number.");
      return;
    }
    if (formData.phone.replace(/\D/g, '').length < 10) {
      alert("Please enter a valid 10-digit Phone Number.");
      return;
    }
    if (!date || !time) {
      alert("Please select a target Date and Time.");
      return;
    }
    if (deliveryType === "DELIVERY") {
      if (!formData.house.trim() || !formData.street.trim() || !formData.area.trim() || !formData.pin.trim()) {
        alert("Please fill in all required delivery address fields (*).");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const selectedBranchName = branches.find(b => b.id === branchId)?.name || 'Vadodara Branch';
      
      const payload = {
        idempotencyKey,
        customer: { 
          name: formData.name, 
          phone: formData.phone, 
          email: formData.email 
        },
        address: deliveryType === 'PICKUP' ? {
          house: 'Store Pickup',
          street: selectedBranchName,
          area: 'Vadodara',
          city: 'Vadodara',
          pin: '390001',
          landmark: 'Picked up by customer'
        } : {
          house: formData.house,
          street: formData.street,
          area: formData.area,
          city: formData.city,
          pin: formData.pin,
          landmark: formData.landmark
        },
        items: items.map(i => {
          const itemPrice = getItemPrice(i);
          return { 
            productId: i.productId, 
            quantity: i.quantity, 
            weight: parseWeightToNumber(itemVariants[i.cartItemId] || i.variant || ''), 
            flavor: itemFlavors[i.cartItemId] || i.flavor || 'Classic',
            messageOnCake: messages[i.cartItemId] || '',
            notes: itemNotes[i.cartItemId] || i.notes || '',
            price: itemPrice // Override with current calculated price
          };
        }),
        paymentMethod,
        deliveryType,
        branchId: branchId || 'dummy-branch-id', 
        deliveryDate: new Date(`${date}T${time}:00`).toISOString()
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

  return (
    <div className="min-h-screen bg-background pb-32 pt-24 md:pt-32">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        
        <BackButton fallback="/menu" label="Back to Catalogue" variant="link" className="px-0 mb-6 text-foreground/60 hover:text-primary uppercase tracking-widest text-xs font-bold" />

        {/* Editorial Header */}
        <div className="mb-12 border-b border-border/40 pb-6 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-sans font-bold text-secondary tracking-[0.3em] uppercase block mb-3">Secure Checkout</span>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground leading-[1.1]">Complete your<br /><span className="italic font-light text-secondary">Order</span></h1>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Form Details */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Step 1: Fulfillment Type */}
            <section className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="font-sans text-[10px] uppercase tracking-widest text-secondary font-bold px-2.5 py-1 bg-secondary/10 rounded-full">01</span>
                Fulfillment Mode
              </h2>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryType("DELIVERY");
                    setToast({
                      id: Date.now().toString(),
                      title: 'Home Delivery Selected',
                      message: 'A delivery charge will apply depending on your location and distance from the branch.',
                      variant: 'info'
                    });
                  }}
                  className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-serif font-bold text-base flex flex-col items-center justify-center gap-2 ${
                    deliveryType === "DELIVERY" 
                      ? "border-[var(--brand-deep-rose)] bg-[var(--brand-deep-rose)]/5 text-[var(--brand-deep-rose)] shadow-sm" 
                      : "border-primary/30 hover:border-primary/60 text-foreground/50 hover:text-foreground bg-background"
                  }`}
                >
                  <Location className="w-6 h-6" />
                  Home Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("PICKUP")}
                  className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-serif font-bold text-base flex flex-col items-center justify-center gap-2 ${
                    deliveryType === "PICKUP" 
                      ? "border-[var(--brand-deep-rose)] bg-[var(--brand-deep-rose)]/5 text-[var(--brand-deep-rose)] shadow-sm" 
                      : "border-primary/30 hover:border-primary/60 text-foreground/50 hover:text-foreground bg-background"
                  }`}
                >
                  <Shop className="w-6 h-6" />
                  Store Pickup
                </button>
              </div>

              {/* Conditional fulfillment inputs */}
              {deliveryType === "PICKUP" ? (
                <div className="space-y-2 pt-2 animate-fadeIn">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Select Pickup Branch *</label>
                  <select 
                    value={branchId} 
                    onChange={e => setBranchId(e.target.value)} 
                    className="w-full bg-background border-2 border-primary/30 rounded-xl px-4 py-3.5 text-base font-serif text-foreground focus:border-[var(--brand-deep-rose)] focus:ring-0 focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} - {b.city}</option>
                    ))}
                  </select>
                  <p className="text-xs font-serif italic text-muted-foreground mt-1">Pick up your fresh cake directly from our kitchen.</p>
                </div>
              ) : (
                <div className="space-y-5 pt-2 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">House / Flat No. / Building *</label>
                    <input 
                      type="text" 
                      value={formData.house} 
                      onChange={e => setFormData({...formData, house: e.target.value})} 
                      placeholder="e.g. Block A, Flat 402"
                      className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors placeholder:text-foreground/30 focus:outline-none" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Street / Society *</label>
                      <input 
                        type="text" 
                        value={formData.street} 
                        onChange={e => setFormData({...formData, street: e.target.value})} 
                        placeholder="e.g. Gokuldham Society"
                        className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors placeholder:text-foreground/30 focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Area / Sector *</label>
                      <input 
                        type="text" 
                        value={formData.area} 
                        onChange={e => setFormData({...formData, area: e.target.value})} 
                        placeholder="e.g. Alkapuri"
                        className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors placeholder:text-foreground/30 focus:outline-none" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">City</label>
                      <input 
                        type="text" 
                        disabled 
                        value={formData.city} 
                        className="w-full bg-transparent border-0 border-b-2 border-primary/10 px-0 py-2.5 text-base font-serif text-foreground/40 cursor-not-allowed focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">PIN Code *</label>
                      <input 
                        type="text" 
                        value={formData.pin} 
                        onChange={e => setFormData({...formData, pin: e.target.value})} 
                        placeholder="390007"
                        className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors placeholder:text-foreground/30 focus:outline-none" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Landmark (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.landmark} 
                      onChange={e => setFormData({...formData, landmark: e.target.value})} 
                      placeholder="e.g. Near HDFC Bank"
                      className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors placeholder:text-foreground/30 focus:outline-none" 
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Step 2: Date & Time Schedule */}
            <section className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="font-sans text-[10px] uppercase tracking-widest text-secondary font-bold px-2.5 py-1 bg-secondary/10 rounded-full">02</span>
                Order Schedule
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-secondary" />
                    Target Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-background border-2 border-primary/30 rounded-xl px-4 py-3 text-base font-serif text-foreground focus:border-[var(--brand-deep-rose)] focus:ring-0 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-secondary" />
                    Preferred Delivery Time *
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full bg-background border-2 border-primary/30 rounded-xl px-4 py-3 text-base font-serif text-foreground focus:border-[var(--brand-deep-rose)] focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Step 3: Contact details */}
            <section className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="font-sans text-[10px] uppercase tracking-widest text-secondary font-bold px-2.5 py-1 bg-secondary/10 rounded-full">03</span>
                Contact Information
              </h2>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Full Name *</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="Enter your name"
                      className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors focus:outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Phone Number *</label>
                    <input 
                      type="tel" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="10-digit number"
                      className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors focus:outline-none" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="email@example.com"
                    className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors focus:outline-none" 
                  />
                </div>
              </div>
            </section>

            {/* Step 4: Cake messages customization */}
            <section className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="font-sans text-[10px] uppercase tracking-widest text-secondary font-bold px-2.5 py-1 bg-secondary/10 rounded-full">04</span>
                Cake Message & Customization
              </h2>
              
              <div className="space-y-5">
                {items.map((item, idx) => (
                  <div key={item.cartItemId} className="p-4 bg-muted/20 border border-border/50 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted relative shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Bag className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-serif font-bold text-sm line-clamp-1">{item.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {/* Weight selector */}
                          <select
                            value={itemVariants[item.cartItemId] || item.variant || "500g"}
                            onChange={e => setItemVariants({ ...itemVariants, [item.cartItemId]: e.target.value })}
                            className="text-[10px] font-sans font-bold bg-background border border-primary/20 rounded px-2 py-0.5 focus:outline-none focus:border-primary text-muted-foreground uppercase tracking-wider cursor-pointer"
                          >
                            {WEIGHT_OPTIONS.map(w => (
                              <option key={w.value} value={w.value}>{w.label}</option>
                            ))}
                          </select>

                          {/* Flavor selector */}
                          <select
                            value={itemFlavors[item.cartItemId] || item.flavor || "Classic"}
                            onChange={e => setItemFlavors({ ...itemFlavors, [item.cartItemId]: e.target.value })}
                            className="text-[10px] font-sans font-bold bg-background border border-primary/20 rounded px-2 py-0.5 focus:outline-none focus:border-primary text-muted-foreground uppercase tracking-wider cursor-pointer"
                          >
                            <option value="Classic">Classic Flavour</option>
                            {flavours.map(f => (
                              <option key={f.id} value={f.name}>{f.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Message on Cake (Optional)</label>
                        <input
                          type="text"
                          value={messages[item.cartItemId] || ""}
                          onChange={e => setMessages({...messages, [item.cartItemId]: e.target.value})}
                          placeholder="e.g. Happy Birthday Raj! (Keep under 30 letters)"
                          className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2 text-sm font-serif text-foreground transition-colors placeholder:text-foreground/30 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Special Instructions / Notes (Optional)</label>
                        <textarea
                          rows={2}
                          value={itemNotes[item.cartItemId] || item.notes || ""}
                          onChange={e => setItemNotes({...itemNotes, [item.cartItemId]: e.target.value})}
                          placeholder="e.g. Less sweet, eggless, deliver after 5pm..."
                          className="w-full resize-none bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2 text-sm font-serif text-foreground transition-colors placeholder:text-foreground/30 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Step 5: Payment method selection */}
            <section className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="font-sans text-[10px] uppercase tracking-widest text-secondary font-bold px-2.5 py-1 bg-secondary/10 rounded-full">05</span>
                Payment Options
              </h2>
              
              <div className="space-y-4">
                {[
                  { id: 'CASH', label: 'Cash on Delivery', desc: 'Pay when your cake is delivered or picked up' },
                  { id: 'UPI', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm (Pay at pickup/delivery)' },
                  { id: 'CARD', label: 'Credit / Debit Card', desc: 'Secure online checkout powered by Razorpay' }
                ].map(method => (
                  <label 
                    key={method.id} 
                    className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all border-2 ${
                      paymentMethod === method.id 
                        ? 'bg-[var(--brand-deep-rose)]/5 border-[var(--brand-deep-rose)] shadow-sm' 
                        : 'border-border/60 hover:border-[var(--brand-deep-rose)]/30 bg-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${paymentMethod === method.id ? 'border-[var(--brand-deep-rose)]' : 'border-foreground/30'}`}>
                      {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-deep-rose)]" />}
                    </div>
                    <div>
                      <div className="font-serif font-bold text-base text-foreground leading-tight">{method.label}</div>
                      <div className="text-xs font-serif italic text-foreground/50 mt-1">{method.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column: Order Summary & Placement */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
              <h3 className="font-serif text-2xl font-bold text-foreground">Order Summary</h3>
              
              {/* Product list */}
              <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar border-b border-border/40 pb-5">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-muted rounded-xl overflow-hidden flex-shrink-0 relative border border-border/30">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Bag className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-bold text-sm text-foreground line-clamp-1 leading-snug">{item.name}</h4>
                      <p className="text-[10px] font-sans text-muted-foreground uppercase font-bold tracking-wider mt-1">{item.variant || 'Standard'} • Qty: {item.quantity}</p>
                    </div>
                    <div className="font-serif font-bold text-sm text-foreground shrink-0">
                      ₹{getItemPrice(item) * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
 
              {/* Price summary */}
              <div className="space-y-3 text-base">
                <div className="flex justify-between font-serif text-foreground/70">
                  <span>Subtotal</span>
                  <span>₹{dynamicSubtotal}</span>
                </div>
                <div className="flex justify-between font-serif text-foreground/70">
                  <span>Fulfillment</span>
                  <span className="font-medium text-foreground">
                    {deliveryType === "PICKUP" ? "Store Pickup (Free)" : "Home Delivery"}
                  </span>
                </div>
                {deliveryType === "DELIVERY" && (
                  <p className="text-[11px] font-serif italic text-muted-foreground text-right mt-[-4px]">Delivery charges calculated based on location</p>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-border/40">
                  <span className="font-serif font-bold text-xl text-foreground">Grand Total</span>
                  <span className="font-serif font-bold text-2xl text-[var(--brand-deep-rose)]">₹{dynamicSubtotal}</span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button 
                onClick={handlePlaceOrder} 
                disabled={isSubmitting} 
                className="w-full bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/95 text-white text-xs font-bold uppercase tracking-widest py-4.5 rounded-2xl shadow-lg shadow-[var(--brand-deep-rose)]/25 flex items-center justify-center gap-2.5 transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <><Refresh2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <>Place Order <TickCircle className="w-5 h-5" /></>
                )}
              </button>
              
              <div className="pt-2 text-center">
                <p className="text-[10px] font-sans font-semibold tracking-wider text-muted-foreground uppercase flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  100% Safe and Secure Checkout
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[500] w-max max-w-[90vw]">
          <NotificationToast
            id={toast.id}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            duration={4000}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
