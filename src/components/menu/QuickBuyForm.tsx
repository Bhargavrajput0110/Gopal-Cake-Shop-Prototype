"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { WEIGHT_OPTIONS, getActiveFlavours, getFlavourSurcharge } from '@/lib/flavours';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { NotificationToast } from '@/components/ui/NotificationToast';
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";
import { GalleryAdd } from "iconsax-react";

export function QuickBuyForm({ product, onClose, isCustom = false, isPhotoCake = false, editingCartItem }: { product: any, onClose?: () => void, isCustom?: boolean, isPhotoCake?: boolean, editingCartItem?: any }) {
  const { addItem, updateItemConfig, setIsCartOpen } = useCart();
  const flavours = getActiveFlavours();

  useEffect(() => {
    // Prevent touchpad scroll bleeding to the background webpage
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
  
  let initialAvailableWeights = [...WEIGHT_OPTIONS];
  let initialDefaultWeight = "500g";
  let wc: any = null;
  
  // Parse weight utility
  const parseWeight = (w: string) => {
    if (!w) return 0;
    const lower = String(w).toLowerCase();
    if (lower.includes('kg')) return parseFloat(lower) || 0;
    if (lower.includes('g')) return (parseFloat(lower) || 0) / 1000;
    const num = parseFloat(lower);
    if (!isNaN(num)) return num;
    return 0;
  };
  
  if (product?.weightConfig) {
    try {
      wc = typeof product.weightConfig === 'string' ? JSON.parse(product.weightConfig) : product.weightConfig;
      if (wc && typeof wc === 'object' && Object.keys(wc).length > 0) {
        const keys = Object.keys(wc).map(Number).sort((a,b) => a-b);
        // For keys like 1.5, we want value to be "1.5kg", for 0.5 we want "500g"
        initialAvailableWeights = keys.map(k => {
            const valStr = k >= 1 ? `${k}kg` : `${k*1000}g`;
            return {
                value: valStr,
                label: k >= 1 ? `${k} kg` : `${k*1000} g`,
                price: wc[k]?.price || 0
            };
        });
        initialDefaultWeight = initialAvailableWeights[0].value;
      }
    } catch(e) {}
  }
    
  // Apply minimum weight filtering for products with minWeight (like Design Cakes)
  const effectiveMinWeight = product?.minWeight || product?.recommendedWeight;
  if (effectiveMinWeight) {
    const minW = parseWeight(effectiveMinWeight);
    if (minW > 0) {
       initialAvailableWeights = initialAvailableWeights.filter((w: any) => parseWeight(w.value) >= minW);
       if (initialAvailableWeights.length > 0) {
           initialDefaultWeight = initialAvailableWeights[0].value;
       }
    }
  }

  const getInitialState = (key: string, fallback: any) => {
    if (editingCartItem && editingCartItem[key] !== undefined) {
      // Map variant to selectedWeight for backward compatibility if needed, but our cart saves variant
      if (key === 'selectedWeight' && editingCartItem.variant) return editingCartItem.variant;
      if (key === 'selectedFlavour' && editingCartItem.flavor) return editingCartItem.flavor;
      return editingCartItem[key];
    }
    if (isCustom && typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('gcs_custom_cake_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed[key] !== undefined) return parsed[key];
        }
      } catch(e) {}
    }
    
    return fallback;
  };

  const [availableWeights, setAvailableWeights] = useState<any[]>(initialAvailableWeights);
  const [selectedWeight, setSelectedWeight] = useState(() => getInitialState('selectedWeight', initialDefaultWeight));
  const [selectedFlavour, setSelectedFlavour] = useState(() => getInitialState('selectedFlavour', ''));
  const [messageOnCake, setMessageOnCake] = useState(() => getInitialState('messageOnCake', ''));
  const [notes, setNotes] = useState(() => getInitialState('notes', ''));
  const [toast, setToast] = useState<{ id: string; title: string; message: string; variant: 'info' | 'success' | 'warning' } | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>(() => getInitialState('referenceImages', []));
  const [printImage, setPrintImage] = useState<string>("");
  const [tierConfig, setTierConfig] = useState<string>("");
  const [overridePrice, setOverridePrice] = useState<string>("");



  useEffect(() => {
    if (isCustom && typeof window !== 'undefined') {
      const stateToSave = {
        selectedWeight,
        selectedFlavour,
        messageOnCake,
        notes,
        referenceImages
      };
      sessionStorage.setItem('gcs_custom_cake_draft', JSON.stringify(stateToSave));
    }
  }, [isCustom, selectedWeight, selectedFlavour, messageOnCake, notes, referenceImages]);

  const handleFlavourChange = (val: string) => {
    setSelectedFlavour(val);
    if (val !== 'original' && val !== 'Classic' && val !== '') {
      setToast({
        id: Date.now().toString(),
        title: 'Premium Flavour Selected',
        message: `${val} is a premium flavour and will cost extra depending on the size of the cake.`,
        variant: 'info'
      });
    }
  };

  // Calculate dynamic price based on weight
  let currentPrice = product?.basePrice || 600;
  
  if (wc && typeof wc === 'object' && Object.keys(wc).length > 0) {
      const selectedOption = availableWeights.find((w: any) => w.value === selectedWeight);
      if (selectedOption && selectedOption.price) {
          currentPrice = selectedOption.price;
      }
  } else {
      const basePrices: Record<string, number> = {
        "250g": 350, "500g": 600, "750g": 850, "1kg": 1100,
        "1.5kg": 1600, "2kg": 2100, "2.5kg": 2600, "3kg": 3100,
        "3.5kg": 3500, "4kg": 4000, "4.5kg": 4400, "5kg": 4900,
        "5.5kg": 5300, "6kg": 5800, "6.5kg": 6300, "7kg": 6800,
        "7.5kg": 7300, "8kg": 7800, "8.5kg": 8300, "9kg": 8300, "9.5kg": 8750, "10kg": 9200,
      };
      if (selectedWeight && basePrices[selectedWeight]) {
          const scale = basePrices[selectedWeight] / basePrices["500g"];
          currentPrice = Math.round(currentPrice * scale);
      }
  }

  // Add flavour surcharge
  const weightVal = parseFloat(selectedWeight || "0");
  const weightKg = (selectedWeight || "").toLowerCase().includes("kg") ? weightVal : ((selectedWeight || "").toLowerCase().includes("g") ? weightVal / 1000 : weightVal);
  const surcharge = selectedFlavour ? getFlavourSurcharge(selectedFlavour, weightKg) : 0;
  
  let finalPrice = currentPrice + surcharge;
  if (isCustom && overridePrice && !isNaN(Number(overridePrice))) {
    finalPrice = Number(overridePrice);
  }

  const handleAddToCart = () => {
    if (!selectedWeight) {
      setToast({
        id: Date.now().toString(),
        title: 'Selection Required',
        message: 'Please select a cake weight.',
        variant: 'warning'
      });
      return;
    }
    if (!selectedFlavour) {
      setToast({
        id: Date.now().toString(),
        title: 'Selection Required',
        message: 'Please select a cake flavour.',
        variant: 'warning'
      });
      return;
    }

    const itemPayload = {
      productId: product.id,
      name: product.name,
      price: (isCustom && product.id === 'custom-cake-studio' && !overridePrice) ? 0 : finalPrice,
      basePrice: product.basePrice || 600,
      quantity: editingCartItem ? editingCartItem.quantity : 1,
      image: product.thumbnail || product.imageUrl || product.image,
      variant: selectedWeight,
      flavor: selectedFlavour,
      messageOnCake: messageOnCake.trim() || undefined,
      notes: notes.trim() || undefined,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      printImage: printImage || undefined,
      designId: product.designId,
      isCustom: isCustom, // Flag to indicate this requires a quote
      availableWeights: availableWeights.map((w: any) => ({ value: w.value, label: w.label, price: w.price })),
    };

    if (editingCartItem) {
      updateItemConfig(editingCartItem.cartItemId, itemPayload);
      setIsCartOpen(true);
    } else {
      addItem(itemPayload);
    }
    
    // Clear draft if it was successfully added/updated
    if (isCustom && typeof window !== 'undefined') {
      sessionStorage.removeItem('gcs_custom_cake_draft');
    }

    if (onClose) onClose();
  };

  return (
    <div 
      className="flex flex-col flex-1 min-h-0 h-full w-full max-h-full overflow-hidden bg-background"
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
    >
      {/* 1. FIXED TOP HEADER CAKE PHOTO (Static at top, never scrolls away) */}
      <div className="relative w-full h-[120px] md:h-[180px] shrink-0 bg-black/95 flex items-center justify-center overflow-hidden">
        {(product.thumbnail || product.imageUrl || product.image) ? (
          <>
            <Image src={product.thumbnail || product.imageUrl || product.image} alt={product.name} fill className="object-cover opacity-25 blur-md scale-110" />
            <Image src={product.thumbnail || product.imageUrl || product.image} alt={product.name} fill className="object-contain p-2 z-10" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-editorial italic">No Image</div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-3 left-4 right-4 z-20">
          <h2 className="text-xl font-display font-bold text-white leading-tight drop-shadow-md">{product.name}</h2>
          {product.category?.name && (
            <p className="text-[var(--brand-champagne)] font-editorial italic text-xs drop-shadow-md">{product.category.name}</p>
          )}
        </div>
      </div>

      {/* 2. ONLY MIDDLE RED SECTION SCROLLS UP AND DOWN */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6"
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
      >
        {/* Weight Selection */}
        <div className="space-y-3">
          <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground">
            Select Weight
          </label>
          <Select value={selectedWeight} onValueChange={setSelectedWeight}>
            <SelectTrigger className="w-full h-14 text-lg bg-background border-2 border-primary/30 rounded-xl px-4 focus:border-primary transition-all">
              <SelectValue placeholder="Choose weight" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" className="z-[200]">
              <SelectGroup>
                {availableWeights.map((w: any) => (
                  <SelectItem key={w.value} value={w.value} className="text-base py-3 cursor-pointer">
                    {w.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Dedicated Photo Cake Upload (Only when item is explicitly a Photo Cake) */}
        {isPhotoCake && (
          <div className="space-y-3">
            <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <GalleryAdd className="w-4 h-4 text-primary" />
              Photo for Edible Print
              <span className="text-primary normal-case text-[10px]">Required (Max 10)</span>
            </label>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <CloudinaryUploader
                maxFiles={10}
                folder="edible_prints"
                existingImages={printImage ? printImage.split(',') : []}
                onUploadSuccess={(urls) => setPrintImage(urls.join(','))}
              />
            </div>
          </div>
        )}

        {/* Flavour Selection */}
        <div className="space-y-3">
          <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground">
            Select Flavour
          </label>
          <Select value={selectedFlavour} onValueChange={handleFlavourChange}>
            <SelectTrigger className="w-full h-14 text-lg bg-background border-2 border-primary/30 rounded-xl px-4 focus:border-primary transition-all">
              <SelectValue placeholder="Select a Flavour" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" className="z-[200]" avoidCollisions={false}>
              <SelectGroup>
                <SelectItem value="Classic" className="text-base py-3 font-semibold text-primary cursor-pointer">
                  Classic
                </SelectItem>
                {flavours.map((f) => {
                  const wVal = parseFloat(selectedWeight);
                  const itemWeightKg = selectedWeight.toLowerCase().includes("kg") ? wVal : (selectedWeight.toLowerCase().includes("g") ? wVal / 1000 : wVal);
                  const surcharge = getFlavourSurcharge(f.name, itemWeightKg);
                  return (
                    <SelectItem key={f.id} value={f.name} className="text-base py-3 cursor-pointer">
                      {f.name} {surcharge > 0 ? `(+₹${surcharge})` : ''}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Extra Fields (Always Visible) */}
        <div className="space-y-6 pt-2 pb-6">
          {/* Message on Cake */}
          <div className="space-y-3">
            <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              🎂 Message on Cake
            </label>
            <input
              type="text"
              value={messageOnCake}
              onChange={(e) => setMessageOnCake(e.target.value)}
              placeholder='e.g. Happy Birthday Rahul 🎉'
              maxLength={60}
              className="w-full rounded-xl border-2 border-primary/20 bg-background px-4 py-3 h-14 text-sm font-ui text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-right text-[11px] text-muted-foreground">{messageOnCake.length}/60</p>
          </div>

          {/* Special Instructions / Notes */}
          <div className="space-y-3">
            <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black">✎</span>
              Special Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mention allergies, delivery timing preferences, etc..."
              rows={3}
              maxLength={300}
              className="w-full resize-none rounded-xl border-2 border-primary/20 bg-background px-4 py-3 text-sm font-ui text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-right text-[11px] text-muted-foreground">{notes.length}/300</p>
          </div>

          {/* Custom Cake Fields */}
          {isCustom && (
            <div className="space-y-6 pt-2 border-t border-border/40">


              {/* Reference Images (Hidden for Design Cakes since they already have a design) */}
              {!(product.categoryId === 'design' || product.designId || product.category?.name === 'Design Cake') && (
                <div className="space-y-3">
                <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <GalleryAdd className="w-4 h-4 text-primary" />
                  Reference Images
                  <span className="text-muted-foreground normal-case text-[10px]">(Optional - Max 3)</span>
                </label>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <CloudinaryUploader
                    maxFiles={3}
                    folder="custom_references"
                    existingImages={referenceImages}
                    onUploadSuccess={(urls) => setReferenceImages(urls)}
                  />
                  {referenceImages.length > 0 && (
                    <p className="text-xs text-emerald-600 font-bold mt-2">{referenceImages.length} image(s) uploaded</p>
                  )}
                </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. FIXED CHECKOUT BUTTON BAR */}
      <div className="shrink-0 h-[84px] bg-background border-t border-border/40 flex items-center justify-center p-3 px-4 z-30 sticky bottom-0 mt-auto">
        <Button 
          onClick={handleAddToCart}
          className="w-full h-13 py-3 rounded-2xl bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-ui font-bold text-sm tracking-widest uppercase shadow-lg shadow-[var(--brand-deep-rose)]/20 hover:-translate-y-1 transition-all"
        >
          {editingCartItem ? "Update Item" : (isCustom && product.id === 'custom-cake-studio' && !overridePrice) ? "Add to Quote Request" : `Add to Cart - ₹${finalPrice}`}
        </Button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[300] w-max max-w-[90vw]">
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
