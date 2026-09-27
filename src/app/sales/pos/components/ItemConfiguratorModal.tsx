"use client"

import * as React from "react"
import { CloseSquare, SearchNormal1 } from "iconsax-react"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"
import { ALL_FLAVOURS, getFlavourSurcharge } from "@/lib/flavours"
import CloudinaryUploader from "@/components/ui/CloudinaryUploader"

interface ItemConfiguratorModalProps {
  cartItemId: string
  onClose: () => void
}

export function ItemConfiguratorModal({ cartItemId, onClose }: ItemConfiguratorModalProps) {
  const { items: cart, updateItemConfig } = useCart()
  const item = cart.find(i => i.cartItemId === cartItemId)

  // Base price per kg — used to auto-recalculate when weight changes
  const basePricePerKg = React.useRef<number>(
    (item?.price || 0) / (parseFloat(String(item?.weight || 1)) || 1)
  )

  const [price, setPrice] = React.useState<number>(item?.price || 0)
  const [weight, setWeight] = React.useState<string>(String(item?.weight || 1))
  const [flavor, setFlavor] = React.useState(item?.flavor || "")
  const [messageOnCake, setMessageOnCake] = React.useState(item?.messageOnCake || "")
  const [requiredVendors, setRequiredVendors] = React.useState<string[]>(item?.requiredVendors || [])

  // Design Library state
  const [activeTab, setActiveTab] = React.useState<"config" | "design" | "reference">("config")
  const [search, setSearch] = React.useState("")

  // Design selection
  const [selectedDesign, setSelectedDesign] = React.useState<any>(
    item?.designId ? { id: item.designId, name: item.designName, code: item.designCode, imageUrl: item.designImageUrl } : null
  )

  // Reference Images (max 8)
  const [referenceImages, setReferenceImages] = React.useState<string[]>(item?.referenceImages || [])

  const { data: designsPayload, isLoading: isLoadingDesigns } = useQuery({
    queryKey: ['pos-designs', search],
    queryFn: async () => {
      const res = await fetchClient<any>(`/designs?search=${search}`)
      return res.data || { items: [] }
    },
    enabled: activeTab === 'design'
  })

  if (!item) return null

  // When weight changes → auto-recalculate price based on price-per-kg
  const handleWeightChange = (val: string) => {
    setWeight(val)
    const w = parseFloat(val)
    if (w > 0 && basePricePerKg.current > 0) {
      setPrice(Math.round(basePricePerKg.current * w))
    }
  }

  // If staff manually sets price → update basePricePerKg so future weight changes stay proportional
  const handlePriceChange = (val: number) => {
    setPrice(val)
    const w = parseFloat(weight) || 1
    if (w > 0) basePricePerKg.current = val / w
  }

  const [flavorError, setFlavorError] = React.useState(false)

  const handleSave = () => {
    if (!flavor) {
      setFlavorError(true)
      setActiveTab("config")
      return
    }
    updateItemConfig(cartItemId, {
      price,
      weight: parseFloat(weight) || 1,
      flavor,
      messageOnCake,
      shape: "",
      boxCount: 1,
      designId: selectedDesign?.id,
      designName: selectedDesign?.name,
      designCode: selectedDesign?.code,
      designImageUrl: selectedDesign?.imageUrl,
      referenceImages,
      requiredVendors
    })
    onClose()
  }

  const flavourSurcharge = flavor ? getFlavourSurcharge(flavor, parseFloat(weight) || 1) : 0
  const totalPrice = price + flavourSurcharge

  return (
    // z-[200] ensures modal sits above the cart bottom bar (which uses z-50)
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col">
      <div className="flex-1 flex flex-col bg-card w-full max-w-3xl mx-auto my-auto max-h-[92dvh] rounded-xl border border-border shadow-xl animate-in fade-in zoom-in duration-200 overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold">{item.name}</h2>
            <p className="text-xs text-muted-foreground">Configure this item</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors">
            <CloseSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs (only for customizable items) */}
        {item.isCustomizable && (
          <div className="flex border-b border-border bg-muted/10 shrink-0">
            {(["config", "design", "reference"] as const).map(tab => (
              <button
                key={tab}
                className={`flex-1 py-2.5 px-3 font-bold text-xs uppercase tracking-wide ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "config" ? "Config" : tab === "design" ? "Design" : "References"}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* ── CONFIG TAB ── */}
          {activeTab === 'config' && (
            <div className="space-y-4">

              {/* Price + Weight side by side */}
              <div className="flex gap-3">
                {/* Custom Price */}
                <div className="flex-1 space-y-1.5 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                  <label className="text-xs font-bold text-amber-900 block">Custom Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={price || ''}
                    onChange={e => handlePriceChange(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="Agreed price..."
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-lg font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-[10px] text-amber-700">₹{basePricePerKg.current.toFixed(0)}/kg</p>
                </div>

                {/* Weight */}
                <div className="flex-1 space-y-1.5 bg-background border border-input p-3 rounded-xl">
                  <label className="text-xs font-bold block">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={weight}
                    onFocus={e => { if (e.target.value === '1') setWeight('') }}
                    onBlur={e => { if (!e.target.value || parseFloat(e.target.value) <= 0) { setWeight('1'); handleWeightChange('1') } }}
                    onChange={e => handleWeightChange(e.target.value)}
                    className="w-full p-2 bg-background border border-input rounded-lg text-lg font-black focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <p className="text-[10px] text-muted-foreground">Changes price automatically</p>
                </div>
              </div>

              {/* Flavor only */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-rose-600">Flavor *</label>
                <select
                  value={flavor}
                  onChange={e => { setFlavor(e.target.value); setFlavorError(false); }}
                  className={`w-full p-2.5 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${flavorError ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-input'}`}
                >
                  <option value="" disabled>Select a Flavor (Required)</option>
                  {ALL_FLAVOURS.map((f, i) => (
                    <option key={`${f.id}-${i}`} value={f.name}>
                      {f.name} {f.surchargePerHalfKg ? `(+₹${f.surchargePerHalfKg}/500g)` : ""}
                    </option>
                  ))}
                </select>
                {flavorError && <p className="text-[10px] text-rose-600 font-bold">Please select a flavor before adding to cart.</p>}
              </div>

              {/* Message on Cake */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold">Message on Cake</label>
                <input
                  type="text"
                  placeholder="e.g. Happy Birthday Aarav"
                  value={messageOnCake}
                  onChange={e => setMessageOnCake(e.target.value)}
                  className="w-full p-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Required Vendors (custom items only) */}
              {item.isCustomizable && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <label className="text-sm font-bold">Required Vendors</label>
                  <p className="text-xs text-muted-foreground">External dependencies for this custom cake.</p>
                  <div className="flex gap-4 flex-wrap">
                    {[
                      { id: "VENDOR_FLORIST", label: "🌸 Florist" },
                      { id: "VENDOR_ACRYLIC", label: "🔷 Acrylic Toppers" },
                      { id: "VENDOR_PHOTO", label: "📷 Photo Prints" }
                    ].map(v => (
                      <label key={v.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requiredVendors.includes(v.id)}
                          onChange={e => {
                            if (e.target.checked) setRequiredVendors([...requiredVendors, v.id])
                            else setRequiredVendors(requiredVendors.filter(id => id !== v.id))
                          }}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                        {v.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DESIGN TAB ── */}
          {activeTab === 'design' && (
            <div className="space-y-4 flex flex-col h-full">
              <div className="relative">
                <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search design by name, code, tags..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {isLoadingDesigns ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedDesign && (
                      <div className="col-span-full mb-2 flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <img src={selectedDesign.imageUrl} className="w-10 h-10 object-cover rounded" alt="Selected" />
                          <div>
                            <p className="font-bold text-primary text-sm">{selectedDesign.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">{selectedDesign.code}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedDesign(null)}>Clear</Button>
                      </div>
                    )}
                    {designsPayload?.items?.map((design: any) => (
                      <div
                        key={design.id}
                        onClick={() => setSelectedDesign(design)}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedDesign?.id === design.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                      >
                        <div className="aspect-square bg-muted">
                          <img src={design.imageUrl} className="w-full h-full object-cover" alt={design.name} />
                        </div>
                        <div className="p-2 bg-card">
                          <p className="font-bold text-xs truncate">{design.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{design.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── REFERENCE TAB ── */}
          {activeTab === 'reference' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 border border-border rounded-xl">
                <h3 className="font-bold text-sm mb-1">Upload Customer References</h3>
                <p className="text-xs text-muted-foreground mb-4">Max 8 images. Uploaded securely to Cloudinary.</p>
                <CloudinaryUploader
                  existingImages={referenceImages}
                  maxFiles={8}
                  onUploadSuccess={(urls) => setReferenceImages(urls)}
                  folder="gopal-cakes/references"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── STICKY FOOTER ── */}
        <div className="p-4 border-t border-border bg-muted/20 shrink-0 space-y-3">
          {/* Price summary */}
          <div className="flex items-center justify-between bg-background border border-border rounded-xl px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Base Price</p>
              <p className="font-bold">₹{price.toLocaleString('en-IN')}</p>
            </div>
            {flavourSurcharge > 0 && (
              <div className="text-right">
                <p className="text-xs text-primary">Flavour Surcharge</p>
                <p className="font-bold text-primary">+₹{flavourSurcharge.toLocaleString('en-IN')}</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-black text-primary">₹{totalPrice.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {item.isCustomizable && activeTab !== 'config' && (
              <Button variant="outline" className="shrink-0" onClick={() => setActiveTab('config')}>← Config</Button>
            )}
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} className="flex-1 font-bold bg-primary text-white">
              ✓ Add to Cart
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
