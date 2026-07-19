import * as React from "react"
import { Save2 } from "iconsax-react"

export type BranchFormData = {
  name: string
  code: string
  address: string
  phone: string
  isActive: boolean
  deliveryEnabled: boolean
}

interface BranchFormProps {
  formData: BranchFormData
  setFormData: React.Dispatch<React.SetStateAction<BranchFormData>>
  onSubmit: (e: React.FormEvent) => void
  isSaving: boolean
}

export function BranchForm({ formData, setFormData, onSubmit, isSaving }: BranchFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-8">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Branch Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Branch Name *</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="e.g., Downtown Store" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Branch Code *</label>
            <input 
              required
              type="text" 
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase" 
              placeholder="e.g., DTN" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Address *</label>
          <textarea 
            required
            rows={3}
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" 
            placeholder="Full branch address" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Contact Number</label>
          <input 
            type="tel" 
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            placeholder="e.g., 9876543210" 
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Settings</h3>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-md">
            <input 
              type="checkbox" 
              id="activeToggle"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="activeToggle" className="text-sm font-semibold text-foreground cursor-pointer">
              Branch is Active (Open)
            </label>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-md">
            <input 
              type="checkbox" 
              id="deliveryToggle"
              checked={formData.deliveryEnabled}
              onChange={e => setFormData({...formData, deliveryEnabled: e.target.checked})}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="deliveryToggle" className="text-sm font-semibold text-foreground cursor-pointer flex flex-col">
              <span>Home Delivery Enabled</span>
              <span className="text-xs text-muted-foreground font-normal">Allow customers to order delivery from this branch.</span>
            </label>
          </div>
        </div>
      </div>

      <div className="pt-6 mt-8 flex gap-3">
        <button 
          type="submit" 
          disabled={isSaving}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : <><Save2 className="w-4 h-4" /> Save Branch</>}
        </button>
      </div>
    </form>
  )
}
