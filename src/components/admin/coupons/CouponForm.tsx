import * as React from "react"
import { Save2 } from "iconsax-react"

export type CouponFormData = {
  code: string
  discountType: "FLAT" | "PERCENTAGE"
  discountValue: string
  minOrderValue: string
  maxDiscount: string
  usageLimit: string
  validFrom: string
  validUntil: string
  isActive: boolean
}

interface CouponFormProps {
  formData: CouponFormData
  setFormData: React.Dispatch<React.SetStateAction<CouponFormData>>
  onSubmit: (e: React.FormEvent) => void
  isSaving: boolean
}

export function CouponForm({ formData, setFormData, onSubmit, isSaving }: CouponFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-8">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Coupon Details</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Coupon Code *</label>
          <input 
            required
            type="text" 
            value={formData.code}
            onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase" 
            placeholder="e.g., SUMMER50" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Discount Type *</label>
            <select 
              value={formData.discountType}
              onChange={e => setFormData({...formData, discountType: e.target.value as "FLAT" | "PERCENTAGE"})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer" 
            >
              <option value="FLAT">Flat Amount (₹)</option>
              <option value="PERCENTAGE">Percentage (%)</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Discount Value *</label>
            <input 
              required
              type="number" 
              value={formData.discountValue}
              onChange={e => setFormData({...formData, discountValue: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder={formData.discountType === "FLAT" ? "e.g., 100" : "e.g., 20"} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Min Order Value</label>
            <input 
              type="number" 
              value={formData.minOrderValue}
              onChange={e => setFormData({...formData, minOrderValue: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="e.g., 500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Max Discount</label>
            <input 
              type="number"
              disabled={formData.discountType === "FLAT"} 
              value={formData.discountType === "FLAT" ? "" : formData.maxDiscount}
              onChange={e => setFormData({...formData, maxDiscount: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-muted disabled:text-muted-foreground" 
              placeholder="e.g., 200" 
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Limits & Validity</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Total Usage Limit</label>
          <input 
            type="number" 
            value={formData.usageLimit}
            onChange={e => setFormData({...formData, usageLimit: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            placeholder="Leave empty for unlimited" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Valid From</label>
            <input 
              type="datetime-local" 
              value={formData.validFrom}
              onChange={e => setFormData({...formData, validFrom: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Valid Until</label>
            <input 
              type="datetime-local" 
              value={formData.validUntil}
              onChange={e => setFormData({...formData, validUntil: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 mt-4 bg-muted/30 border border-border rounded-md">
          <input 
            type="checkbox" 
            id="activeToggle"
            checked={formData.isActive}
            onChange={e => setFormData({...formData, isActive: e.target.checked})}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="activeToggle" className="text-sm font-semibold text-foreground cursor-pointer">
            Coupon is Active
          </label>
        </div>
      </div>

      <div className="pt-6 mt-8 flex gap-3">
        <button 
          type="submit" 
          disabled={isSaving}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : <><Save2 className="w-4 h-4" /> Save Coupon</>}
        </button>
      </div>
    </form>
  )
}
