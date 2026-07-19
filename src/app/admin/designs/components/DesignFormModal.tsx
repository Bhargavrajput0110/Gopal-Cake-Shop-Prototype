"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Save2 } from "iconsax-react"

export function DesignFormModal({ isOpen, onClose, initialData, categories }: any) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = React.useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    categoryIds: initialData?.categories?.map((c: any) => c.categoryId) || [],
    tags: initialData?.tags?.join(", ") || "",
    themes: initialData?.themes?.join(", ") || "",
    colours: initialData?.colours?.join(", ") || "",
    occasions: initialData?.occasions?.join(", ") || "",
    status: initialData?.status || "ACTIVE",
    recommendedTier: initialData?.recommendedTier || null
  })

  // Basic Image Upload placeholder simulating a new blob URL generation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, upload to Vercel Blob / S3 and get the new URL here.
      // For V1 simulation, we use a local object URL to represent the new "blob"
      // Note: This ensures replacing the image generates a NEW url, preserving KDS snapshot URLs.
      const fakeUploadedUrl = URL.createObjectURL(file)
      setFormData({ ...formData, imageUrl: fakeUploadedUrl })
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map((s: string) => s.trim()).filter(Boolean),
        themes: formData.themes.split(',').map((s: string) => s.trim()).filter(Boolean),
        colours: formData.colours.split(',').map((s: string) => s.trim()).filter(Boolean),
        occasions: formData.occasions.split(',').map((s: string) => s.trim()).filter(Boolean),
        currentUpdatedAt: initialData?.updatedAt
      }
      
      if (initialData?.id) {
        return fetchClient(`/designs/${initialData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        })
      } else {
        return fetchClient(`/designs`, {
          method: "POST",
          body: JSON.stringify(payload)
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-designs'] })
      onClose()
    }
  })

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{initialData ? "Edit Design" : "Upload Design"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Design Image *</label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                required={!initialData}
              />
              {formData.imageUrl ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Replace Image</span>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <p className="text-sm font-bold text-foreground">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">Generates a new image URL for history</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Design Name *</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary/50" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Assign to Category *</label>
            <select
              required
              value={formData.categoryIds[0] || ""}
              onChange={e => setFormData({...formData, categoryIds: e.target.value ? [e.target.value] : []})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary/50"
            >
              <option value="" disabled>Select a Category</option>
              {categories.map((c: any) => (
                <option key={c.categoryId || c.id} value={c.categoryId || c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Cake Tier Category *</label>
            <select
              required
              value={formData.recommendedTier ?? ""}
              onChange={e => setFormData({...formData, recommendedTier: e.target.value ? parseInt(e.target.value) : null})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              <option value="" disabled>Select Cake Tier</option>
              <option value="1">1 Tier</option>
              <option value="2">2 Tier</option>
              <option value="3">3 Tier</option>
              <option value="0">Any / Not Tiered</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Tags (Comma Separated)</label>
            <input 
              type="text" 
              placeholder="e.g. superhero, kids, fondant"
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary/50" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold">Themes (Comma Separated)</label>
            <input 
              type="text" 
              placeholder="e.g. marvel, floral"
              value={formData.themes}
              onChange={e => setFormData({...formData, themes: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary/50" 
            />
          </div>

          <Button type="submit" className="w-full font-bold" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : <><Save2 className="w-4 h-4 mr-2" /> Save Design</>}
          </Button>
          
          {saveMutation.isError && (
            <p className="text-sm text-destructive font-bold text-center mt-2">
              {(saveMutation.error as any).message || "An error occurred"}
            </p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  )
}
