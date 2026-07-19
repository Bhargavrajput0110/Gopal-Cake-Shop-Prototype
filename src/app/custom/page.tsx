"use client";

import Image from "next/image";
import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { TickCircle, Clock, Gift, Card, Refresh2, GalleryAdd, Gallery, Calendar, InfoCircle, Location } from "iconsax-react";
import dynamic from "next/dynamic";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";
import { WEIGHT_OPTIONS, REGULAR_FLAVOURS, MANGO_FUSION_FLAVOURS, STRAWBERRY_FUSION_FLAVOURS } from "@/lib/flavours";
import { toBranchId } from "@/lib/branches";
import { BackButton } from "@/components/ui/BackButton";

const LeafletAddressPicker = dynamic(
  () => import("@/components/home/LeafletAddressPicker").then((mod) => mod.LeafletAddressPicker),
  { ssr: false, loading: () => <div className="p-4 text-center text-sm text-muted-foreground"><Refresh2 className="w-4 h-4 animate-spin mx-auto mb-2" />Loading map...</div> }
);

// Seasonal flags
const MANGO_FUSION_ACTIVE    = true;
const STRAWBERRY_FUSION_ACTIVE = false;

// Placeholder prices
const MOCK_PRICES: Record<string, number> = {
  "250g": 350, "500g": 600, "750g": 850,
  "1kg": 1100, "1.5kg": 1550, "2kg": 2000, "2.5kg": 2450,
  "3kg": 2900, "3.5kg": 3350, "4kg": 3800, "4.5kg": 4250,
  "5kg": 4700, "5.5kg": 5150, "6kg": 5600, "6.5kg": 6050,
  "7kg": 6500, "7.5kg": 6950, "8kg": 7400, "8.5kg": 7850,
  "9kg": 8300, "9.5kg": 8750, "10kg": 9200,
};

export function CustomDesignForm({ asModal = false, initialImage = "" }: { asModal?: boolean, initialImage?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weightParam = searchParams.get("weight");
  const flavourParam = searchParams.get("flavour");
  const quantityParam = searchParams.get("quantity");
  const imageParam = searchParams.get("image") || initialImage;

  // Step 1 — Weight & Flavour
  const [selectedWeight, setSelectedWeight]   = useState<string | null>(weightParam || "500g");
  const [selectedFlavour, setSelectedFlavour] = useState<string | null>(flavourParam || "White Forest");

  // Step 2 — Images
  const [referenceImages, setReferenceImages] = useState<string[]>(imageParam ? [imageParam] : []);
  const [printImages, setPrintImages] = useState<string[]>([]);
  const [hasReference, setHasReference] = useState(imageParam ? true : false);
  const [isPhotoCake, setIsPhotoCake] = useState(false);

  // Step 3 — Details
  const [nameOnCake, setNameOnCake]           = useState("");
  const [quantity, setQuantity]               = useState(() => {
    if (quantityParam) {
      const parsed = parseInt(quantityParam, 10);
      return isNaN(parsed) ? 1 : parsed;
    }
    return 1;
  });
  const [date, setDate]                       = useState("");
  const [time, setTime]                       = useState("");
  const [notes, setNotes]                     = useState("");

  // Step 4 — Checkout
  const [contact, setContact]                 = useState("");
  const [deliveryType, setDeliveryType]       = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress]                 = useState("");
  const [houseNo, setHouseNo]                 = useState("");
  const [landmark, setLandmark]               = useState("");
  const [branchDistances, setBranchDistances] = useState<{ branch: string; distanceKm: number }[]>([]);
  const [selectedBranch, setSelectedBranch]   = useState("khanderao");
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError]     = useState("");
  const [isSurprise, setIsSurprise]           = useState(false);
  const [recipientName, setRecipientName]     = useState("");
  const [coupon, setCoupon] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing Logic
  const PHOTO_SURCHARGE = 200;
  const basePrice   = selectedWeight ? (MOCK_PRICES[selectedWeight] ?? 0) : 0;
  const baseTotal   = (basePrice + (isPhotoCake ? PHOTO_SURCHARGE : 0)) * quantity;
  let   deliveryFee = 0;
  if (deliveryType === "delivery" && branchDistances.length > 0) {
    const sel = branchDistances.find(b => b.branch === selectedBranch);
    if (sel && sel.distanceKm !== 999) deliveryFee = Math.round(sel.distanceKm * 20);
  }

  const handleApplyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (code === "GOPAL10" || code === "WELCOME50") {
      setAppliedCouponCode(code);
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code.");
      setAppliedCouponCode("");
    }
  };

  let appliedDiscount = 0;
  if (appliedCouponCode === "GOPAL10") {
    appliedDiscount = Math.round(baseTotal * 0.1);
  } else if (appliedCouponCode === "WELCOME50") {
    appliedDiscount = Math.min(50, baseTotal);
  }

  const totalPrice    = Math.max(0, baseTotal + deliveryFee - appliedDiscount);
  const advanceAmount = Math.ceil(totalPrice * 0.5);

  const handleOrderSubmit = async (type: "pay" | "quote" = "pay") => {
    if (!selectedWeight || !selectedFlavour || !date || !contact) {
      alert("Please fill out all required fields marked with *");
      return;
    }
    if (deliveryType === "delivery" && (!address || !houseNo)) {
      alert("Please specify delivery house number and location on the map.");
      return;
    }
    if (isSurprise && !recipientName) {
      alert("Please provide the recipient's name for the surprise.");
      return;
    }
    setIsSubmitting(true);

    const orderData = {
      orderType: deliveryType,
      status: type === "pay" ? "WAITING_FOR_CHEF" : "QUOTE_DRAFT",
      customerName: isSurprise ? recipientName : "Valued Customer",
      customerPhone: contact,
      customerInstructions: notes,
      branch: toBranchId(selectedBranch),
      delivery: deliveryType === "delivery" ? {
        address: `${houseNo ? houseNo + ", " : ""}${address}`,
        landmark: landmark
      } : undefined,
      items: [{
        name: "Custom Design Cake",
        qty: quantity,
        weight: selectedWeight,
        flavour: selectedFlavour,
        cakeText: nameOnCake,
        referenceImages: referenceImages,
        printImages: printImages
      }],
      subtotal: baseTotal,
      grandTotal: totalPrice,
      discount: appliedDiscount,
      tax: 0,
      deliveryCharge: deliveryFee,
      advancePaid: type === "pay" ? advanceAmount : 0,
      pendingBalance: type === "pay" ? totalPrice - advanceAmount : totalPrice,
      priorityLevel: "normal",
      isSurprise: isSurprise,
      timeTarget: new Date(`${date}T${time || '18:00'}:00`).toISOString()
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const orderId = data.order?.id || data.data?.id;
        router.push(`/order/${orderId}`);
      } else {
        alert("Failed to create order: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while placing the order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formValid = selectedWeight && selectedFlavour && date && contact && (deliveryType === 'pickup' || (address && houseNo)) && (!isSurprise || recipientName);

  return (
    <div className={asModal ? "flex flex-col text-foreground pb-10" : "flex flex-col min-h-screen bg-background text-foreground pb-40 pt-24 md:pt-32"}>
      <div className={asModal ? "w-full" : "max-w-[1000px] mx-auto px-4 md:px-8"}>
        {!asModal && <BackButton fallback="/menu" label="Back to Menu" variant="link" className="px-0 mb-6 text-foreground/60 hover:text-primary uppercase tracking-widest text-xs font-bold" />}
        
        {/* Editorial Header */}
        <div className="mb-12 border-b border-border/40 pb-6 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-sans font-bold text-secondary tracking-[0.3em] uppercase block mb-3">Bespoke Creations</span>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground leading-[1.1]">Design Your<br /><span className="italic font-light text-secondary">Masterpiece</span></h1>
          </div>
          {!asModal && (
            <button onClick={() => router.push('/menu')} className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors">
              Return to Catalogue
            </button>
          )}
        </div>

        {/* Form Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column: Form Details */}
          <div className="lg:col-span-7 space-y-14">
            
            {/* Section 1: Cake Configurations */}
            <section className="space-y-8">
              <h2 className="font-serif text-3xl font-bold flex items-center border-b border-border/20 pb-3">
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary mr-4 font-bold mt-1">Step 01</span>
                Cake Options
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Weight *</label>
                  <Select value={selectedWeight || ""} onValueChange={setSelectedWeight}>
                    <SelectTrigger className="w-full h-14 text-lg bg-background border-2 border-border/40 rounded-xl px-4 focus:border-primary shadow-sm hover:bg-muted/10 transition-colors">
                      <SelectValue placeholder="Choose weight..." />
                    </SelectTrigger>
                    <SelectContent side="bottom" position="popper" className="z-[100]">
                      <SelectGroup>
                        {WEIGHT_OPTIONS.map((w) => {
                          const price = MOCK_PRICES[w.value];
                          return (
                            <SelectItem key={w.value} value={w.value} className="text-base py-3">
                              {w.label} {price !== undefined && <span className="text-muted-foreground ml-2 text-xs">(₹{price})</span>}
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Flavour *</label>
                  <Select value={selectedFlavour || ""} onValueChange={setSelectedFlavour}>
                    <SelectTrigger className="w-full h-14 text-lg bg-background border-2 border-border/40 rounded-xl px-4 focus:border-primary shadow-sm hover:bg-muted/10 transition-colors">
                      <SelectValue placeholder="Choose flavour..." />
                    </SelectTrigger>
                    <SelectContent side="bottom" position="popper" className="z-[100]" avoidCollisions={false}>
                      <SelectGroup>
                        <SelectLabel className="text-emerald-700 font-sans font-bold text-xs uppercase tracking-wider py-2 pl-8">Regular Flavours</SelectLabel>
                        {REGULAR_FLAVOURS.map((f) => (
                          <SelectItem key={f.id} value={f.name} className="text-base py-3">
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {MANGO_FUSION_ACTIVE && (
                        <SelectGroup>
                          <SelectLabel className="text-amber-700 font-sans font-bold text-xs uppercase tracking-wider py-2 pl-8">Mango Fusion (Limited)</SelectLabel>
                          {MANGO_FUSION_FLAVOURS.map((f) => (
                            <SelectItem key={f.id} value={f.name} className="text-base py-3">
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {STRAWBERRY_FUSION_ACTIVE && (
                        <SelectGroup>
                          <SelectLabel className="text-rose-700 font-sans font-bold text-xs uppercase tracking-wider py-2 pl-8">Strawberry Fusion</SelectLabel>
                          {STRAWBERRY_FUSION_FLAVOURS.map((f) => (
                            <SelectItem key={f.id} value={f.name} className="text-base py-3">
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Name / Message on Cake</label>
                  <input type="text" placeholder='e.g. "Happy Birthday Kabir!"' value={nameOnCake} onChange={(e) => setNameOnCake(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground placeholder:text-foreground/30 transition-colors" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Quantity</label>
                  <div className="flex items-center justify-between h-[45px] border-b-2 border-border/40">
                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 text-foreground/50 hover:text-primary transition-colors text-xl font-serif">-</button>
                    <div className="flex-1 text-center font-serif text-xl font-bold text-foreground">{quantity}</div>
                    <button type="button" onClick={() => setQuantity(quantity + 1)} className="px-4 text-foreground/50 hover:text-primary transition-colors text-xl font-serif">+</button>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Reference & Images */}
            <section className="space-y-6">
              <h2 className="font-serif text-3xl font-bold flex items-center border-b border-border/20 pb-3">
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary mr-4 font-bold mt-1">Step 02</span>
                Design & Inspiration
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-card p-5 rounded-2xl border border-border/60 shadow-sm cursor-pointer hover:border-primary transition-colors" onClick={() => setHasReference(!hasReference)}>
                  <div>
                    <h4 className="font-bold text-foreground flex items-center gap-3 text-base">
                      <GalleryAdd className="w-5 h-5 text-primary" /> Reference Design
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 ml-8">Upload an image for our chef to replicate.</p>
                  </div>
                  <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${hasReference ? 'bg-primary' : 'bg-muted'}`}>
                    <motion.div layout className="w-6 h-6 bg-white rounded-full shadow-md animate-none" animate={{ x: hasReference ? 20 : 0 }} />
                  </div>
                </div>

                <AnimatePresence>
                  {hasReference && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="pt-2 pb-4">
                        <CloudinaryUploader onUploadSuccess={setReferenceImages} existingImages={referenceImages} label="Upload Reference Images" folder="gopal-cakes/customer-references" maxFiles={3} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between bg-card p-5 rounded-2xl border border-border/60 shadow-sm cursor-pointer hover:border-primary transition-colors" onClick={() => setIsPhotoCake(!isPhotoCake)}>
                  <div>
                    <h4 className="font-bold text-foreground flex items-center gap-3 text-base">
                      <Gallery className="w-5 h-5 text-primary" /> Photo Cake
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 ml-8">Upload photos you want printed on the cake (+₹200).</p>
                  </div>
                  <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${isPhotoCake ? 'bg-primary' : 'bg-muted'}`}>
                    <motion.div layout className="w-6 h-6 bg-white rounded-full shadow-md animate-none" animate={{ x: isPhotoCake ? 20 : 0 }} />
                  </div>
                </div>

                <AnimatePresence>
                  {isPhotoCake && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="pt-2 pb-4">
                        <CloudinaryUploader onUploadSuccess={setPrintImages} existingImages={printImages} label="Upload Printable Photos" folder="gopal-cakes/customer-print-photos" maxFiles={3} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Section 3: Delivery Details & Date */}
            <section className="space-y-8">
              <h2 className="font-serif text-3xl font-bold flex items-center border-b border-border/20 pb-3">
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary mr-4 font-bold mt-1">Step 03</span>
                Fulfillment & Date
              </h2>

              <div className="flex gap-4">
                <button type="button" onClick={() => setDeliveryType("pickup")} className={`flex-1 py-3 px-4 rounded-xl border transition-all font-serif font-bold text-lg ${deliveryType === "pickup" ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border hover:border-primary/30 text-foreground/50 hover:text-foreground bg-background"}`}>Store Pickup</button>
                <button type="button" onClick={() => setDeliveryType("delivery")} className={`flex-1 py-3 px-4 rounded-xl border transition-all font-serif font-bold text-lg ${deliveryType === "delivery" ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border hover:border-primary/30 text-foreground/50 hover:text-foreground bg-background"}`}>Home Delivery</button>
              </div>

              {deliveryType === "delivery" && (
                <div className="space-y-6">
                  <div className="relative z-40">
                    <LeafletAddressPicker onAddressChange={setAddress} onCalculating={setIsCalculatingDistance} onDistancesCalculated={(distances, err) => { setBranchDistances(distances); setDistanceError(err); if (distances.length > 0) setSelectedBranch(toBranchId(distances[0].branch)); }} />
                  </div>
                  <div className="space-y-4 bg-background p-5 rounded-2xl border border-border/50">
                    <input type="text" value={houseNo} onChange={(e) => setHouseNo(e.target.value)} placeholder="House / Flat / Block No. *" className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-base font-serif text-foreground transition-colors placeholder:text-foreground/40" />
                    <input type="text" value={address} readOnly placeholder="Area / Road (automatic from map)" className="w-full bg-transparent border-0 border-b-2 border-border/40 px-0 py-2 text-base font-serif text-foreground/50 cursor-not-allowed" />
                    <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Landmark (Optional)" className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-base font-serif text-foreground transition-colors placeholder:text-foreground/40" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Date Required *</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Preferred Time</label>
                  <div className="relative">
                    <Clock className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 pr-10 text-lg font-serif text-foreground transition-colors" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Special Instructions / Notes</label>
                <textarea placeholder="Describe design details, colours, decorations, or custom messages here..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif italic text-foreground transition-colors placeholder:text-foreground/30 min-h-[90px] resize-none" />
              </div>
            </section>

            {/* Section 4: Contact Information */}
            <section className="space-y-6">
              <h2 className="font-serif text-3xl font-bold flex items-center border-b border-border/20 pb-3">
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary mr-4 font-bold mt-1">Step 04</span>
                Customer Identity
              </h2>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 md:p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Gift className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h4 className="font-serif font-bold text-lg text-foreground">Make it a Surprise</h4>
                      <p className="font-serif italic text-foreground/70 text-xs">Recipient won't be called until delivery.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsSurprise(!isSurprise)} className={`w-12 h-7 rounded-full transition-colors relative ${isSurprise ? "bg-primary" : "bg-muted border border-border"}`}>
                    <motion.div layout className="w-5 h-5 bg-white rounded-full absolute top-1 left-1 shadow-sm animate-none" animate={{ x: isSurprise ? 20 : 0 }} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-primary/10">
                  {isSurprise ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Recipient's Name *</label>
                        <input type="text" placeholder="Who receives the cake?" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-primary focus:ring-0 px-0 py-2 text-base font-serif text-foreground transition-colors placeholder:text-foreground/40" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Your Phone Number *</label>
                        <input type="tel" placeholder="For updates / verification" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-primary focus:ring-0 px-0 py-2 text-base font-serif text-foreground transition-colors placeholder:text-foreground/40" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Your Contact Number *</label>
                      <input type="tel" placeholder="e.g. 9876543210" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-primary focus:ring-0 px-0 py-2 text-base font-serif text-foreground transition-colors placeholder:text-foreground/40" />
                    </div>
                  )}
                </div>
              </div>
            </section>

          </div>

          {/* Right Column: Sticky Cake Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 bg-background border border-border/40 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
              <h3 className="font-serif text-2xl font-bold text-foreground border-b border-border/40 pb-4">Creation Summary</h3>
              
              {/* Dynamic Image Preview */}
              <div className="relative w-full h-[180px] bg-muted rounded-xl overflow-hidden flex items-center justify-center border border-border/60">
                {referenceImages.length > 0 ? (
                  <img src={referenceImages[0]} alt="Custom design preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <GalleryAdd className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground italic font-serif">Reference image preview will appear here</p>
                  </div>
                )}
              </div>

              {/* Selection Spec Details */}
              <div className="space-y-3 py-2 text-sm font-serif text-foreground/80">
                <div className="flex justify-between">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Selected Weight</span>
                  <span className="font-bold text-foreground">{selectedWeight || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Flavour Profile</span>
                  <span className="font-bold text-foreground line-clamp-1">{selectedFlavour || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Fulfillment</span>
                  <span className="font-bold text-secondary capitalize">{deliveryType}</span>
                </div>
                {date && (
                  <div className="flex justify-between">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Target Date</span>
                    <span className="font-bold text-foreground">{date} {time ? `@ ${time}` : ""}</span>
                  </div>
                )}
                {nameOnCake && (
                  <div className="flex justify-between">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Cake Text</span>
                    <span className="font-bold text-foreground italic">"{nameOnCake}"</span>
                  </div>
                )}
              </div>

              {/* Coupon Apply */}
              <div className="border-t border-border/40 pt-4 space-y-2">
                <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 block">Promo Coupon</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="e.g. GOPAL10" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg bg-card text-xs uppercase font-bold focus:ring-1 focus:ring-primary/50 focus:outline-none" />
                  <button type="button" onClick={handleApplyCoupon} className="px-4 py-2 bg-[#3E2723] hover:bg-[#3E2723]/90 text-white rounded-lg text-xs font-bold transition-colors">Apply</button>
                </div>
                {appliedDiscount > 0 && <p className="text-xs font-bold text-emerald-600">✓ Applied: -₹{appliedDiscount}</p>}
                {couponError && <p className="text-xs font-bold text-rose-600">{couponError}</p>}
              </div>

              {/* Financial Calculation breakdown */}
              <div className="border-t border-border/40 pt-4 space-y-3">
                <div className="flex justify-between text-sm font-serif text-foreground/70">
                  <span>Cake Price ({quantity}x)</span>
                  <span>₹{basePrice * quantity}</span>
                </div>
                {isPhotoCake && (
                  <div className="flex justify-between text-sm font-serif text-foreground/70">
                    <span>Photo Printing Surcharge</span>
                    <span>₹{PHOTO_SURCHARGE * quantity}</span>
                  </div>
                )}
                {deliveryType === "delivery" && (
                  <div className="flex justify-between text-sm font-serif text-foreground/70">
                    <span>Delivery Charge</span>
                    <span>{deliveryFee > 0 ? `₹${deliveryFee}` : "Calculating distance..."}</span>
                  </div>
                )}
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-sm font-serif text-emerald-600 font-bold">
                    <span>Discount</span>
                    <span>-₹{appliedDiscount}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-border/40">
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-lg text-foreground">Total Price</span>
                    <span className="text-[10px] text-muted-foreground font-sans">50% Advance is required</span>
                  </div>
                  <span className="font-serif font-bold text-2xl text-secondary">₹{totalPrice}</span>
                </div>
              </div>

              {/* Complete Order Buttons */}
              <div className="space-y-3 pt-2">
                <Button 
                  onClick={() => handleOrderSubmit("pay")} 
                  disabled={!formValid || isSubmitting} 
                  className="w-full h-14 bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-ui font-bold text-xs tracking-widest uppercase shadow-lg shadow-[var(--brand-deep-rose)]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 rounded-2xl"
                >
                  {isSubmitting ? (
                    <Refresh2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Pay Advance & Place Order (₹{advanceAmount})</>
                  )}
                </Button>
                <button 
                  type="button" 
                  onClick={() => handleOrderSubmit("quote")} 
                  disabled={!formValid || isSubmitting} 
                  className="w-full text-center py-2 text-xs font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors disabled:opacity-40"
                >
                  Save as Quote Request
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CustomDesignPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Refresh2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground font-medium">Loading custom cake designer...</p>
      </div>
    }>
      <CustomDesignForm />
    </Suspense>
  );
}
