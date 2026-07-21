"use client";

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { WEIGHT_OPTIONS, getActiveFlavours } from '@/lib/flavours';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { NotificationToast } from '@/components/ui/NotificationToast';
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";
import { GalleryAdd } from "iconsax-react";

export function QuickBuyForm({ product, onClose, isCustom = false, isPhotoCake = false }: { product: any, onClose?: () => void, isCustom?: boolean, isPhotoCake?: boolean }) {
  const { addItem } = useCart();
  const flavours = getActiveFlavours();
  
  const [selectedWeight, setSelectedWeight] = useState("500g");
  const [selectedFlavour, setSelectedFlavour] = useState("");
  const [messageOnCake, setMessageOnCake] = useState("");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<{ id: string; title: string; message: string; variant: 'info' | 'success' | 'warning' } | null>(null);
  const [showOptions, setShowOptions] = useState(isCustom || isPhotoCake);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [printImage, setPrintImage] = useState<string>("");
  const [includeEdiblePrint, setIncludeEdiblePrint] = useState(false);

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

  // Calculate dynamic price based on weight (mocking the basePrices logic)
  const basePrices: Record<string, number> = {
    "250g": 350, "500g": 600, "750g": 850, "1kg": 1100,
    "1.5kg": 1600, "2kg": 2100, "2.5kg": 2600, "3kg": 3100,
    "3.5kg": 3500, "4kg": 4000, "4.5kg": 4400, "5kg": 4900,
    "5.5kg": 5300, "6kg": 5800, "6.5kg": 6300, "7kg": 6800,
    "7.5kg": 7300, "8kg": 7800, "8.5kg": 8300, "9kg": 8300, "9.5kg": 8750, "10kg": 9200,
  };
  
  // Use product base price if available and if we are at base weight, otherwise use our lookup table
  // Assuming base weight is 500g
  let currentPrice = product.basePrice || 600;
  if (selectedWeight && basePrices[selectedWeight]) {
      // Scale price appropriately, assuming basePrice is for 500g
      const scale = basePrices[selectedWeight] / basePrices["500g"];
      currentPrice = Math.round(currentPrice * scale);
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: currentPrice,
      quantity: 1,
      image: product.thumbnail,
      variant: selectedWeight,
      flavor: selectedFlavour || "Classic",
      messageOnCake: messageOnCake.trim() || undefined,
      notes: notes.trim() || undefined,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      printImage: printImage || undefined,
      isPhotoCake: isPhotoCake || includeEdiblePrint,
    });
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Image */}
      <div className="relative w-full h-[250px] bg-muted shrink-0">
        {product.thumbnail ? (
          <Image src={product.thumbnail} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-editorial italic">No Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl font-display font-bold text-white leading-tight">{product.name}</h2>
          {product.category?.name && (
            <p className="text-white/80 font-editorial italic text-sm">{product.category.name}</p>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        
        {/* Weight Selection */}
        <div className="space-y-3">
          <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground">
            Select Weight
          </label>
          <Select value={selectedWeight} onValueChange={setSelectedWeight}>
            <SelectTrigger className="w-full h-14 text-lg bg-background border-2 border-primary/30 rounded-xl px-4 focus:border-primary">
              <SelectValue placeholder="Choose weight" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" className="z-[200]">
              <SelectGroup>
                {WEIGHT_OPTIONS.map((w) => (
                  <SelectItem key={w.value} value={w.value} className="text-base py-3">
                    {w.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Options Toggle */}
        {!(isCustom || isPhotoCake) && (
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="w-full flex items-center justify-between bg-primary/5 hover:bg-primary/10 border border-primary/20 p-4 rounded-xl transition-colors text-primary font-ui text-sm font-bold tracking-wide"
          >
            <span>{showOptions ? "− Hide Options" : "+ Add Options (Flavour, Message, Notes)"}</span>
          </button>
        )}

        {showOptions && (
          <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-300 pt-2">
            
            {/* Custom/Photo Image Upload */}
            {(isCustom || isPhotoCake) && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <GalleryAdd className="w-4 h-4" />
                    {isPhotoCake ? "Photo for Edible Print" : "Reference Image"} 
                    <span className="text-primary normal-case text-[10px]">Required</span>
                  </label>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <CloudinaryUploader
                      maxFiles={1}
                      folder="custom_cakes"
                      onUploadSuccess={(urls) => {
                        if (isPhotoCake) setPrintImage(urls[0]);
                        else setReferenceImages(urls);
                      }}
                    />
                  </div>
                </div>

                {/* Optional Edible Print for Custom Cakes */}
                {isCustom && !isPhotoCake && (
                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={() => setIncludeEdiblePrint(!includeEdiblePrint)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        includeEdiblePrint 
                          ? 'border-[var(--brand-deep-rose)] bg-[var(--brand-deep-rose)]/5' 
                          : 'border-border/60 hover:border-primary/30'
                      }`}
                    >
                      <span className="font-ui text-sm font-bold">Include Edible Photo Print?</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${includeEdiblePrint ? 'border-[var(--brand-deep-rose)]' : 'border-foreground/30'}`}>
                        {includeEdiblePrint && <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-deep-rose)]" />}
                      </div>
                    </button>

                    {includeEdiblePrint && (
                      <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                        <label className="font-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <GalleryAdd className="w-3 h-3" />
                          Photo to Print
                        </label>
                        <div className="bg-background border border-primary/20 rounded-xl p-3">
                          <CloudinaryUploader
                            maxFiles={1}
                            folder="edible_prints"
                            onUploadSuccess={(urls) => setPrintImage(urls[0])}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Flavour Selection */}
            <div className="space-y-3">
              <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground">
                Select Flavour <span className="text-muted-foreground font-normal normal-case">(Optional)</span>
              </label>
              <Select value={selectedFlavour} onValueChange={handleFlavourChange}>
                <SelectTrigger className="w-full h-14 text-lg bg-background border-2 border-primary/30 rounded-xl px-4 focus:border-primary">
                  <SelectValue placeholder="Original Flavour" />
                </SelectTrigger>
                <SelectContent side="bottom" position="popper" className="z-[200]" avoidCollisions={false}>
                  <SelectGroup>
                    <SelectItem value="original" className="text-base py-3 font-semibold text-primary">
                      Original Flavour (Recommended)
                    </SelectItem>
                    {flavours.map((f) => (
                      <SelectItem key={f.id} value={f.name} className="text-base py-3">
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Message on Cake */}
            <div className="space-y-3">
              <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                🎂 Message on Cake
                <span className="text-muted-foreground font-normal normal-case">(Optional)</span>
              </label>
              <input
                type="text"
                value={messageOnCake}
                onChange={(e) => setMessageOnCake(e.target.value)}
                placeholder='e.g. Happy Birthday Rahul 🎉'
                maxLength={60}
                className="w-full rounded-xl border-2 border-primary/30 bg-background px-4 py-3 h-14 text-sm font-ui text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-right text-[11px] text-muted-foreground">{messageOnCake.length}/60</p>
            </div>

            {/* Special Instructions / Notes */}
            <div className="space-y-3">
              <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black">✎</span>
                Special Instructions
                <span className="text-muted-foreground font-normal normal-case">(Optional)</span>
              </label>
              <p className="text-xs text-muted-foreground leading-relaxed bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
                Mention <strong>allergies</strong>, delivery timing preferences, box type, or any other special requests for this order.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. No nuts please, deliver before 6 PM…"
                rows={3}
                maxLength={300}
                className="w-full resize-none rounded-xl border-2 border-primary/30 bg-background px-4 py-3 text-sm font-ui text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-right text-[11px] text-muted-foreground">{notes.length}/300</p>
            </div>
          </div>
        )}

      </div>

      {/* Footer Checkout */}
      <div className="p-4 bg-background border-t border-border/40 shrink-0">
        <Button 
          onClick={handleAddToCart}
          className="w-full h-14 rounded-2xl bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-ui font-bold text-sm tracking-widest uppercase shadow-lg shadow-[var(--brand-deep-rose)]/20 hover:-translate-y-1 transition-all"
        >
          Add to Cart - ₹{currentPrice}
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
