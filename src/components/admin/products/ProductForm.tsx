import * as React from "react"
import { Save2 } from "iconsax-react"
import { ProductImageUploader } from "./ProductImageUploader"
import type { Category } from "./ProductFilters"

export type ProductFormData = {
  name: string
  description: string
  price: string
  categoryId: string
  status: "active" | "out_of_stock" | "inactive"
  images: string[]
  weightOptions: string
  availableFlavors: string
  isCustomizable: boolean
  requiredVendors?: string[]
  tier?: "1" | "2" | "3" | "None"
}

interface ProductFormProps {
  formData: ProductFormData
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
  categories: Category[]
  onSubmit: (e: React.FormEvent) => void
  isSaving: boolean
}

export function ProductForm({ formData, setFormData, categories, onSubmit, isSaving }: ProductFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-8">
      {/* General Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">General Information</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Product Name *</label>
          <input 
            required
            type="text" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            placeholder="e.g., Chocolate Truffle" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Description</label>
          <textarea 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]" 
            placeholder="Rich chocolate cake layered with..." 
          />
        </div>
      </div>

      {/* Pricing & Category */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Pricing & Category</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Price (₹) *</label>
            <input 
              required
              type="number" 
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Category *</label>
            <select 
              required
              value={formData.categoryId}
              onChange={e => setFormData({...formData, categoryId: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer" 
            >
              <option value="" disabled>Select a category</option>
              {categories.map(c => (
                <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Cake Tier</label>
            <select 
              value={formData.tier || "None"}
              onChange={e => {
                const newTier = e.target.value as any;
                // Auto-clear invalid weights when tier changes
                let validWeights = formData.weightOptions;
                if (newTier === "2" || newTier === "3") {
                  validWeights = ""; // Just reset for simplicity to prevent invalid weights
                }
                setFormData({...formData, tier: newTier, weightOptions: validWeights});
              }}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer" 
            >
              <option value="None">Not a Tiered Cake</option>
              <option value="1">1 Tier</option>
              <option value="2">2 Tier (Min 1kg)</option>
              <option value="3">3 Tier (Min 2.5kg)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attributes & Availability */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Attributes & Availability</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Available Weights</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: "250g", val: 0.25 },
              { label: "500g", val: 0.5 },
              { label: "750g", val: 0.75 },
              { label: "1kg", val: 1 },
              { label: "1.5kg", val: 1.5 },
              { label: "2kg", val: 2 },
              { label: "2.5kg", val: 2.5 },
              { label: "3kg", val: 3 },
              { label: "4kg", val: 4 },
              { label: "5kg", val: 5 },
            ].map(w => {
              // Logic for tier constraints
              const tier = formData.tier || "None";
              if (tier === "2" && w.val < 1) return null; // 2 tier minimum 1kg
              if (tier === "3" && w.val < 2.5) return null; // 3 tier minimum 2.5kg

              const selectedWeights = formData.weightOptions ? formData.weightOptions.split(",").map(s => s.trim()) : [];
              const isSelected = selectedWeights.includes(w.label);

              return (
                <button
                  type="button"
                  key={w.label}
                  onClick={() => {
                    let newWeights = [...selectedWeights];
                    if (isSelected) {
                      newWeights = newWeights.filter(sw => sw !== w.label);
                    } else {
                      newWeights.push(w.label);
                    }
                    // Sort weights properly by value
                    const sortedLabels = newWeights.sort((a, b) => {
                      const getVal = (str: string) => {
                        let num = parseFloat(str);
                        if (str.includes("g") && !str.includes("kg")) num = num / 1000;
                        return num;
                      };
                      return getVal(a) - getVal(b);
                    });
                    setFormData({ ...formData, weightOptions: sortedLabels.join(", ") });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isSelected ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background border-border text-foreground hover:bg-muted'}`}
                >
                  {w.label}
                </button>
              )
            })}
          </div>
          {formData.tier && formData.tier !== "None" && (
            <p className="text-xs text-muted-foreground mt-2">
              Weights are restricted based on {formData.tier} Tier minimums.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Available Flavors (Comma Separated)</label>
          <input 
            type="text" 
            value={formData.availableFlavors}
            onChange={e => setFormData({...formData, availableFlavors: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            placeholder="e.g., Vanilla, Chocolate, Butterscotch" 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-md h-[72px]">
            <input 
              type="checkbox" 
              id="customizableToggle"
              checked={formData.isCustomizable}
              onChange={e => setFormData({...formData, isCustomizable: e.target.checked})}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="customizableToggle" className="text-sm font-semibold text-foreground cursor-pointer">
              Is Customizable? (Design Library)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Status</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer h-[40px]" 
            >
              <option value="active">Active</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex justify-between">
              <span>Required Vendors</span>
              <span className="text-xs text-muted-foreground font-normal">Hold Ctrl/Cmd to select multiple</span>
            </label>
            <select 
              multiple
              value={formData.requiredVendors || []}
              onChange={e => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({...formData, requiredVendors: values});
              }}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer h-[80px]" 
            >
              <option value="VENDOR_FLORIST">Florist</option>
              <option value="VENDOR_PHOTO">Photo Print</option>
              <option value="VENDOR_ACRYLIC">Acrylic Topper</option>
            </select>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Media</h3>
        <ProductImageUploader 
          images={formData.images}
          onChange={(urls) => setFormData({...formData, images: urls})}
        />
      </div>

      {/* Actions */}
      <div className="pt-6 mt-8 flex gap-3">
        <button 
          type="submit" 
          disabled={isSaving}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : <><Save2 className="w-4 h-4" /> Save Product</>}
        </button>
      </div>
    </form>
  )
}
