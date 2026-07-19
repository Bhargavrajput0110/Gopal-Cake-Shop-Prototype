"use client"

import * as React from "react"
import { CloseSquare, Gallery, SearchNormal1, DocumentUpload } from "iconsax-react"
import { useCart, CartItem } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"
import { ALL_FLAVOURS } from "@/lib/flavours"

interface ItemConfiguratorModalProps {
  cartItemId: string
  onClose: () => void
}

export function ItemConfiguratorModal({ cartItemId, onClose }: ItemConfiguratorModalProps) {
  const { items: cart, updateItemConfig } = useCart()
  const item = cart.find(i => i.cartItemId === cartItemId)
  
  const [weight, setWeight] = React.useState(item?.weight || 1)
  const [flavor, setFlavor] = React.useState(item?.flavor || "")
  const [messageOnCake, setMessageOnCake] = React.useState(item?.messageOnCake || "")
  const [shape, setShape] = React.useState(item?.shape || "")
  const [boxCount, setBoxCount] = React.useState(item?.boxCount || 1)
  
  // Design Library state
  const [activeTab, setActiveTab] = React.useState<"config" | "design" | "reference">("config")
  const [search, setSearch] = React.useState("")
  
  // Design selection
  const [selectedDesign, setSelectedDesign] = React.useState<any>(
    item?.designId ? { id: item.designId, name: item.designName, code: item.designCode, imageUrl: item.designImageUrl } : null
  )
  
  // Reference Images (max 3)
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

  const handleSave = () => {
    updateItemConfig(cartItemId, {
      weight,
      flavor,
      messageOnCake,
      shape,
      boxCount,
      designId: selectedDesign?.id,
      designName: selectedDesign?.name,
      designCode: selectedDesign?.code,
      designImageUrl: selectedDesign?.imageUrl,
      referenceImages
    })
    onClose()
  }

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    const newImages = [...referenceImages]
    for (let i = 0; i < files.length; i++) {
      if (newImages.length >= 3) {
        alert("Maximum 3 reference images allowed.")
        break
      }
      const file = files[i]
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.")
        continue
      }
      newImages.push(URL.createObjectURL(file))
    }
    setReferenceImages(newImages)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-3xl h-[80vh] flex flex-col rounded-xl border border-border shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
          <h2 className="text-lg font-bold">Configure {item.name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors">
            <CloseSquare className="w-5 h-5" />
          </button>
        </div>
        
        {item.isCustomizable && (
          <div className="flex border-b border-border bg-muted/10">
            <button 
              className={`flex-1 py-3 px-4 font-bold text-sm ${activeTab === 'config' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('config')}
            >
              Cake Config
            </button>
            <button 
              className={`flex-1 py-3 px-4 font-bold text-sm ${activeTab === 'design' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('design')}
            >
              Design Library
            </button>
            <button 
              className={`flex-1 py-3 px-4 font-bold text-sm ${activeTab === 'reference' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('reference')}
            >
              Customer References
            </button>
          </div>
        )}

        <div className="p-4 flex-1 overflow-y-auto">
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-bold">Weight (kg)</label>
                  <input type="number" step="0.5" min="0.5" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-full p-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-bold">Box Count</label>
                  <input type="number" step="1" min="1" value={boxCount} onChange={e => setBoxCount(Number(e.target.value))} className="w-full p-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-bold">Flavor</label>
                  <select value={flavor} onChange={e => setFlavor(e.target.value)} className="w-full p-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Standard Flavor</option>
                    {ALL_FLAVOURS.map((f, index) => (
                      <option key={`${f.id}-${index}`} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-bold">Shape</label>
                  <select value={shape} onChange={e => setShape(e.target.value)} className="w-full p-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Standard Shape</option>
                    <option value="Round">Round</option>
                    <option value="Square">Square</option>
                    <option value="Heart">Heart</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">Message on Cake</label>
                <input type="text" placeholder="e.g. Happy Birthday Aarav" value={messageOnCake} onChange={e => setMessageOnCake(e.target.value)} className="w-full p-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="relative">
                <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search design by name, code, tags..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoadingDesigns ? (
                  <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
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

          {activeTab === 'reference' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 border border-border rounded-xl">
                <h3 className="font-bold text-sm mb-2">Upload Customer References</h3>
                <p className="text-xs text-muted-foreground mb-4">Max 3 images. Allowed formats: JPG, PNG, WEBP. Max size: 5MB.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg border border-border overflow-hidden group">
                      <img src={img} className="w-full h-full object-cover" alt={`Reference ${idx + 1}`} />
                      <button 
                        onClick={() => setReferenceImages(referenceImages.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <CloseSquare className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {referenceImages.length < 3 && (
                    <div className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center relative hover:bg-muted/50 transition-colors">
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleReferenceUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="text-center">
                        <DocumentUpload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                        <span className="text-xs font-bold text-muted-foreground">Upload</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex justify-between gap-2">
          <div>
            {item.isCustomizable && activeTab !== 'config' && (
               <Button variant="outline" onClick={() => setActiveTab('config')}>Back to Config</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} className="font-bold">Save Configuration</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
