"use client";

import { useState, useRef } from "react";
import { PlusCircle, Flame, ChefHat, Receipt, AlertTriangle, Upload, X, ImageIcon } from "lucide-react";

export default function ManualOrderPage() {
  const [isPriority, setIsPriority] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("full");
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setUploadedImages(prev => [...prev, ...newImages].slice(0, 5)); // max 5 images
  };

  const removeImage = (idx: number) => {
    setUploadedImages(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-primary" /> Manual / Priority POS
        </h2>
        <p className="text-muted-foreground text-sm">Create walk-in orders or phone orders and push them directly to the kitchen.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Order Form */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-bold text-foreground border-b border-border pb-3">Order Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Customer Name</label>
              <input type="text" placeholder="E.g., Amit Patel" className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Phone Number</label>
              <input type="tel" placeholder="+91" className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Item Selection</h4>
            
            <div className="flex items-center gap-4">
              <select className="flex-1 p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm font-medium">
                <option value="">Select Cake...</option>
                <option value="truffle">Premium Chocolate Truffle</option>
                <option value="blackforest">Black Forest</option>
                <option value="pineapple">Fresh Pineapple</option>
                <option value="custom">Custom Design (Requires Notes)</option>
              </select>
              <select className="w-32 p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm">
                <option value="500g">500g</option>
                <option value="1kg">1 Kg</option>
                <option value="2kg">2 Kg</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Special Instructions / Customizations</label>
              <textarea 
                rows={2} 
                className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                placeholder="E.g., Write 'Happy Anniversary'. Pure Veg. Less sweet."
              ></textarea>
            </div>
          </div>

          {/* PRIORITY IMAGE UPLOAD — shows only when priority is toggled */}
          {isPriority && (
            <div className="space-y-3 pt-4 border-t-2 border-dashed border-destructive/30 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-destructive" />
                <h4 className="text-sm font-black text-destructive uppercase tracking-widest">Reference Images for Chef</h4>
                <span className="text-[10px] text-destructive/60 font-bold">(Max 5 • Stored 30 days)</span>
              </div>
              <p className="text-xs text-muted-foreground">Upload customer WhatsApp photos, design references, or inspiration images so the chef knows exactly what to make.</p>

              {/* Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-destructive/40 rounded-xl p-6 text-center cursor-pointer hover:border-destructive hover:bg-destructive/5 transition-all group"
              >
                <Upload className="w-8 h-8 text-destructive/40 group-hover:text-destructive mx-auto mb-2 transition-colors" />
                <p className="text-sm font-bold text-muted-foreground group-hover:text-destructive transition-colors">Click to upload or drag photos here</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP • Max 5MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Image Previews */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-destructive/30 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.preview} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5 font-bold">
                        {idx + 1}/{uploadedImages.length}
                      </div>
                    </div>
                  ))}
                  {uploadedImages.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-destructive/30 flex items-center justify-center hover:border-destructive hover:bg-destructive/5 transition-all"
                    >
                      <PlusCircle className="w-6 h-6 text-destructive/40" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-3">Fulfillment & Payment</h3>

            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-500 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                No order can enter the system without payment. Advance is strictly non-refundable.
              </div>

              <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${paymentStatus === 'full' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}>
                <div className="flex items-center gap-3">
                  <Receipt className={`w-5 h-5 ${paymentStatus === 'full' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-bold text-sm">Fully Paid (Cash/UPI)</span>
                </div>
                <input type="radio" name="payment" checked={paymentStatus === 'full'} onChange={() => setPaymentStatus('full')} className="w-4 h-4 text-primary" />
              </label>

              <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${paymentStatus === 'advance' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}>
                <div className="flex items-center gap-3">
                  <Receipt className={`w-5 h-5 ${paymentStatus === 'advance' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-bold text-sm">Advance Paid Only</span>
                </div>
                <input type="radio" name="payment" checked={paymentStatus === 'advance'} onChange={() => setPaymentStatus('advance')} className="w-4 h-4 text-primary" />
              </label>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              {/* Priority Toggle */}
              <label className="flex flex-col gap-2 p-4 border-2 border-destructive/30 bg-destructive/5 rounded-xl cursor-pointer hover:bg-destructive/10 transition-colors relative overflow-hidden group">
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-destructive animate-pulse" />
                    <span className="font-black text-destructive tracking-wide uppercase">Priority Order</span>
                  </div>
                  <input type="checkbox" checked={isPriority} onChange={(e) => setIsPriority(e.target.checked)} className="w-5 h-5 text-destructive rounded border-destructive/50" />
                </div>
                <p className="text-xs text-destructive/80 font-bold z-10">Checking this will instantly push this order to the very front of the Chef&apos;s Kitchen Display System.</p>
              </label>

              {isPriority && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-destructive uppercase tracking-wider">Mandatory Priority Reason</label>
                  <select className="w-full p-3 rounded-lg border-2 border-destructive/50 bg-background focus:ring-2 focus:ring-destructive text-sm font-bold text-destructive">
                    <option value="">Select Reason...</option>
                    <option value="vip">VIP Customer</option>
                    <option value="urgent">Urgent Delivery Recovery</option>
                    <option value="walkin">Waiting Walk-in Customer</option>
                    <option value="mgmt">Management Request</option>
                    <option value="other">Other (Add to notes)</option>
                  </select>
                </div>
              )}

              <button type="button" className="w-full mt-4 py-4 bg-primary text-primary-foreground rounded-xl font-black text-lg shadow-md hover:bg-primary/90 flex items-center justify-center gap-2 transition-transform active:scale-95">
                <ChefHat className="w-6 h-6" /> Send to Kitchen
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
