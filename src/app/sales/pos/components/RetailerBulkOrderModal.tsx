"use client"

import * as React from "react"
import { useCart } from "@/context/CartContext"
import { Box, CloseCircle, DiscountShape, Shop, Add, Minus, Trash, TickCircle, ArrowLeft, ArrowRight } from "iconsax-react"

interface Retailer {
  id: string
  name: string
  contact: string
  adminDiscountPercent: number
  creditLimit: string
  tier: "Gold" | "Platinum" | "Standard" | "Custom"
}

const DEFAULT_RETAILERS: Retailer[] = [
  { id: "ret-01", name: "Rajesh Bakery & Sweets", contact: "9825011223", adminDiscountPercent: 25, creditLimit: "₹1,50,000", tier: "Platinum" },
  { id: "ret-02", name: "Cafe Monarch & Lounge", contact: "9909988776", adminDiscountPercent: 30, creditLimit: "₹2,00,000", tier: "Platinum" },
  { id: "ret-03", name: "Shakti Event Caterers & Co.", contact: "9876543210", adminDiscountPercent: 20, creditLimit: "₹75,000", tier: "Gold" },
  { id: "ret-04", name: "Gokul Dairy & Snacks (Sayaji Road)", contact: "9426033445", adminDiscountPercent: 35, creditLimit: "₹3,00,000", tier: "Platinum" },
  { id: "ret-05", name: "Royal Food Court (Airport Road)", contact: "9898012345", adminDiscountPercent: 20, creditLimit: "₹1,00,000", tier: "Standard" }
]

interface BulkProduct {
  id: string
  name: string
  category: string
  baseRetailPrice: number
  minBulkOrder: number
  unit: string
}

const BULK_CATALOG: BulkProduct[] = [
  { id: "blk-01", name: "Butterscotch Premium Pastries (Box of 10)", category: "Pastries", baseRetailPrice: 600, minBulkOrder: 5, unit: "Boxes" },
  { id: "blk-02", name: "Black Forest Classic Pastries (Box of 10)", category: "Pastries", baseRetailPrice: 550, minBulkOrder: 5, unit: "Boxes" },
  { id: "blk-03", name: "1kg Dutch Truffle Cake (Standard Wholesale Pack)", category: "Cakes", baseRetailPrice: 850, minBulkOrder: 5, unit: "Cakes" },
  { id: "blk-04", name: "0.5kg Pineapple Delight Cake", category: "Cakes", baseRetailPrice: 450, minBulkOrder: 10, unit: "Cakes" },
  { id: "blk-05", name: "Paneer Puff (Crate of 50 Pcs)", category: "Savouries", baseRetailPrice: 1250, minBulkOrder: 2, unit: "Crates" },
  { id: "blk-06", name: "Cheese Corn Cocktail Puff (Crate of 50 Pcs)", category: "Savouries", baseRetailPrice: 1500, minBulkOrder: 2, unit: "Crates" },
  { id: "blk-07", name: "Gourmet Cookies Variety Cartoons (5 kg Bulk)", category: "Bakery Dry", baseRetailPrice: 2200, minBulkOrder: 1, unit: "Carton" },
]

interface RetailerBulkOrderModalProps {
  onClose: () => void
}

const TIER_COLORS: Record<string, string> = {
  Platinum: "bg-purple-100 text-purple-700 border-purple-200",
  Gold: "bg-amber-100 text-amber-700 border-amber-200",
  Standard: "bg-blue-100 text-blue-700 border-blue-200",
  Custom: "bg-gray-100 text-gray-700 border-gray-200",
}

export function RetailerBulkOrderModal({ onClose }: RetailerBulkOrderModalProps) {
  const { addItem } = useCart()

  // Step: 1 = select retailer, 2 = pick quantities, 3 = confirm/done
  const [step, setStep] = React.useState<1 | 2>(1)

  const [selectedRetailer, setSelectedRetailer] = React.useState<Retailer | null>(null)
  const [isAddingCustom, setIsAddingCustom] = React.useState(false)
  const [customName, setCustomName] = React.useState("")
  const [customDiscount, setCustomDiscount] = React.useState(20)

  const [quantities, setQuantities] = React.useState<Record<string, number>>({})
  const [dispatchDate, setDispatchDate] = React.useState("Tomorrow Morning (6:00 AM Factory Dispatch)")
  const [dispatchNotes, setDispatchNotes] = React.useState("Pack in reusable yellow crates for transport.")
  const [showSuccess, setShowSuccess] = React.useState(false)

  const activeRetailerName = isAddingCustom ? (customName.trim() || "Custom Retailer") : (selectedRetailer?.name || "")
  const activeDiscount = isAddingCustom ? customDiscount : (selectedRetailer?.adminDiscountPercent || 0)

  let grossTotal = 0
  let totalUnits = 0
  Object.entries(quantities).forEach(([prodId, qty]) => {
    if (qty <= 0) return
    const prod = BULK_CATALOG.find(p => p.id === prodId)
    if (prod) { grossTotal += prod.baseRetailPrice * qty; totalUnits += qty }
  })
  const discountAmount = Math.round((grossTotal * activeDiscount) / 100)
  const netPayable = grossTotal - discountAmount

  const handleQtyChange = (id: string, val: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, val) }))
  }

  const handleTransferToCart = () => {
    let addedCount = 0
    Object.entries(quantities).forEach(([prodId, qty]) => {
      if (qty <= 0) return
      const prod = BULK_CATALOG.find(p => p.id === prodId)
      if (prod) {
        const discountedUnitPrice = Math.round(prod.baseRetailPrice * (1 - activeDiscount / 100))
        addItem({
          productId: `b2b-${prod.id}-${Date.now()}`,
          name: `📦 [B2B] ${prod.name} (${activeRetailerName} - ${activeDiscount}% Rate)`,
          price: discountedUnitPrice,
          basePrice: prod.baseRetailPrice,
          quantity: qty,
          weight: 1,
          flavor: `B2B: ${prod.unit} | Dispatch: ${dispatchDate}`,
          notes: `Wholesale: ${activeRetailerName} | ${activeDiscount}% OFF | ${dispatchNotes}`,
        })
        addedCount++
      }
    })
    if (addedCount > 0) {
      setShowSuccess(true)
      setTimeout(() => onClose(), 1600)
    } else {
      alert("Please add quantity for at least one item.")
    }
  }

  const canProceedStep1 = isAddingCustom ? customName.trim().length > 0 : selectedRetailer !== null

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-[2rem] rounded-t-[2rem] max-h-[95vh] flex flex-col shadow-2xl border border-border overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-[var(--brand-deep-rose)]/10 via-amber-500/10 to-amber-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-deep-rose)] text-white flex items-center justify-center shadow-md">
              <Box className="w-5 h-5" variant="Bold" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Warashiya B2B Portal</p>
              <h2 className="text-base font-black font-display text-foreground leading-tight">Retailer Bulk Order</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-all shadow-sm">
            <CloseCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-border shrink-0">
          {[{ n: 1, label: "Select Retailer" }, { n: 2, label: "Add Items" }].map(({ n, label }) => (
            <div
              key={n}
              className={`flex-1 py-2.5 text-center text-[11px] font-black uppercase tracking-wider transition-colors ${
                step === n
                  ? "text-[var(--brand-deep-rose)] border-b-2 border-[var(--brand-deep-rose)] bg-[var(--brand-deep-rose)]/5"
                  : step > n
                  ? "text-emerald-600 bg-emerald-50/50"
                  : "text-muted-foreground"
              }`}
            >
              {step > n ? "✓ " : `${n}. `}{label}
            </div>
          ))}
        </div>

        {/* Step 1: Select Retailer */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-semibold">
              Tap a retailer to select them, then tap <strong>Continue →</strong>
            </p>

            {/* Existing Retailers */}
            {DEFAULT_RETAILERS.map(ret => {
              const isSelected = !isAddingCustom && selectedRetailer?.id === ret.id
              return (
                <div
                  key={ret.id}
                  onClick={() => { setSelectedRetailer(ret); setIsAddingCustom(false) }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
                    isSelected
                      ? "border-[var(--brand-deep-rose)] bg-[var(--brand-deep-rose)]/5 shadow-md ring-2 ring-[var(--brand-deep-rose)]/10"
                      : "border-border bg-white hover:border-primary/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-foreground">{ret.name}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${TIER_COLORS[ret.tier]}`}>
                      {ret.tier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-semibold">Admin Rate:</span>
                    <span className="font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs">
                      ⭐ {ret.adminDiscountPercent}% Wholesale OFF
                    </span>
                  </div>
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-[var(--brand-deep-rose)]/20 text-[11px] font-black text-[var(--brand-deep-rose)] flex items-center gap-1">
                      <TickCircle className="w-4 h-4" variant="Bold" /> Selected — tap Continue below
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add Custom Retailer */}
            <div
              onClick={() => { setIsAddingCustom(true); setSelectedRetailer(null) }}
              className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center active:scale-[0.98] ${
                isAddingCustom
                  ? "border-[var(--brand-deep-rose)] bg-[var(--brand-deep-rose)]/5"
                  : "border-border hover:border-primary/50 bg-white/40 text-muted-foreground hover:bg-muted/20"
              }`}
            >
              <span className={`font-black text-sm ${isAddingCustom ? "text-[var(--brand-deep-rose)]" : ""}`}>
                ➕ Add New / Custom Retailer
              </span>
            </div>

            {/* Custom Retailer Form */}
            {isAddingCustom && (
              <div className="p-4 rounded-2xl bg-white border-2 border-[var(--brand-deep-rose)]/30 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="text-xs font-black text-foreground block mb-1.5">Retailer / Catering Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mahavir Sweets & Bakers"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-[var(--brand-deep-rose)] bg-background text-sm font-bold outline-none transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-foreground block mb-1.5 flex items-center justify-between">
                    <span>Admin Approved Discount (%)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">Manager Rate</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={customDiscount}
                      onChange={e => setCustomDiscount(Math.min(90, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-24 px-3 py-2 rounded-xl border-2 border-emerald-300 bg-white text-xl font-black text-center text-emerald-600 outline-none"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">% OFF Retail Price</span>
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <div className="pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full py-4 rounded-2xl bg-[var(--brand-deep-rose)] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[var(--brand-deep-rose)]/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                Continue — Select Items
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Pick Quantities */}
        {step === 2 && (
          <>
            {/* Selected Retailer Banner */}
            <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between shrink-0">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Ordering for</p>
                <p className="font-black text-sm text-foreground">{activeRetailerName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Wholesale Rate</p>
                <p className="font-black text-lg text-emerald-600">{activeDiscount}% OFF</p>
              </div>
            </div>

            {/* Catalog */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/30">
              {BULK_CATALOG.map(prod => {
                const qty = quantities[prod.id] || 0
                const b2bRate = Math.round(prod.baseRetailPrice * (1 - activeDiscount / 100))
                const step = prod.unit === "Crates" || prod.unit === "Boxes" ? 1 : 5

                return (
                  <div key={prod.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-1.5 py-0.5 rounded">
                            {prod.category}
                          </span>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            Min {prod.minBulkOrder} {prod.unit}
                          </span>
                        </div>
                        <p className="text-sm font-black text-foreground leading-snug">{prod.name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground line-through">₹{prod.baseRetailPrice}</span>
                          <span className="text-sm font-black text-emerald-600">₹{b2bRate}</span>
                          <span className="text-[10px] text-emerald-700 font-bold">per {prod.unit}</span>
                        </div>
                      </div>

                      {/* Qty Control */}
                      <div className="flex items-center border-2 border-border rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, qty - step)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors"
                        >
                          {qty <= 0 ? <Trash className="w-4 h-4 text-muted-foreground opacity-40" /> : <Minus className="w-4 h-4 text-foreground" />}
                        </button>
                        <input
                          type="number"
                          value={qty || ""}
                          placeholder="0"
                          onChange={e => handleQtyChange(prod.id, parseInt(e.target.value) || 0)}
                          className="w-12 text-center text-sm font-black bg-transparent border-none focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, qty + step)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors"
                        >
                          <Add className="w-4 h-4 text-[var(--brand-deep-rose)]" />
                        </button>
                      </div>
                    </div>

                    {qty > 0 && (
                      <div className="mt-2 text-right text-xs font-black text-emerald-600">
                        Line Total: ₹{(b2bRate * qty).toLocaleString('en-IN')} ({qty} {prod.unit})
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Dispatch Notes */}
              <div className="px-4 py-4 space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground block mb-1.5">🚚 Dispatch Schedule</label>
                  <input
                    type="text"
                    value={dispatchDate}
                    onChange={e => setDispatchDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground block mb-1.5">📦 Packing Notes</label>
                  <textarea
                    rows={2}
                    value={dispatchNotes}
                    onChange={e => setDispatchNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-border bg-white resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer Summary + Action */}
            <div className="p-4 border-t border-border bg-white shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
              {totalUnits > 0 && (
                <div className="flex items-center justify-between mb-3 px-1">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{totalUnits} Units</p>
                    <p className="text-xs text-muted-foreground font-semibold line-through">₹{grossTotal.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Savings</p>
                    <p className="text-base font-black text-emerald-600">-₹{discountAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-deep-rose)]">Net Payable</p>
                    <p className="text-2xl font-black text-[var(--brand-deep-rose)]">₹{netPayable.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3.5 rounded-xl border-2 border-border bg-white font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5 hover:bg-muted transition-all active:scale-[0.97]"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleTransferToCart}
                  disabled={totalUnits === 0}
                  className="flex-1 py-3.5 rounded-xl bg-[var(--brand-deep-rose)] text-white font-black text-sm uppercase tracking-wider shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                >
                  🛒 Add to Cart ({totalUnits} units)
                </button>
              </div>
            </div>
          </>
        )}

        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl border border-border animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-emerald-200">
                <TickCircle className="w-12 h-12" variant="Bold" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2">Bulk Order Loaded!</h3>
              <p className="text-sm text-muted-foreground font-medium mb-4">
                <strong>{totalUnits} wholesale items</strong> added to cart with{" "}
                <strong className="text-emerald-600">{activeDiscount}% discount</strong> for{" "}
                <strong>{activeRetailerName}</strong>
              </p>
              <div className="p-3 rounded-xl bg-muted/50 text-xs font-extrabold text-[var(--brand-deep-rose)]">
                Taking you back to POS Terminal...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
