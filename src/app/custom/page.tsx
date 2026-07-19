"use client";

import Image from "next/image";
import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { CloudPlus, TickCircle, Clock, Gift, Card, Refresh2, Star, Sun1, Reserve, GalleryAdd, CloseSquare, Gallery } from "iconsax-react";
import dynamic from "next/dynamic";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";
import { WEIGHT_OPTIONS, REGULAR_FLAVOURS, MANGO_FUSION_FLAVOURS, STRAWBERRY_FUSION_FLAVOURS } from "@/lib/flavours";
import { toBranchId, BRANCHES } from "@/lib/branches";
import { BackButton } from "@/components/ui/BackButton";


const LeafletAddressPicker = dynamic(
  () => import("@/components/home/LeafletAddressPicker").then((mod) => mod.LeafletAddressPicker),
  { ssr: false, loading: () => <div className="p-4 text-center text-sm text-muted-foreground"><Refresh2 className="w-4 h-4 animate-spin mx-auto mb-2" />Loading map...</div> }
);

// Seasonal flags — will come from Admin Settings API
const MANGO_FUSION_ACTIVE    = true;
const STRAWBERRY_FUSION_ACTIVE = false;

// Placeholder prices — Admin sets real prices via dashboard
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

  // Image Uploads
  const imageParam = searchParams.get("image");
  const [referenceImages, setReferenceImages] = useState<string[]>(imageParam ? [imageParam] : []);
  const [printImages, setPrintImages] = useState<string[]>([]);
  const [hasReference, setHasReference] = useState(true);
  const [isPhotoCake, setIsPhotoCake] = useState(false);
  
  // Step tracking
  const [step, setStep] = useState(() => {
    if (weightParam && flavourParam) return 3;
    if (weightParam) return 2;
    return 1;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 — Weight
  const [selectedWeight, setSelectedWeight]   = useState<string | null>(weightParam || null);

  // Step 2 — Flavour
  const [selectedFlavour, setSelectedFlavour] = useState<string | null>(flavourParam || null);
  const [flavourSearch, setFlavourSearch]     = useState("");

  // Step 3 — Order Details
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
  const [contact, setContact]                 = useState("");
  const [deliveryType, setDeliveryType]       = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress]                 = useState("");
  const [houseNo, setHouseNo]                 = useState("");
  const [landmark, setLandmark]               = useState("");
  const [branchDistances, setBranchDistances] = useState<{ branch: string; distanceKm: number }[]>([]);
  const [selectedBranch, setSelectedBranch]   = useState("khanderao"); // Default: canonical branch ID

  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError]     = useState("");
  const [isSurprise, setIsSurprise]           = useState(false);
  const [recipientName, setRecipientName]     = useState("");
  const [notes, setNotes]                     = useState("");

  // Pricing
  const PHOTO_SURCHARGE = 200;
  const basePrice   = selectedWeight ? (MOCK_PRICES[selectedWeight] ?? 0) : 0;
  const baseTotal   = (basePrice + (isPhotoCake ? PHOTO_SURCHARGE : 0)) * quantity;
  let   deliveryFee = 0;
  if (deliveryType === "delivery" && branchDistances.length > 0) {
    const sel = branchDistances.find(b => b.branch === selectedBranch);
    if (sel && sel.distanceKm !== 999) deliveryFee = Math.round(sel.distanceKm * 20);
  }

  const [coupon, setCoupon] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

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

  // Cloudinary upload handlers
  const handleReferenceUploadSuccess = (urls: string[]) => {
    setReferenceImages(urls);
  };
  
  const handlePrintUploadSuccess = (urls: string[]) => {
    setPrintImages(urls);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-40 md:pb-32 pt-24 md:pt-32">
      <div className="md:container md:mx-auto md:px-4 md:py-8 md:grid md:grid-cols-12 md:gap-12 lg:gap-16">

        <BackButton fallback="/menu" label="Back to Menu" variant="link" className="px-0 md:col-span-12 mb-4 text-foreground/60 hover:text-primary uppercase tracking-widest text-xs font-bold" />

        {/* ── LEFT: Reference Image Upload Zone ── */}
        <div className="md:col-span-5 lg:col-span-4 md:sticky md:top-24 self-start">

          <div className="space-y-6">
            {/* Reference Toggle & Uploader */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm cursor-pointer hover:border-primary transition-colors" onClick={() => setHasReference(!hasReference)}>
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <GalleryAdd className="w-5 h-5 text-primary" /> I have a Design Reference
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload an image for our chef to replicate.
                  </p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${hasReference ? 'bg-primary' : 'bg-muted'}`}>
                  <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" animate={{ x: hasReference ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                </div>
              </div>

              <AnimatePresence>
                {hasReference && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="pt-2">
                      <CloudinaryUploader 
                        onUploadSuccess={handleReferenceUploadSuccess}
                        existingImages={referenceImages}
                        label="Upload Reference Images"
                        folder="gopal-cakes/customer-references"
                        maxFiles={3}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Photo Cake Toggle & Uploader */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm cursor-pointer hover:border-primary transition-colors" onClick={() => setIsPhotoCake(!isPhotoCake)}>
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Gallery className="w-5 h-5 text-primary" /> This is a Photo Cake
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload private photos you want printed on the cake.
                  </p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${isPhotoCake ? 'bg-primary' : 'bg-muted'}`}>
                  <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" animate={{ x: isPhotoCake ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                </div>
              </div>

              <AnimatePresence>
                {isPhotoCake && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="pt-2">
                      <CloudinaryUploader 
                        onUploadSuccess={handlePrintUploadSuccess}
                        existingImages={printImages}
                        label="Upload Printable Photos"
                        folder="gopal-cakes/customer-print-photos"
                        maxFiles={3}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Info callout */}
          <div className="p-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl hidden md:block">
            <p className="text-xs font-bold text-amber-800 mb-1">📸 Design Reference Tips</p>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Save the cake image from Instagram or Pinterest</li>
              <li>• Upload it here as your reference</li>
              <li>• Our chef will replicate the design</li>
              <li>• You can still pick any flavour you want</li>
            </ul>
          </div>

          {/* Mobile title */}
          <div className="p-4 md:hidden border-b border-border/40 mb-6 pb-6">
            <span className="text-[10px] font-sans font-bold text-secondary tracking-[0.3em] uppercase block mb-2">Bespoke Creations</span>
            <h1 className="font-serif text-5xl font-bold text-foreground leading-[1.1]">Design Your<br /><span className="italic font-light text-secondary">Masterpiece</span></h1>
            <p className="font-serif italic text-foreground/70 text-lg mt-4 leading-relaxed">Upload your reference, pick flavour & size. We'll bake it exactly as you imagine.</p>
          </div>

          <div className="hidden md:block mt-8 border-t border-border/40 pt-8">
            <span className="text-[10px] font-sans font-bold text-secondary tracking-[0.3em] uppercase block mb-3">Bespoke Creations</span>
            <h1 className="font-serif text-6xl lg:text-7xl font-bold text-foreground leading-[1.1]">Design Your<br /><span className="italic font-light text-secondary">Masterpiece</span></h1>
            <p className="font-serif italic text-foreground/70 text-xl mt-6 leading-relaxed max-w-sm">Upload your reference, pick your flavour & size. We'll bake it exactly as you imagine.</p>
          </div>
        </div>

        {/* ── RIGHT: Order Form (identical to product page) ── */}
        <div className="md:col-span-7 lg:col-span-8 p-4 md:p-0 flex flex-col gap-8">

          {/* STEP 1: Weight */}
          <div>
            <h3 className="font-serif text-3xl font-bold mb-6 flex items-center">
              <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary mr-4 font-bold mt-1">Step 01</span>
              Select Weight
            </h3>
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
              {WEIGHT_OPTIONS.map((w) => {
                const price      = MOCK_PRICES[w.value];
                const isSelected = selectedWeight === w.value;
                return (
                  <button
                    key={w.value}
                    onClick={() => { setSelectedWeight(w.value); setStep(Math.max(step, 2)); }}
                    className={`relative flex-shrink-0 flex flex-col items-center justify-center px-3 py-3 rounded-xl text-sm font-bold border-2 transition-all min-w-[72px] ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-border bg-card text-foreground hover:border-primary/30"
                    }`}
                  >
                    {isSelected && (
                      <motion.div layoutId="weight-active" className="absolute top-1 right-1">
                        <TickCircle className="w-3 h-3 text-primary fill-primary/20" />
                      </motion.div>
                    )}
                    <span>{w.label}</span>
                    {price !== undefined && <span className="text-[10px] font-normal opacity-60 mt-0.5">₹{price}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* STEP 2: Flavour */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <h3 className="font-serif text-3xl font-bold mb-6 flex items-center">
                  <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary mr-4 font-bold mt-1">Step 02</span>
                  Select Flavour
                  {selectedFlavour && (
                    <span className="ml-4 font-sans text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{selectedFlavour}</span>
                  )}
                </h3>

                <div className="relative mb-6">
                  <input type="text" placeholder="Search flavours... (e.g. Butterscotch, Mango)" value={flavourSearch} onChange={(e) => setFlavourSearch(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-3 text-lg font-serif italic text-foreground placeholder:text-foreground/30 transition-colors" />
                  {flavourSearch && <button onClick={() => setFlavourSearch("")} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg">×</button>}
                </div>

                <div className="space-y-5 max-h-[400px] overflow-y-auto pr-1">
                  {filteredRegular.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Reserve className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Regular Flavours</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filteredRegular.map((f) => (
                          <button key={f.id} onClick={() => { setSelectedFlavour(f.name); setStep(Math.max(step, 3)); }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedFlavour === f.name ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"}`}>
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {MANGO_FUSION_ACTIVE && filteredMango.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sun1 className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Summer Exclusive — Mango Fusion</span>
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-300">LIMITED</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filteredMango.map((f) => (
                          <button key={f.id} onClick={() => { setSelectedFlavour(f.name); setStep(Math.max(step, 3)); }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedFlavour === f.name ? "border-amber-500 bg-amber-500 text-white shadow-sm" : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"}`}>
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {STRAWBERRY_FUSION_ACTIVE && filteredStrawberry.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Winter Exclusive — Strawberry Fusion</span>
                        <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-300">LIMITED</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filteredStrawberry.map((f) => (
                          <button key={f.id} onClick={() => { setSelectedFlavour(f.name); setStep(Math.max(step, 3)); }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedFlavour === f.name ? "border-blue-500 bg-blue-500 text-white shadow-sm" : "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"}`}>
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredRegular.length === 0 && filteredMango.length === 0 && filteredStrawberry.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">No flavours found for &quot;{flavourSearch}&quot;</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step >= 2 && <Separator className="opacity-50" />}

          {/* STEP 3: Order Details */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-12 pb-10">
                <h3 className="font-serif text-3xl font-bold flex items-center">
                  <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary mr-4 font-bold mt-1">Step 03</span>
                  The Details
                </h3>

                {/* Name on Cake & Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Name / Message on Cake</label>
                    <input type="text" placeholder='e.g. "Happy Birthday Priya! 🎂"' value={nameOnCake} onChange={(e) => setNameOnCake(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-3 text-lg font-serif text-foreground placeholder:text-foreground/30 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Quantity</label>
                    <div className="flex items-center justify-between h-[50px] border-b-2 border-border/40">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 text-foreground/50 hover:text-primary transition-colors text-xl font-serif">-</button>
                      <div className="flex-1 text-center font-serif text-xl font-bold text-foreground">{quantity}</div>
                      <button onClick={() => setQuantity(quantity + 1)} className="px-2 text-foreground/50 hover:text-primary transition-colors text-xl font-serif">+</button>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Date Required <span className="text-primary">*</span></label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-3 text-lg font-serif text-foreground transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Preferred Time</label>
                    <div className="relative">
                      <Clock className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-3 pr-8 text-lg font-serif text-foreground transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Delivery/Pickup */}
                <div className="bg-background border border-border/40 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
                  <div className="space-y-4">
                    <div className="text-[10px] font-sans font-bold text-secondary uppercase tracking-[0.2em]">How would you like to receive it?</div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setDeliveryType("pickup")} className={`flex-1 py-4 px-4 rounded-xl border transition-all font-serif font-bold text-lg ${deliveryType === "pickup" ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border hover:border-primary/30 text-foreground/50 hover:text-foreground"}`}>Store Pickup</button>
                      <button type="button" onClick={() => setDeliveryType("delivery")} className={`flex-1 py-4 px-4 rounded-xl border transition-all font-serif font-bold text-lg ${deliveryType === "delivery" ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border hover:border-primary/30 text-foreground/50 hover:text-foreground"}`}>Home Delivery</button>
                    </div>
                  </div>
                  <div className="relative z-50">
                    <LeafletAddressPicker onAddressChange={(addr) => setAddress(addr)} onCalculating={(isCalc) => setIsCalculatingDistance(isCalc)} onDistancesCalculated={(distances, err) => { setBranchDistances(distances); setDistanceError(err); if (distances.length > 0) setSelectedBranch(toBranchId(distances[0].branch)); }} />
                  </div>
                  <AnimatePresence>
                    {deliveryType === "delivery" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-8 border-t border-border/40 space-y-6 overflow-hidden">
                        <h4 className="font-serif text-2xl font-bold text-foreground">Delivery Details</h4>
                        <div className="space-y-6">
                          <div>
                            <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 mb-1 block">House / Flat / Block No. *</label>
                            <input type="text" value={houseNo} onChange={(e) => setHouseNo(e.target.value)} placeholder="e.g. 38, Amrutnagar" className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/30" />
                          </div>
                          <div>
                            <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 mb-1 block">Area / Road (from map)</label>
                            <input type="text" value={address} readOnly placeholder="Fetched from map" className="w-full bg-transparent border-0 border-b-2 border-border/40 px-0 py-2 text-lg font-serif text-foreground/50 cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 mb-1 block">Landmark (Optional)</label>
                            <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Opposite XYZ School" className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/30" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {branchDistances.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{deliveryType === "pickup" ? "Select Pickup Branch" : "Delivering From"}</label>
                      <div className="space-y-2">
                        {branchDistances.map((b) => (
                          <button key={b.branch} onClick={() => setSelectedBranch(b.branch)} className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${selectedBranch === b.branch ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/30"}`}>
                            <span className={`font-semibold text-sm ${selectedBranch === b.branch ? "text-primary" : "text-foreground"}`}>{b.branch}</span>
                            {deliveryType === "delivery" && b.distanceKm !== 999 && <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">Delivery: ₹{Math.round(b.distanceKm * 20)}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {isCalculatingDistance && <p className="text-sm text-primary font-medium flex items-center gap-2"><Refresh2 className="w-4 h-4 animate-spin" />Calculating routes...</p>}
                  {distanceError && <p className="text-sm text-destructive font-medium">{distanceError}</p>}
                </div>

                {/* Surprise Toggle */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Gift className="w-6 h-6 text-primary" /></div>
                      <div>
                        <h4 className="font-serif font-bold text-xl text-foreground">Make it a Surprise</h4>
                        <p className="font-serif italic text-foreground/70 mt-1">We won't call the recipient until arrival.</p>
                      </div>
                    </div>
                    <button onClick={() => setIsSurprise(!isSurprise)} className={`w-14 h-8 rounded-full transition-colors relative ${isSurprise ? "bg-primary" : "bg-muted border border-border"}`}>
                      <motion.div layout className="w-6 h-6 bg-white rounded-full absolute top-1 left-1 shadow-sm" animate={{ x: isSurprise ? 24 : 0 }} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {isSurprise && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-primary/10">
                        <div className="space-y-1">
                          <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Recipient's Name</label>
                          <input type="text" placeholder="Who is getting the cake?" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/30" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Your Contact Number</label>
                          <input type="tel" placeholder="+91 XXXXX XXXXX" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/30" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!isSurprise && (
                    <div className="pt-4 border-t border-primary/10 space-y-1">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Your Contact Number <span className="text-primary">*</span></label>
                      <input type="tel" placeholder="+91 XXXXX XXXXX" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif text-foreground transition-colors placeholder:text-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Coupon Code section */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
                  <label className="text-sm font-semibold text-foreground block">Apply Promo Coupon Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. GOPAL10" 
                      value={coupon} 
                      onChange={(e) => setCoupon(e.target.value)} 
                      className="flex-1 px-4 py-2 border border-input rounded-lg bg-card text-sm uppercase font-bold focus:ring-2 focus:ring-primary/50" 
                    />
                    <button 
                      type="button" 
                      onClick={handleApplyCoupon} 
                      className="px-4 py-2 bg-[#3E2723] hover:bg-[#3E2723]/90 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedDiscount > 0 && <p className="text-xs font-bold text-emerald-600">✓ Promo applied: -₹{appliedDiscount}</p>}
                  {couponError && <p className="text-xs font-bold text-rose-600">{couponError}</p>}
                </div>

                {/* Additional notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Special Instructions / Notes</label>
                  <textarea placeholder="Describe anything specific about your design — colours, decorations, tier style, etc." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-3 text-lg font-serif italic text-foreground transition-colors placeholder:text-foreground/30 min-h-[100px] resize-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <AnimatePresence>
        {selectedWeight && (
          <motion.div initial={{ y: 150 }} animate={{ y: 0 }} exit={{ y: 150 }}
            className="fixed bottom-0 left-0 right-0 p-3 md:p-6 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] z-[100]">
            <div className="md:container md:mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
              
              {/* Stats Row */}
              <div className="w-full md:w-auto flex items-center justify-between md:justify-start md:gap-8 px-1 md:px-0">
                <div className="flex flex-col">
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-widest">Weight</p>
                  <p className="text-sm md:text-base font-bold text-foreground">{selectedWeight}</p>
                </div>
                {selectedFlavour && (
                  <>
                    <div className="h-6 md:h-8 w-px bg-border mx-2 md:mx-0" />
                    <div className="flex flex-col flex-1 mx-2 md:mx-0">
                      <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-widest">Flavour</p>
                      <p className="text-sm md:text-base font-bold text-foreground line-clamp-1">{selectedFlavour}</p>
                    </div>
                  </>
                )}
                <div className="h-6 md:h-8 w-px bg-border mx-2 md:mx-0" />
                <div className="flex flex-col text-right md:text-left">
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-widest">Total</p>
                  <p className="text-base md:text-xl font-heading font-bold text-foreground">₹{totalPrice}</p>
                </div>
              </div>

              {/* Button */}
              <Button
                  disabled={!selectedFlavour || !date || !contact || isSubmitting || (deliveryType === "delivery" && (!address || !houseNo)) || (isSurprise && !recipientName)}
                  onClick={() => handleOrderSubmit("quote")}
                  className="h-12 md:h-14 w-full md:w-auto px-6 md:px-8 text-sm md:text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl rounded-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {isSubmitting ? <Refresh2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                  {!selectedFlavour ? "Select Flavour" : !date ? "Select Date" : !contact ? "Enter Contact" : `Request Quote`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
