'use client'

import * as React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MediaGallery } from "@/components/admin/media/MediaGallery"
import { Button } from "@/components/ui/button"
import { Gallery, CloseSquare } from "iconsax-react"

export interface CakeBuilderData {
  productId: string
  weight: number
  flavor: string
  shape: string
  theme: string
  messageOnCake: string
  notes: string
  referenceImages: string[]
}

interface CakeBuilderProps {
  initialData?: Partial<CakeBuilderData>
  onChange: (data: CakeBuilderData) => void
  allowMediaUpload?: boolean // False for POS, True for Sales/Admin/Web
}

export function CakeBuilder({ initialData, onChange, allowMediaUpload = true }: CakeBuilderProps) {
  const [data, setData] = useState<CakeBuilderData>({
    productId: initialData?.productId || '',
    weight: initialData?.weight || 1,
    flavor: initialData?.flavor || '',
    shape: initialData?.shape || 'Round',
    theme: initialData?.theme || '',
    messageOnCake: initialData?.messageOnCake || '',
    notes: initialData?.notes || '',
    referenceImages: initialData?.referenceImages || []
  })

  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  // Notify parent on any internal state change
  useEffect(() => {
    onChange(data)
  }, [data]) // intentionally omitting onChange from deps to avoid loop if not memoized

  const handleChange = (field: keyof CakeBuilderData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const handleSelectImage = (url: string) => {
    if (!data.referenceImages.includes(url)) {
      handleChange('referenceImages', [...data.referenceImages, url])
    }
    setIsGalleryOpen(false)
  }

  const handleRemoveImage = (index: number) => {
    const newImages = data.referenceImages.filter((_, i) => i !== index)
    handleChange('referenceImages', newImages)
  }

  return (
    <div className="space-y-6 bg-card border rounded-lg p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-bold">Cake Builder</h3>
        <p className="text-sm text-muted-foreground">Configure the cake specifics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mock Product Selection. In a real app, this would be a Dropdown fetching from API */}
        <div className="space-y-2">
          <Label>Base Product / Cake Design ID</Label>
          <Input 
            value={data.productId} 
            onChange={(e) => handleChange('productId', e.target.value)} 
            placeholder="e.g. prod_123"
          />
        </div>

        <div className="space-y-2">
          <Label>Weight (KG)</Label>
          <Input 
            type="number" 
            min="0.5" 
            step="0.5" 
            value={data.weight} 
            onChange={(e) => handleChange('weight', parseFloat(e.target.value))} 
          />
        </div>

        <div className="space-y-2">
          <Label>Flavor</Label>
          <Input 
            value={data.flavor} 
            onChange={(e) => handleChange('flavor', e.target.value)} 
            placeholder="e.g. Chocolate Truffle"
          />
        </div>

        <div className="space-y-2">
          <Label>Shape</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={data.shape}
            onChange={(e) => handleChange('shape', e.target.value)}
          >
            <option value="Round">Round</option>
            <option value="Square">Square</option>
            <option value="Heart">Heart</option>
            <option value="Custom">Custom / 3D</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Theme</Label>
          <Input 
            value={data.theme} 
            onChange={(e) => handleChange('theme', e.target.value)} 
            placeholder="e.g. Spiderman, Anniversary"
          />
        </div>

        <div className="space-y-2">
          <Label>Message on Cake</Label>
          <Input 
            value={data.messageOnCake} 
            onChange={(e) => handleChange('messageOnCake', e.target.value)} 
            placeholder="e.g. Happy Birthday Aarav"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Internal / Preparation Notes</Label>
        <Textarea 
          value={data.notes} 
          onChange={(e) => handleChange('notes', e.target.value)} 
          placeholder="e.g. Less sugar, strict vegetarian, avoid nuts."
          rows={3}
        />
      </div>

      {allowMediaUpload && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <Label>Customer Reference Images</Label>
              <p className="text-xs text-muted-foreground">Upload Pinterest images, sketches, etc. Visible to Chef only.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsGalleryOpen(!isGalleryOpen)}>
              <Gallery className="w-4 h-4 mr-2" />
              {isGalleryOpen ? 'Close Gallery' : 'Add Image'}
            </Button>
          </div>

          {isGalleryOpen && (
            <div className="p-4 border rounded-lg bg-secondary/10">
              <MediaGallery 
                onSelect={handleSelectImage} 
                selectable={true} 
                folder="gopal-cakes/references" 
              />
            </div>
          )}

          {data.referenceImages.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {data.referenceImages.map((url, idx) => (
                <div key={idx} className="relative group rounded-md border overflow-hidden aspect-square">
                  <img src={url} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <CloseSquare className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
