import * as React from "react"
import { Save2 } from "iconsax-react"

export type CustomerFormData = {
  name: string
  phone: string
  email: string
  address: string
  isActive: boolean
}

interface CustomerFormProps {
  formData: CustomerFormData
  setFormData: React.Dispatch<React.SetStateAction<CustomerFormData>>
  onSubmit: (e: React.FormEvent) => void
  isSaving: boolean
}

export function CustomerForm({ formData, setFormData, onSubmit, isSaving }: CustomerFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-8">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Customer Details</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Customer Name *</label>
          <input 
            required
            type="text" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            placeholder="e.g., John Doe" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Phone *</label>
            <input 
              required
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="e.g., 9876543210" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Email</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="e.g., john@example.com" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Address</label>
          <textarea 
            rows={3}
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" 
            placeholder="Full delivery address" 
          />
        </div>

        <div className="flex items-center gap-3 p-3 mt-4 bg-muted/30 border border-border rounded-md">
          <input 
            type="checkbox" 
            id="activeToggle"
            checked={formData.isActive}
            onChange={e => setFormData({...formData, isActive: e.target.checked})}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="activeToggle" className="text-sm font-semibold text-foreground cursor-pointer flex flex-col">
            <span>Customer is Active</span>
            <span className="text-xs text-muted-foreground font-normal">Unchecking will deactivate the customer, preserving history.</span>
          </label>
        </div>
      </div>

      <div className="pt-6 mt-8 flex gap-3">
        <button 
          type="submit" 
          disabled={isSaving}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : <><Save2 className="w-4 h-4" /> Save Customer</>}
        </button>
      </div>
    </form>
  )
}
