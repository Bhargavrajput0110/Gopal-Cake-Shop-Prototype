import * as React from "react"
import { Save2 } from "iconsax-react"

export type CategoryFormData = {
  name: string
  displayOrder: string
  status: "active" | "inactive"
}

interface CategoryFormProps {
  formData: CategoryFormData
  setFormData: React.Dispatch<React.SetStateAction<CategoryFormData>>
  onSubmit: (e: React.FormEvent) => void
  isSaving: boolean
}

export function CategoryForm({ formData, setFormData, onSubmit, isSaving }: CategoryFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-8">
      
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">General Information</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Category Name *</label>
          <input 
            required
            type="text" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            placeholder="e.g., Birthday Cakes" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Display Order *</label>
          <input 
            required
            type="number" 
            value={formData.displayOrder}
            onChange={e => setFormData({...formData, displayOrder: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
          />
          <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first on the website.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Status</label>
          <select 
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value as any})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer" 
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="pt-6 mt-8 flex gap-3">
        <button 
          type="submit" 
          disabled={isSaving}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : <><Save2 className="w-4 h-4" /> Save Category</>}
        </button>
      </div>
    </form>
  )
}
