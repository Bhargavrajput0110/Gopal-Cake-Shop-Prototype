'use client'

import * as React from "react"
import { useState } from "react"
import { MediaGallery } from "@/components/admin/media/MediaGallery"
import { Button } from "@/components/ui/button"
import { CloseSquare, Gallery } from "iconsax-react"

interface ProductImageUploaderProps {
  images: string[]
  onChange: (urls: string[]) => void
}

export function ProductImageUploader({ images, onChange }: ProductImageUploaderProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  const handleSelect = (url: string) => {
    if (!images.includes(url)) {
      onChange([...images, url])
    }
    setIsGalleryOpen(false)
  }

  const handleRemove = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">Product Images (Optional)</label>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsGalleryOpen(!isGalleryOpen)}>
          <Gallery className="w-4 h-4 mr-2" />
          {isGalleryOpen ? 'Close Gallery' : 'Open Media Gallery'}
        </Button>
      </div>

      {isGalleryOpen && (
        <div className="border rounded-xl p-4 bg-secondary/10">
          <MediaGallery onSelect={handleSelect} selectable={true} folder="gopal-cakes/products" />
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {images.map((url, idx) => (
            <div key={idx} className="relative group rounded-md border overflow-hidden aspect-square">
              <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <CloseSquare className="w-4 h-4" />
              </button>
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] uppercase font-bold text-center py-1">
                  Cover Image
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {images.length === 0 && !isGalleryOpen && (
        <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-secondary/20">
          <Gallery className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No images selected</p>
          <Button type="button" variant="link" onClick={() => setIsGalleryOpen(true)}>
            Browse Media Gallery
          </Button>
        </div>
      )}
    </div>
  )
}
