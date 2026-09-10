"use client";

import Script from "next/script";
import { BackButton } from "@/components/ui/BackButton";
import { NotificationToast } from "@/components/ui/NotificationToast";
import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  TickCircle,
  ArrowRight2,
  ArrowLeft2,
  Location,
  Shop,
  Bag,
  Refresh2,
  Calendar,
  Clock,
} from "iconsax-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { WEIGHT_OPTIONS, getActiveFlavours, getFlavourSurcharge } from "@/lib/flavours";
import { Trash } from "iconsax-react";
import { GoogleAddressPicker } from "@/components/home/GoogleAddressPicker";

function parseWeightToNumber(weightStr: string): number {
  if (!weightStr) return 0.5;
  const num = parseFloat(weightStr);
  if (weightStr.toLowerCase().includes("kg")) return num;
  if (weightStr.toLowerCase().includes("g")) return num / 1000;
  return num;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart, updateItemConfig, removeItem } = useCart();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey] = useState(() => uuidv4());
  const [toast, setToast] = useState<{
    id: string;
    title: string;
    message: string;
    variant: "info" | "success" | "warning";
  } | null>(null);

  // Show toast if customer was redirected back after a failed payment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment_failed') === '1') {
        setToast({
          id: Date.now().toString(),
          title: "Payment Failed",
          message: "Your payment was not completed. Your cart is intact — please try again.",
          variant: "warning",
        });
        // Clean the URL without reloading
        window.history.replaceState({}, '', '/checkout');
      }
    }
  }, []);

  // Fulfillment Type
  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">(
    "DELIVERY",
  );

  // Target Date & Time (Default to tomorrow)
  const [date, setDate] = useState("");
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split("T")[0]);
  }, []);
  const [time, setTime] = useState("18:00");

  // Customer Contact Info
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    house: "",
    street: "",
    area: "",
    city: "Vadodara",
    pin: "",
    landmark: "",
  });

  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const calculateCharge = (dist: number) => {
    if (dist <= 5) return 100;
    if (dist <= 10) return 150;
    return 150 + Math.ceil(dist - 10) * 10;
  };

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<
    "ADVANCE_50" | "ONLINE_100"
  >("ADVANCE_50");

  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const flavours = getActiveFlavours();

  const basePrices: Record<string, number> = {
    "250g": 350, "500g": 600, "750g": 850, "1kg": 1100, "1.5kg": 1600,
    "2kg": 2100, "2.5kg": 2600, "3kg": 3000, "3.5kg": 3500, "4kg": 4000,
    "4.5kg": 4400, "5kg": 4800, "5.5kg": 5250, "6kg": 5700, "6.5kg": 6150,
    "7kg": 6600, "7.5kg": 7000, "8kg": 7450, "8.5kg": 7900, "9kg": 8300,
    "9.5kg": 8750, "10kg": 9200,
  };

  const handleUpdateItem = (item: any, field: string, value: string) => {
    const newVariant = field === "variant" ? value : item.variant || "500g";
    const newFlavor = field === "flavor" ? value : item.flavor || "Classic";
    let itemBasePrice = item.basePrice || 600;
    
    if (field === "variant" && item.availableWeights) {
      const selectedWeightOpt = item.availableWeights.find((w: any) => w.value === value);
      if (selectedWeightOpt && selectedWeightOpt.price) {
        itemBasePrice = selectedWeightOpt.price;
      } else if (newVariant && basePrices[newVariant]) {
        const scale = basePrices[newVariant] / basePrices["500g"];
        itemBasePrice = Math.round(itemBasePrice * scale);
      }
    } else if (newVariant && basePrices[newVariant]) {
      const scale = basePrices[newVariant] / basePrices["500g"];
      itemBasePrice = Math.round(itemBasePrice * scale);
    }
    const weightKg = parseWeightToNumber(newVariant);
    const surcharge = getFlavourSurcharge(newFlavor, weightKg);
    const newPrice = itemBasePrice + surcharge;
    updateItemConfig(item.cartItemId, { [field]: value, price: newPrice });
  };

  useEffect(() => {
    fetch("/api/v1/branches")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setBranches(data.data);
          setBranchId(data.data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const validateStep1 = () => {
    if (deliveryType === "DELIVERY") {
        if (
          !formData.house.trim() ||
          !formData.street.trim()
        ) {
          setToast({
            id: Date.now().toString(),
            title: "Required Fields Missing",
            message: "Please fill in all required delivery address fields (*).",
            variant: "warning",
          });
          return false;
        }
        
        if (deliveryLatitude === null || deliveryLongitude === null) {
          setToast({
            id: Date.now().toString(),
            title: "Location Not Selected",
            message: "Please select an address from the dropdown or click 'Detect my current location' so we can calculate delivery.",
            variant: "warning",
          });
          return false;
        }
    }
    if (!date || !time) {
      setToast({
        id: Date.now().toString(),
        title: "Required Fields Missing",
        message: "Please select a target Date and Time.",
        variant: "warning",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      setToast({
        id: Date.now().toString(),
        title: "Required Fields Missing",
        message: "Please fill in your Name and Phone Number.",
        variant: "warning",
      });
      return false;
    }
    if (formData.phone.length !== 10) {
      setToast({
        id: Date.now().toString(),
        title: "Invalid Input",
        message: "Please enter exactly 10 digits for your Phone Number.",
        variant: "warning",
      });
      return false;
    }
    return true;
  };

  const isQuoteRequest = items.some((item) => item.isCustom);

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    else if (currentStep === 2 && validateStep2()) {
      if (isQuoteRequest) {
        handlePlaceOrder();
      } else {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setIsSubmitting(true);
    try {
      const finalBranchId = "uma";

      const payload = {
        idempotencyKey,
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        },
        address:
          deliveryType === "PICKUP"
            ? {
                house: "Store Pickup",
                street: "Uma Char Rasta Branch",
                area: "Vadodara",
                city: "Vadodara",
                pin: "390001",
                landmark: "Picked up by customer",
              }
            : {
                house: formData.house,
                street: formData.street,
                area: formData.area || "Vadodara",
                city: formData.city,
                pin: formData.pin || "390001",
                landmark: formData.landmark,
              },
        items: items.map((i) => {
          return {
            productId: i.productId,
            quantity: i.quantity,
            weight: parseWeightToNumber(i.variant || ""),
            flavor: i.flavor || "Classic",
            messageOnCake: i.messageOnCake || "",
            notes: i.notes || "",
            price: i.price, 
            isCustomizable: i.isCustomizable,
            isPhotoCake: i.isPhotoCake,
            printImage: i.printImage,
            referenceImages: i.referenceImages
          };
        }),
        paymentMethod: isQuoteRequest ? undefined : "RAZORPAY",
        deliveryType,
        branchId: finalBranchId,
        deliveryDistanceKm: deliveryType === "DELIVERY" ? deliveryDistanceKm : undefined,
        deliveryLatitude: deliveryType === "DELIVERY" && deliveryLatitude ? deliveryLatitude : undefined,
        deliveryLongitude: deliveryType === "DELIVERY" && deliveryLongitude ? deliveryLongitude : undefined,
        deliveryDate: new Date(`${date}T${time}:00`).toISOString(),
        type: isQuoteRequest ? "QUOTE" : "ORDER",
      };

      const res = await fetch("/api/v1/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((e) => ({
        ok: false,
        json: async () => ({ error: e.message }),
      }));

      if (!res.ok) {
        const errData = await ("json" in res
          ? res.json().catch(() => ({}))
          : {});
        setToast({
          id: Date.now().toString(),
          title: "Checkout Failed",
          message:
            errData.error || "Order could not be placed. Please try again.",
          variant: "warning",
        });
        return;
      }

      const data = await res.json();
      const createdOrderId = data.orderId;
      const trackingId = data.trackingId;

      if (isQuoteRequest) {
        clearCart();
        // Clear the custom cake draft so they can start fresh next time
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('gcs_custom_cake_draft');
        }
        setToast({
          id: Date.now().toString(),
          title: "Quote Request Sent",
          message: "Our team will review your requirements and send a payment link shortly.",
          variant: "success",
        });
        setTimeout(() => router.push(`/track/${trackingId}`), 2000);
        return;
      }

      const finalGrandTotal = deliveryType === "DELIVERY" ? subtotal + deliveryCharge : subtotal;

      if (paymentMethod === "ADVANCE_50" || paymentMethod === "ONLINE_100") {
        const paymentAmount = paymentMethod === "ADVANCE_50" ? finalGrandTotal / 2 : finalGrandTotal;

        // Use server-side Razorpay Payment Link
        const rzpRes = await fetch("/api/v1/payments/create-payment-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: createdOrderId,
            amount: paymentAmount,
            trackingId,
            customerName: formData.name,
            customerPhone: formData.phone,
            customerEmail: formData.email,
          })
        });

        if (!rzpRes.ok) {
          let backendError = "Failed to initialize payment gateway";
          try {
            const errorData = await rzpRes.json();
            if (errorData.error) backendError = errorData.error;
          } catch(e) {}
          throw new Error(backendError);
        }

        const rzpData = await rzpRes.json();

        // Store pending payment so the tracking page can clear the cart AFTER payment
        if (typeof window !== "undefined") {
          sessionStorage.setItem('gcs_pending_payment', JSON.stringify({ trackingId, orderId: createdOrderId }));
        }
        window.location.href = rzpData.paymentUrl;
      } else {
        clearCart();
        router.push(`/track/${trackingId}`);
      }
    } catch (err: any) {
      console.error("Checkout Exception Details:", err);
      setToast({
        id: Date.now().toString(),
        title: "Checkout Exception",
        message: err?.message || "An unexpected error occurred. Please try again.",
        variant: "warning",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Bag className="w-12 h-12 text-secondary opacity-30 mb-6" />
        <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
          Your Cart is Empty
        </h1>
        <p className="font-serif italic text-foreground/50 mb-8">
          Let's find something delicious for you.
        </p>
        <Link
          href="/menu"
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          Explore Catalogue
        </Link>
      </div>
    );
  }

  const steps = [
    { id: 1, name: "Logistics" },
    { id: 2, name: "Identity" },
    ...(isQuoteRequest ? [] : [{ id: 3, name: "Payment" }])
  ];

  return (
    <>
      <div className="min-h-screen bg-background pb-32 lg:pb-16 relative">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 pt-8">
          
          {/* Header & Steps Indicator */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
            <div>
              <BackButton
                fallback="/menu"
                label="Back to Catalogue"
                variant="link"
                className="mb-4 text-foreground/80 hover:text-primary uppercase tracking-widest text-xs font-bold w-fit -ml-4"
              />
              <span className="text-[10px] font-sans font-bold text-secondary tracking-[0.3em] uppercase block mb-2">
                Secure Checkout
              </span>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-[1.1]">
                Complete your <span className="italic font-light text-[var(--brand-champagne)]">Order</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4 bg-primary/5 p-3 px-5 rounded-full border border-primary/10 self-start md:self-auto">
              {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className={`flex items-center gap-2 ${currentStep >= step.id ? "opacity-100" : "opacity-50"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${currentStep === step.id ? "bg-[var(--brand-deep-rose)] text-white" : currentStep > step.id ? "bg-primary/20 text-primary" : "border-2 border-foreground/30 text-foreground/50"}`}>
                      {step.id}
                    </span>
                    <span className={`font-ui text-xs font-bold uppercase tracking-wider hidden sm:block ${currentStep === step.id ? "text-[var(--brand-deep-rose)]" : "text-foreground"}`}>
                      {step.name}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ArrowRight2 className="w-4 h-4 text-primary/30" variant="Bold" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Wizard Forms */}
                        <div className="lg:col-span-7">
              {/* RESTORED INLINE EDITING */}
              <div className="mb-10 bg-card border border-[var(--brand-deep-rose)]/20 rounded-3xl p-6 md:p-8 shadow-sm">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[var(--brand-deep-rose)] font-bold px-2.5 py-1 bg-[var(--brand-deep-rose)]/10 rounded-full">
                    EDIT
                  </span>
                  Cake Message & Customization
                </h2>
                <div className="space-y-5">
                  {items.map((item) => (
                    <div key={item.cartItemId} className="p-4 bg-muted/20 border border-border/50 rounded-2xl space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted relative shrink-0 border border-primary/10">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Bag className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-serif font-bold text-sm line-clamp-1 pr-4 mb-2">{item.name}</h4>
                          <div className="flex flex-wrap items-center gap-2">
                            {item.availableWeights && item.availableWeights.length > 0 ? (
                              <select
                                value={item.variant || "500g"}
                                onChange={(e) => handleUpdateItem(item, "variant", e.target.value)}
                                className="text-[10px] font-sans font-bold bg-background border border-primary/20 rounded px-2 py-1 focus:outline-none focus:border-primary text-muted-foreground uppercase tracking-wider cursor-pointer"
                              >
                                {item.availableWeights.map((w: any) => (
                                  <option key={w.value} value={w.value}>{w.label}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-[10px] font-sans font-bold bg-muted/50 border border-primary/10 rounded px-2 py-1 text-muted-foreground uppercase tracking-wider">
                                {item.variant || "500g"}
                              </div>
                            )}
                            <select
                              value={item.flavor || "Classic"}
                              onChange={(e) => handleUpdateItem(item, "flavor", e.target.value)}
                              className="text-[10px] font-sans font-bold bg-background border border-primary/20 rounded px-2 py-1 focus:outline-none focus:border-primary text-muted-foreground uppercase tracking-wider cursor-pointer"
                            >
                              <option value="Classic">Classic Flavour</option>
                              {flavours.map((f) => (
                                <option key={f.id} value={f.name}>{f.name} {f.surchargePerHalfKg ? `(+₹${f.surchargePerHalfKg}/500g)` : ""}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeItem(item.cartItemId)}
                              className="flex items-center gap-1 text-[10px] font-sans font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200 transition-colors uppercase tracking-widest ml-auto"
                            >
                              <Trash className="w-3.5 h-3.5" variant="Bold" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 pt-2 border-t border-border/50">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Message on Cake (Optional)</label>
                          <input
                            type="text"
                            value={item.messageOnCake || ""}
                            onChange={(e) => updateItemConfig(item.cartItemId, { messageOnCake: e.target.value })}
                            placeholder="e.g. Happy Birthday Raj! (Keep under 30 letters)"
                            className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2 text-sm font-serif text-foreground transition-colors placeholder:text-foreground/30 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Special Instructions (Optional)</label>
                          <input
                            type="text"
                            value={item.notes || ""}
                            onChange={(e) => updateItemConfig(item.cartItemId, { notes: e.target.value })}
                            placeholder="e.g. Less sweet, eggless, deliver after 5pm..."
                            className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2 text-sm font-serif text-foreground transition-colors placeholder:text-foreground/30 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                
                {/* STEP 1: LOGISTICS */}
                {currentStep === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <section className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                      <h2 className="font-serif text-2xl font-bold text-foreground">
                        Fulfillment Mode
                      </h2>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          type="button"
                          onClick={() => setDeliveryType("DELIVERY")}
                          className={`flex-1 py-5 px-5 rounded-2xl border-2 transition-all flex flex-col items-start text-left gap-3 relative overflow-hidden ${
                            deliveryType === "DELIVERY"
                              ? "border-[var(--brand-deep-rose)] bg-[var(--brand-deep-rose)]/5 shadow-md"
                              : "border-primary/20 hover:border-primary/40 bg-background"
                          }`}
                        >
                          <div className={`p-3 rounded-full ${deliveryType === "DELIVERY" ? "bg-[var(--brand-deep-rose)] text-white" : "bg-primary/5 text-primary"}`}>
                            <Location className="w-5 h-5" variant={deliveryType === "DELIVERY" ? "Bold" : "Outline"} />
                          </div>
                          <div>
                            <h3 className={`font-serif text-lg font-bold ${deliveryType === "DELIVERY" ? "text-[var(--brand-deep-rose)]" : "text-foreground"}`}>Home Delivery</h3>
                            <p className="font-ui text-xs text-muted-foreground mt-1">Delivered to your doorstep.</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryType("PICKUP")}
                          className={`flex-1 py-5 px-5 rounded-2xl border-2 transition-all flex flex-col items-start text-left gap-3 relative overflow-hidden ${
                            deliveryType === "PICKUP"
                              ? "border-[var(--brand-deep-rose)] bg-[var(--brand-deep-rose)]/5 shadow-md"
                              : "border-primary/20 hover:border-primary/40 bg-background"
                          }`}
                        >
                          <div className={`p-3 rounded-full ${deliveryType === "PICKUP" ? "bg-[var(--brand-deep-rose)] text-white" : "bg-primary/5 text-primary"}`}>
                            <Shop className="w-5 h-5" variant={deliveryType === "PICKUP" ? "Bold" : "Outline"} />
                          </div>
                          <div>
                            <h3 className={`font-serif text-lg font-bold ${deliveryType === "PICKUP" ? "text-[var(--brand-deep-rose)]" : "text-foreground"}`}>Store Pickup</h3>
                            <p className="font-ui text-xs text-muted-foreground mt-1">Pick up from our kitchen.</p>
                          </div>
                        </button>
                      </div>

                      {deliveryType === "PICKUP" ? (
                        <div className="space-y-2 pt-2 animate-fadeIn">
                          <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Select Pickup Branch *</label>
                          <select
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="w-full bg-background border-2 border-primary/30 rounded-xl px-4 py-3.5 text-base font-serif text-foreground focus:border-[var(--brand-deep-rose)] focus:ring-0 focus:outline-none"
                          >
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>{b.name} - {b.city}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-5 pt-2 animate-fadeIn">
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">House / Flat No. / Building *</label>
                            <input
                              type="text"
                              value={formData.house}
                              onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                              placeholder="e.g. Block A, Flat 402"
                              className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors placeholder:text-foreground/30 focus:outline-none"
                            />
                          </div>
                          <div className="pt-4 pb-2 relative z-50">
                            <GoogleAddressPicker
                              onAddressChange={(address) => setFormData({ ...formData, street: address })}
                              onDistancesCalculated={(distances, error) => {
                                if (error) {
                                  setToast({ id: "err", title: "Distance Error", message: error, variant: "warning" });
                                } else {
                                  const umaDist = distances.find(d => d.branch === "Uma Char Rasta")?.distanceKm || 0;
                                  setDeliveryDistanceKm(umaDist);
                                  setDeliveryCharge(calculateCharge(umaDist));
                                }
                              }}
                              onCalculating={(isCalculating) => {
                                setIsCalculatingDistance(isCalculating);
                              }}
                              onLocationSelected={(lat, lng) => {
                                setDeliveryLatitude(lat);
                                setDeliveryLongitude(lng);
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">City</label>
                              <input type="text" disabled value={formData.city} className="w-full bg-transparent border-0 border-b-2 border-primary/10 px-0 py-2.5 text-base font-serif text-foreground/40 cursor-not-allowed focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">PIN Code *</label>
                              <input
                                type="text"
                                value={formData.pin}
                                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Landmark (Optional)</label>
                            <input
                              type="text"
                              value={formData.landmark}
                              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                              className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </section>
                    
                    <section className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                      <h2 className="font-serif text-2xl font-bold text-foreground">
                        Order Schedule
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-secondary" /> Target Date *</label>
                          <input
                            type="date"
                            value={date}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-background border-2 border-primary/30 rounded-xl px-4 py-3 text-base font-serif text-foreground focus:border-[var(--brand-deep-rose)] focus:ring-0 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-secondary" /> Time *</label>
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full bg-background border-2 border-primary/30 rounded-xl px-4 py-3 text-base font-serif text-foreground focus:border-[var(--brand-deep-rose)] focus:ring-0 focus:outline-none"
                          />
                        </div>
                      </div>
                    </section>

                    <button 
                      onClick={handleNextStep}
                      className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform"
                    >
                      Continue to Details
                    </button>
                  </motion.div>
                )}

                {/* STEP 2: IDENTITY */}
                {currentStep === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <section className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                      <h2 className="font-serif text-2xl font-bold text-foreground">
                        Contact Information
                      </h2>
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Full Name *</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Enter your name"
                              className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Phone Number *</label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setFormData({ ...formData, phone: val });
                              }}
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
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@example.com"
                            className="w-full bg-transparent border-0 border-b-2 border-primary/30 focus:border-[var(--brand-deep-rose)] focus:ring-0 px-0 py-2.5 text-base font-serif text-foreground transition-colors focus:outline-none"
                          />
                        </div>
                      </div>
                    </section>

                    <div className="flex gap-4">
                      <button 
                        onClick={handlePrevStep}
                        className="w-1/3 border-2 border-border/50 text-foreground font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2"
                      >
                        <ArrowLeft2 className="w-4 h-4" /> Back
                      </button>
                      <button 
                        onClick={handleNextStep}
                        disabled={isSubmitting}
                        className="w-2/3 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform disabled:opacity-50"
                      >
                        {isSubmitting ? "Processing..." : isQuoteRequest ? "Request Quote" : "Continue to Payment"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: PAYMENT */}
                {currentStep === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <section className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                      <h2 className="font-serif text-2xl font-bold text-foreground">
                        Payment Options
                      </h2>
                      <div className="space-y-4">
                        {[
                          { id: "ADVANCE_50", label: "50% Advance Payment", desc: "Pay 50% now via UPI/Card to confirm your order, pay the rest on delivery/pickup." },
                          { id: "ONLINE_100", label: "100% Online Payment", desc: "Pay the full amount securely now via UPI or Card." }
                        ].map((method) => (
                          <div
                            key={method.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setPaymentMethod(method.id as any)}
                            className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all border-2 ${
                              paymentMethod === method.id
                                ? "bg-[var(--brand-deep-rose)]/5 border-[var(--brand-deep-rose)] shadow-sm"
                                : "border-border/60 hover:border-[var(--brand-deep-rose)]/30 bg-transparent"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${paymentMethod === method.id ? "border-[var(--brand-deep-rose)]" : "border-foreground/30"}`}>
                              {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-deep-rose)]" />}
                            </div>
                            <div>
                              <div className="font-serif font-bold text-base text-foreground leading-tight">{method.label}</div>
                              <div className="text-xs font-serif italic text-foreground/50 mt-1">{method.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="flex gap-4">
                      <button 
                        onClick={handlePrevStep}
                        className="w-1/3 border-2 border-border/50 text-foreground font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2"
                      >
                        <ArrowLeft2 className="w-4 h-4" /> Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting}
                        className="w-2/3 bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/95 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                      >
                        {isSubmitting ? (
                          <><Refresh2 className="w-5 h-5 animate-spin" /> Processing...</>
                        ) : (
                          <><TickCircle className="w-5 h-5" /> Place Order</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column: Read-Only Cart Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-32 bg-card border border-border/50 rounded-3xl p-6 shadow-md space-y-6">
                <h3 className="font-serif text-2xl font-bold text-foreground border-b border-border/40 pb-4">
                  Cart Summary
                </h3>

                <div className="space-y-5 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start pb-4 border-b border-border/20 last:border-0 last:pb-0">
                      <div className="w-16 h-16 bg-muted rounded-xl overflow-hidden flex-shrink-0 relative border border-border/30 mt-1">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Bag className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-bold text-sm text-foreground line-clamp-2 leading-snug pr-2">
                          {item.name}
                        </h4>
                        
                        <div className="mt-1.5 space-y-0.5">
                          <div className="text-[10px] font-sans text-muted-foreground uppercase font-bold tracking-wider flex items-center justify-between">
                            <span>{item.variant || "Standard"} &bull; Qty: {item.quantity}</span>
                            <button
                               onClick={() => router.push(`/custom?edit=${item.cartItemId}`)}
                               className="text-[var(--brand-deep-rose)] hover:underline ml-2"
                             >
                               EDIT
                             </button>
                          </div>
                          
                          {item.flavor && item.flavor !== 'Classic' && (
                            <p className="text-[10px] font-sans text-[var(--brand-deep-rose)] uppercase font-bold tracking-wider">
                              Flavour: {item.flavor}
                            </p>
                          )}
                          
                          {item.messageOnCake && (
                            <p className="text-[10px] font-serif italic text-foreground/70 mt-1 line-clamp-1 border-l-2 border-primary/20 pl-2">
                              "{item.messageOnCake}"
                            </p>
                          )}
                          
                          {item.notes && (
                            <p className="text-[9px] font-sans text-muted-foreground bg-muted/50 p-1.5 rounded mt-1.5 line-clamp-2">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="font-serif font-bold text-sm text-foreground shrink-0 mt-1">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Calculation */}
                <div className="space-y-3 text-base pt-4 border-t border-border/40">
                  <div className="flex justify-between font-serif text-foreground/70">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between font-serif text-foreground/70">
                    <span>Fulfillment</span>
                    <span className="font-medium text-foreground">
                      {deliveryType === "PICKUP" ? "Store Pickup (Free)" : `Home Delivery (₹${deliveryCharge})`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border/40">
                    <span className="font-serif font-bold text-xl text-foreground">Grand Total</span>
                    <span className="font-serif font-bold text-2xl text-[var(--brand-deep-rose)]">₹{deliveryType === "DELIVERY" ? subtotal + deliveryCharge : subtotal}</span>
                  </div>
                </div>

                <div className="pt-2 text-center border-t border-border/20 pt-4">
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
    </>
  );
}

