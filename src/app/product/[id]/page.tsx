"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle2, Clock, Gift, CreditCard, Loader2, Navigation, Map } from "lucide-react";
import dynamic from "next/dynamic";

const LeafletAddressPicker = dynamic(
  () => import("@/components/home/LeafletAddressPicker").then((mod) => mod.LeafletAddressPicker),
  { ssr: false, loading: () => <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading free map interface...</div> }
);

// Mock Data
const product = {
  name: "Premium Truffle Cake",
  basePrice: 650,
  image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop",
  description: "A rich, moist chocolate cake layered with dark chocolate truffle ganache. Perfect for true chocolate lovers.",
};

const weights = [
  { label: "0.5 Kg", multiplier: 1 },
  { label: "1 Kg", multiplier: 2 },
  { label: "1.5 Kg", multiplier: 3 },
  { label: "2 Kg", multiplier: 4 }
];

export default function ProductPage() {
  const [selectedWeight, setSelectedWeight] = useState<typeof weights[0] | null>(null);

  // Form State
  const [nameOnCake, setNameOnCake] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [contact, setContact] = useState("");
  
  // Delivery & Mapbox State
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [branchDistances, setBranchDistances] = useState<{branch: string, distanceKm: number}[]>([]);
  // Detailed Address State
  const [houseNo, setHouseNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("Khanderao Market");
  
  const [isSurprise, setIsSurprise] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + newFiles.length <= 20) {
        setImages([...images, ...newFiles]);
      } else {
        alert("Maximum 20 images allowed");
      }
    }
  };

  const baseTotal = selectedWeight ? (product.basePrice * selectedWeight.multiplier) * quantity : 0;
  
  let deliveryFee = 0;
  if (deliveryType === "delivery" && branchDistances.length > 0) {
    const selectedBranchData = branchDistances.find(b => b.branch === selectedBranch);
    if (selectedBranchData && selectedBranchData.distanceKm !== 999) {
      deliveryFee = Math.round(selectedBranchData.distanceKm * 20); // ₹20 per km
    }
  }

  const totalPrice = baseTotal + deliveryFee;
  const advanceAmount = totalPrice * 0.5;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-40 md:pb-12">
      <div className="md:container md:mx-auto md:px-4 md:py-8 md:grid md:grid-cols-12 md:gap-12 lg:gap-16">
        
        {/* Sticky Left Column: Product Image & Details */}
        <div className="md:col-span-5 lg:col-span-4 md:sticky md:top-24 self-start">
          <div className="w-full aspect-square relative md:rounded-2xl md:overflow-hidden bg-secondary shadow-xl group">
            <svg className="hidden">
              <filter id="liquid">
                <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" className="transition-all duration-700 group-hover:scale-100" />
              </filter>
            </svg>
            <div className="w-full h-full overflow-hidden">
              <Image 
                src={product.image} alt={product.name} fill priority
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
            </div>
          </div>
          <div className="p-4 md:p-0 md:mt-6 hidden md:block">
            <h1 className="font-heading text-3xl font-bold text-foreground">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{product.description}</p>
          </div>
        </div>

        {/* Scrollable Right Column: Form */}
        <div className="md:col-span-7 lg:col-span-8 p-4 md:p-0 flex flex-col">
          
          <div className="md:hidden mb-6">
            <h1 className="font-heading text-2xl font-bold text-foreground">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{product.description}</p>
          </div>

          {/* Step 1: Weight Selection */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              Select Weight
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {weights.map((w) => (
                <button
                  key={w.label}
                  onClick={() => setSelectedWeight(w)}
                  className={`relative px-4 py-4 rounded-xl text-sm font-bold border-2 transition-all overflow-hidden ${
                    selectedWeight?.label === w.label 
                      ? "border-primary bg-primary/5 text-primary shadow-sm" 
                      : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  {selectedWeight?.label === w.label && (
                    <motion.div layoutId="weight-active" className="absolute top-1 right-1">
                      <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20" />
                    </motion.div>
                  )}
                  <span className="block">{w.label}</span>
                  <span className="block text-xs font-normal opacity-70 mt-1">₹{product.basePrice * w.multiplier}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator className="mb-8 opacity-50" />

          {/* Step 2: Expandable Form */}
          <AnimatePresence>
            {selectedWeight && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-8 pb-10">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                    Order Details
                  </h3>

                  {/* Row: Name & Quantity */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-medium text-foreground">Name on Cake</label>
                      <input type="text" placeholder="e.g. Happy Birthday John!" value={nameOnCake} onChange={(e) => setNameOnCake(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-input bg-card focus:ring-2 focus:ring-primary/50 text-base" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Quantity</label>
                      <div className="flex h-[50px] rounded-lg border border-input bg-card overflow-hidden">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 hover:bg-secondary transition-colors">-</button>
                        <div className="flex-1 flex items-center justify-center font-semibold text-base border-x border-input">{quantity}</div>
                        <button onClick={() => setQuantity(quantity + 1)} className="px-4 hover:bg-secondary transition-colors">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Row: Date & Time */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Date Required</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-input bg-card focus:ring-2 focus:ring-primary/50 text-base" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Preferred Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-card focus:ring-2 focus:ring-primary/50 text-base" />
                      </div>
                    </div>
                  </div>

                  {/* Smart Delivery/Pickup Location Engine */}
                  <div className="bg-secondary/30 p-5 rounded-xl border border-border/50 space-y-5 relative">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                      <Map className="absolute -right-10 -bottom-10 w-48 h-48 text-muted-foreground/5 rotate-12" />
                    </div>
                    
                    <div className="relative z-50">
                      <LeafletAddressPicker 
                        onAddressChange={(addr) => setAddress(addr)}
                        onCalculating={(isCalc) => setIsCalculatingDistance(isCalc)}
                        onDistancesCalculated={(distances, err) => {
                          setBranchDistances(distances);
                          setDistanceError(err);
                          if (distances.length > 0) setSelectedBranch(distances[0].branch);
                        }}
                      />
                    </div>
                    
                    <div className="space-y-3 relative z-10 pt-4 border-t border-border">
                      <div className="text-sm font-semibold text-foreground bg-primary text-primary-foreground px-3 py-1 rounded-md inline-block mb-1 shadow-sm">How would you like to receive it?</div>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setDeliveryType("pickup")}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-medium ${
                            deliveryType === "pickup"
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border hover:border-primary/30 text-muted-foreground hover:bg-secondary/50"
                          }`}
                        >
                          Store Pickup
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryType("delivery")}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-medium ${
                            deliveryType === "delivery"
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border hover:border-primary/30 text-muted-foreground hover:bg-secondary/50"
                          }`}
                        >
                          Home Delivery
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {deliveryType === "delivery" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-5 border-t border-border/50 space-y-5 overflow-hidden"
                        >
                          <h4 className="text-sm font-bold text-foreground">Enter Complete Address</h4>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">House / Flat / Block No. *</label>
                              <input 
                                type="text" 
                                value={houseNo}
                                onChange={(e) => setHouseNo(e.target.value)}
                                placeholder="e.g. 38, Amrutnagar" 
                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">Apartment / Road / Area *</label>
                              <input 
                                type="text" 
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. Alva Naka, GIDC Road, Manjalpur" 
                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-secondary/50 text-muted-foreground text-sm cursor-not-allowed"
                                readOnly
                              />
                              <p className="text-[10px] text-muted-foreground mt-1 text-right">Fetched from map automatically</p>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nearby Landmark (Optional)</label>
                              <input 
                                type="text" 
                                value={landmark}
                                onChange={(e) => setLandmark(e.target.value)}
                                placeholder="e.g. Opposite XYZ School" 
                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Dynamic Branch Detection UI */}
                    <AnimatePresence mode="wait">
                      {isCalculatingDistance ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-primary font-medium text-sm pt-2 relative z-10">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          OpenStreetMap is calculating precise routes...
                        </motion.div>
                      ) : distanceError ? (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-2 text-sm text-destructive font-medium relative z-10">
                          {distanceError}
                        </motion.div>
                      ) : branchDistances.length > 0 ? (
                        <motion.div key="results" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 pt-2 relative z-10">
                          
                          <label className="text-sm font-medium text-foreground flex items-center justify-between">
                            {deliveryType === "pickup" ? "Select Pickup Branch" : "Delivering From Branch"}
                            <span className="text-xs bg-green-500/10 text-green-600 font-bold px-2 py-1 rounded-md flex items-center gap-1">
                              <Navigation className="w-3 h-3" /> Live GPS Routing
                            </span>
                          </label>

                          <div className="space-y-2">
                            {branchDistances.map((b) => {
                              const fee = Math.round(b.distanceKm * 20);
                              return (
                                <button
                                  key={b.branch}
                                  onClick={() => setSelectedBranch(b.branch)}
                                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${selectedBranch === b.branch ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/30"}`}
                                >
                                  <div className="flex flex-col">
                                    <span className={`font-semibold text-sm ${selectedBranch === b.branch ? "text-primary" : "text-foreground"}`}>
                                      {b.branch}
                                    </span>
                                  </div>
                                  {deliveryType === "delivery" && b.distanceKm !== 999 && (
                                    <span className="text-xs font-bold text-foreground bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-1 rounded-md">
                                      Delivery: ₹{fee}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  {/* Surprise Order Toggle */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Gift className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Make it a Surprise</h4>
                          <p className="text-xs text-muted-foreground">We won't call the recipient until arrival.</p>
                        </div>
                      </div>
                      <button onClick={() => setIsSurprise(!isSurprise)} className={`w-12 h-6 rounded-full transition-colors relative ${isSurprise ? "bg-primary" : "bg-muted"}`}>
                        <motion.div layout className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm" animate={{ x: isSurprise ? 24 : 0 }} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isSurprise && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Recipient's Name (Person B)</label>
                            <input type="text" placeholder="Who is getting the cake?" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-input bg-card text-base focus:ring-2 focus:ring-primary/50" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Your Contact (Person A)</label>
                            <input type="tel" placeholder="Your number for updates" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-input bg-card text-base focus:ring-2 focus:ring-primary/50" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {!isSurprise && (
                      <div className="pt-2 border-t border-primary/10">
                        <label className="text-sm font-medium text-foreground block mb-2">Your Contact Number</label>
                        <input type="tel" placeholder="+91" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-input bg-card text-base focus:ring-2 focus:ring-primary/50" />
                      </div>
                    )}
                  </div>

                  {/* File Upload & Notes */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Reference Images (Max 20)</label>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-primary/30 bg-primary/5 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                        <UploadCloud className="w-6 h-6 text-primary mb-2" />
                        <span className="text-sm font-medium text-primary">Tap to upload design references</span>
                        <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                      {images.length > 0 && <div className="text-xs text-muted-foreground mt-2">{images.length} images selected.</div>}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Special Instructions / Notes</label>
                      <textarea placeholder="Any specific design details, color changes, or allergies?" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-input bg-card focus:ring-2 focus:ring-primary/50 text-base min-h-[100px] resize-none" />
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Bottom Action Bar: Order Summary & Payment */}
      <AnimatePresence>
        {selectedWeight && (
          <motion.div 
            initial={{ y: 150 }} animate={{ y: 0 }} exit={{ y: 150 }}
            className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-background/90 backdrop-blur-xl border-t border-border/50 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.2)] z-50"
          >
            <div className="md:container md:mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              
              <div className="w-full md:w-auto flex items-center justify-between md:justify-start md:gap-8">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Cake Amount</p>
                  <p className="text-xl font-heading font-bold text-foreground">₹{baseTotal}</p>
                </div>
                
                {deliveryType === "delivery" && (
                  <>
                    <div className="h-8 w-px bg-border"></div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Delivery Fee</p>
                      <p className="text-xl font-heading font-bold text-foreground">₹{deliveryFee}</p>
                    </div>
                  </>
                )}

                <div className="h-10 w-px bg-border hidden md:block"></div>
                <div className="text-right md:text-left bg-primary/10 px-4 py-2 rounded-lg">
                  <p className="text-xs text-primary font-bold uppercase tracking-wider">Total Advance</p>
                  <p className="text-2xl font-heading font-black text-primary">₹{advanceAmount}</p>
                </div>
              </div>

              <Button className="w-full md:w-auto h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl rounded-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                Pay ₹{advanceAmount} & Order
              </Button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
