"use client";

import Image from "next/image";
import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { TickCircle, Clock, Gift, Card, Refresh2, Star, Sun1, Reserve, GalleryAdd, Gallery, ArrowRight2, ArrowLeft2 } from "iconsax-react";
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

export function CustomDesignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weightParam = searchParams.get("weight");
  const flavourParam = searchParams.get("flavour");
  const quantityParam = searchParams.get("quantity");
  const imageParam = searchParams.get("image");

  // Multi-step Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1 — Weight & Flavour
  const [selectedWeight, setSelectedWeight]   = useState<string | null>(weightParam || null);
  const [selectedFlavour, setSelectedFlavour] = useState<string | null>(flavourParam || null);
  const [flavourSearch, setFlavourSearch]     = useState("");

  // Step 2 — Images
  const [referenceImages, setReferenceImages] = useState<string[]>(imageParam ? [imageParam] : []);
  const [printImages, setPrintImages] = useState<string[]>([]);
  const [hasReference, setHasReference] = useState(true);
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
    if (!selectedWeight || !selectedFlavour || !date || !contact) return;
    if (deliveryType === "delivery" && (!address || !houseNo)) return;
    if (isSurprise && !recipientName) return;
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

  // Filtered flavours
  const filteredRegular     = useMemo(() => REGULAR_FLAVOURS.filter(f     => f.name.toLowerCase().includes(flavourSearch.toLowerCase())), [flavourSearch]);
  const filteredMango       = useMemo(() => MANGO_FUSION_ACTIVE    ? MANGO_FUSION_FLAVOURS.filter(f    => f.name.toLowerCase().includes(flavourSearch.toLowerCase())) : [], [flavourSearch]);
  const filteredStrawberry  = useMemo(() => STRAWBERRY_FUSION_ACTIVE ? STRAWBERRY_FUSION_FLAVOURS.filter(f => f.name.toLowerCase().includes(flavourSearch.toLowerCase())) : [], [flavourSearch]);

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(c => c + 1);
  };
  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  // Validation per step
  const canProceedStep1 = selectedWeight && selectedFlavour;
  const canProceedStep2 = true; // Optional images
  const canProceedStep3 = date; // Name and time are optional, date is required
  const canProceedStep4 = contact && (deliveryType === 'pickup' || (address && houseNo)) && (!isSurprise || recipientName);

  const getStepValidation = (step: number) => {
    switch (step) {
      case 1: return canProceedStep1;
      case 2: return canProceedStep2;
      case 3: return canProceedStep3;
      case 4: return canProceedStep4;
      default: return false;
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-40 pt-24 md:pt-32">
      <div className="container max-w-3xl mx-auto px-4">
        <BackButton fallback="/menu" label="Back to Menu" variant="link" className="px-0 mb-6 text-foreground/60 hover:text-primary uppercase tracking-widest text-xs font-bold" />
        
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[10px] font-sans font-bold text-secondary tracking-[0.3em] uppercase block mb-3">Bespoke Creations</span>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground leading-[1.1]">Design Your <span className="italic font-light text-secondary">Masterpiece</span></h1>
        </div>

        {/* Wizard Progress Bar */}
        <div className="flex items-center justify-between mb-12 relative max-w-xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border/50 rounded-full z-0"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500 ease-out" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}></div>
          
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep >= s ? 'bg-primary text-white shadow-lg ring-4 ring-background' : 'bg-card border-2 border-border/50 text-muted-foreground'}`}>
              {s}
            </div>
          ))}
        </div>

        {/* Wizard Content */}
        <div className="bg-card border border-border/40 shadow-xl shadow-black/5 rounded-[2rem] p-6 md:p-10 min-h-[500px]">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-serif text-3xl font-bold mb-4">Select Weight</h3>
                    <Select value={selectedWeight || ""} onValueChange={setSelectedWeight}>
                      <SelectTrigger className="w-full h-16 text-xl bg-background border-2 border-border/40 rounded-2xl px-6 focus:border-primary shadow-sm transition-all hover:bg-muted/30">
                        <SelectValue placeholder="Choose weight..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectGroup>
                          <SelectLabel>Available Weights</SelectLabel>
                          {WEIGHT_OPTIONS.map((w) => {
                            const price = MOCK_PRICES[w.value];
                            return (
                              <SelectItem key={w.value} value={w.value} className="text-lg py-3 cursor-pointer">
                                {w.label} {price !== undefined && <span className="text-muted-foreground ml-2 text-sm">(₹{price})</span>}
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h3 className="font-serif text-3xl font-bold mb-4">Select Flavour</h3>
                    <Select value={selectedFlavour || ""} onValueChange={setSelectedFlavour}>
                      <SelectTrigger className="w-full h-16 text-xl bg-background border-2 border-border/40 rounded-2xl px-6 focus:border-primary shadow-sm transition-all hover:bg-muted/30">
                        <SelectValue placeholder="Choose flavour..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[350px]">
                        <SelectGroup>
                          <SelectLabel className="text-emerald-700">Regular Flavours</SelectLabel>
                          {REGULAR_FLAVOURS.map((f) => (
                            <SelectItem key={f.id} value={f.name} className="text-lg py-3 cursor-pointer">
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        {MANGO_FUSION_ACTIVE && (
                          <SelectGroup>
                            <SelectLabel className="text-amber-700">Mango Fusion (Limited)</SelectLabel>
                            {MANGO_FUSION_FLAVOURS.map((f) => (
                              <SelectItem key={f.id} value={f.name} className="text-lg py-3 cursor-pointer">
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                        {STRAWBERRY_FUSION_ACTIVE && (
                          <SelectGroup>
                            <SelectLabel className="text-rose-700">Strawberry Fusion</SelectLabel>
                            {STRAWBERRY_FUSION_FLAVOURS.map((f) => (
                              <SelectItem key={f.id} value={f.name} className="text-lg py-3 cursor-pointer">
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-8">
                <div className="mb-8">
                  <h3 className="font-serif text-3xl font-bold mb-2">Design & Inspiration</h3>
                  <p className="text-muted-foreground text-base">Upload photos so our chefs can perfectly craft your vision.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-background p-5 rounded-2xl border border-border/60 shadow-sm cursor-pointer hover:border-primary transition-colors" onClick={() => setHasReference(!hasReference)}>
                    <div>
                      <h4 className="font-bold text-foreground flex items-center gap-3 text-lg">
                        <GalleryAdd className="w-6 h-6 text-primary" /> Design Reference
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 ml-9">Upload an image for our chef to replicate.</p>
                    </div>
                    <div className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${hasReference ? 'bg-primary' : 'bg-muted'}`}>
                      <motion.div layout className="w-6 h-6 bg-white rounded-full shadow-md" animate={{ x: hasReference ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
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
                  <div className="flex items-center justify-between bg-background p-5 rounded-2xl border border-border/60 shadow-sm cursor-pointer hover:border-primary transition-colors" onClick={() => setIsPhotoCake(!isPhotoCake)}>
                    <div>
                      <h4 className="font-bold text-foreground flex items-center gap-3 text-lg">
                        <Gallery className="w-6 h-6 text-primary" /> Photo Cake
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 ml-9">Upload private photos you want printed on the cake. (+₹200)</p>
                    </div>
                    <div className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${isPhotoCake ? 'bg-primary' : 'bg-muted'}`}>
                      <motion.div layout className="w-6 h-6 bg-white rounded-full shadow-md" animate={{ x: isPhotoCake ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
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
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-10">
                <h3 className="font-serif text-3xl font-bold mb-8">The Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                  <div className="space-y-3">
                    <label className="text-[11px] font-sans font-bold uppercase tracking-widest text-foreground/50">Name / Message on Cake</label>
                    <input type="text" placeholder='e.g. "Happy Birthday Priya!"' value={nameOnCake} onChange={(e) => setNameOnCake(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-xl font-serif text-foreground placeholder:text-foreground/30 transition-colors" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-sans font-bold uppercase tracking-widest text-foreground/50">Quantity</label>
                    <div className="flex items-center justify-between h-[45px] border-b-2 border-border/40">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 text-foreground/50 hover:text-primary transition-colors text-2xl font-serif">-</button>
                      <div className="flex-1 text-center font-serif text-2xl font-bold text-foreground">{quantity}</div>
                      <button onClick={() => setQuantity(quantity + 1)} className="px-4 text-foreground/50 hover:text-primary transition-colors text-2xl font-serif">+</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-sans font-bold uppercase tracking-widest text-foreground/50">Date Required *</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-xl font-serif text-foreground transition-colors" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-sans font-bold uppercase tracking-widest text-foreground/50">Preferred Time</label>
                    <div className="relative">
                      <Clock className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 pr-10 text-xl font-serif text-foreground transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <label className="text-[11px] font-sans font-bold uppercase tracking-widest text-foreground/50">Special Instructions / Notes</label>
                  <textarea placeholder="Describe anything specific about your design — colours, decorations, tier style, etc." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-3 text-xl font-serif italic text-foreground transition-colors placeholder:text-foreground/30 min-h-[120px] resize-none" />
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-10">
                <h3 className="font-serif text-3xl font-bold mb-8">Delivery & Checkout</h3>
                
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setDeliveryType("pickup")} className={`flex-1 py-4 px-4 rounded-2xl border-2 transition-all font-serif font-bold text-xl ${deliveryType === "pickup" ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border hover:border-primary/30 text-foreground/50 hover:text-foreground bg-background"}`}>Store Pickup</button>
                    <button type="button" onClick={() => setDeliveryType("delivery")} className={`flex-1 py-4 px-4 rounded-2xl border-2 transition-all font-serif font-bold text-xl ${deliveryType === "delivery" ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border hover:border-primary/30 text-foreground/50 hover:text-foreground bg-background"}`}>Home Delivery</button>
                  </div>
                  
                  <div className="relative z-50">
                    <LeafletAddressPicker onAddressChange={setAddress} onCalculating={setIsCalculatingDistance} onDistancesCalculated={(distances, err) => { setBranchDistances(distances); setDistanceError(err); if (distances.length > 0) setSelectedBranch(toBranchId(distances[0].branch)); }} />
                  </div>

                  <AnimatePresence>
                    {deliveryType === "delivery" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden bg-background p-6 rounded-2xl border border-border/50">
                        <input type="text" value={houseNo} onChange={(e) => setHouseNo(e.target.value)} placeholder="House / Flat / Block No. *" className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/40" />
                        <input type="text" value={address} readOnly placeholder="Area / Road (from map)" className="w-full bg-transparent border-0 border-b-2 border-border/40 px-0 py-2 text-lg font-serif text-foreground/50 cursor-not-allowed" />
                        <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Landmark (Optional)" className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/40" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Surprise Toggle */}
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Gift className="w-6 h-6 text-primary" /></div>
                        <div>
                          <h4 className="font-serif font-bold text-xl text-foreground">Make it a Surprise</h4>
                          <p className="font-serif italic text-foreground/70 mt-1 text-sm">We won't call the recipient until arrival.</p>
                        </div>
                      </div>
                      <button onClick={() => setIsSurprise(!isSurprise)} className={`w-14 h-8 rounded-full transition-colors relative ${isSurprise ? "bg-primary" : "bg-muted border border-border"}`}>
                        <motion.div layout className="w-6 h-6 bg-white rounded-full absolute top-1 left-1 shadow-sm" animate={{ x: isSurprise ? 24 : 0 }} />
                      </button>
                    </div>
                    <AnimatePresence>
                      {isSurprise ? (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-primary/10">
                          <input type="text" placeholder="Recipient's Name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/40" />
                          <input type="tel" placeholder="Your Phone Number" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/40" />
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-4 border-t border-primary/10">
                          <input type="tel" placeholder="Your Contact Number *" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/40" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Coupon Code section */}
                  <div className="bg-background border border-border/40 rounded-xl p-5 space-y-3">
                    <label className="text-sm font-semibold text-foreground block">Apply Promo Coupon Code</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="e.g. GOPAL10" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="flex-1 px-4 py-3 border border-input rounded-lg bg-card text-sm uppercase font-bold focus:ring-2 focus:ring-primary/50" />
                      <button type="button" onClick={handleApplyCoupon} className="px-6 py-3 bg-[#3E2723] hover:bg-[#3E2723]/90 text-white rounded-lg text-sm font-bold transition-colors">Apply</button>
                    </div>
                    {appliedDiscount > 0 && <p className="text-sm font-bold text-emerald-600 mt-2">✓ Promo applied: -₹{appliedDiscount}</p>}
                    {couponError && <p className="text-sm font-bold text-rose-600 mt-2">{couponError}</p>}
                  </div>
                  
                  {/* Checkout Summary */}
                  <div className="bg-primary text-primary-foreground rounded-2xl p-6 md:p-8 flex items-center justify-between shadow-xl">
                    <div>
                      <p className="text-primary-foreground/70 text-sm font-bold uppercase tracking-widest mb-1">Total to Pay</p>
                      <h2 className="text-4xl font-serif font-bold">₹{totalPrice}</h2>
                      {appliedDiscount > 0 && <p className="text-primary-foreground/80 text-sm mt-1">Includes ₹{appliedDiscount} discount</p>}
                    </div>
                    <Button onClick={() => handleOrderSubmit("quote")} disabled={!getStepValidation(currentStep) || isSubmitting} className="h-14 px-8 bg-white hover:bg-white/90 text-primary font-bold rounded-xl shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 text-lg">
                      {isSubmitting ? <Refresh2 className="w-5 h-5 animate-spin" /> : <Card className="w-5 h-5" />} Complete Order
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between mt-8 pb-12">
          <Button variant="ghost" onClick={handlePrev} className={`flex items-center gap-2 text-muted-foreground hover:text-foreground text-lg ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ArrowLeft2 className="w-5 h-5" /> Back
          </Button>
          
          {currentStep < totalSteps && (
            <Button onClick={handleNext} disabled={!getStepValidation(currentStep)} className="h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 text-lg">
              Next Step <ArrowRight2 className="w-5 h-5" />
            </Button>
          )}
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
