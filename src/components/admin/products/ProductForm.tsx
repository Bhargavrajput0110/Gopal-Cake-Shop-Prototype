"use client";

import * as React from "react";
import { 
  Save2, 
  ArrowDown2, 
  Cake, 
  Money4, 
  Layer, 
  Box, 
  Image as ImageIcon, 
  TickCircle, 
  Warning2,
  Camera,
  Brush,
  Scissor,
  InfoCircle
} from "iconsax-react";
import { ProductImageUploader } from "./ProductImageUploader";
import type { Category } from "./ProductFilters";

export type ProductFormData = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  status: "active" | "out_of_stock" | "inactive";
  images: string[];
  weightOptions: string;
  availableFlavors: string;
  isCustomizable: boolean;
  requiredVendors?: string[];
  tier?: "1" | "2" | "3" | "None";
};

interface ProductFormProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  categories: Category[];
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}

const WEIGHT_LIST = [
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
];

const POPULAR_FLAVORS = [
  "Dutch Chocolate",
  "Fresh Vanilla",
  "Butterscotch",
  "Pineapple",
  "Black Forest",
  "Red Velvet",
  "Lotus Biscoff",
  "Strawberry",
  "Rasmalai",
  "Blueberry"
];

const VENDOR_OPTIONS = [
  {
    id: "VENDOR_FLORIST",
    label: "Florist Vendor",
    description: "Requires fresh edible/decorative flowers",
    icon: <Brush className="w-4 h-4 text-pink-600" />,
    badgeColor: "bg-pink-500/10 text-pink-700 border-pink-200 dark:border-pink-900/40"
  },
  {
    id: "VENDOR_PHOTO",
    label: "Photo Print",
    description: "Requires custom edible sugar sheet photo print",
    icon: <Camera className="w-4 h-4 text-blue-600" />,
    badgeColor: "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-900/40"
  },
  {
    id: "VENDOR_ACRYLIC",
    label: "Acrylic Topper",
    description: "Requires custom laser-cut acrylic topper",
    icon: <Scissor className="w-4 h-4 text-purple-600" />,
    badgeColor: "bg-purple-500/10 text-purple-700 border-purple-200 dark:border-purple-900/40"
  }
];

export function ProductForm({
  formData,
  setFormData,
  categories,
  onSubmit,
  isSaving,
}: ProductFormProps) {
  // Parse current weights
  const selectedWeights = React.useMemo(() => {
    if (!formData.weightOptions) return [];
    return formData.weightOptions.split(",").map((s) => s.trim()).filter(Boolean);
  }, [formData.weightOptions]);

  // Parse current flavors
  const selectedFlavors = React.useMemo(() => {
    if (!formData.availableFlavors) return [];
    return formData.availableFlavors.split(",").map((s) => s.trim()).filter(Boolean);
  }, [formData.availableFlavors]);

  // Toggle Weight
  const handleToggleWeight = (weightLabel: string) => {
    let next: string[];
    if (selectedWeights.includes(weightLabel)) {
      next = selectedWeights.filter((w) => w !== weightLabel);
    } else {
      next = [...selectedWeights, weightLabel];
    }

    // Sort by numeric value
    next.sort((a, b) => {
      const getVal = (str: string) => {
        let num = parseFloat(str);
        if (str.includes("g") && !str.includes("kg")) num = num / 1000;
        return num;
      };
      return getVal(a) - getVal(b);
    });

    setFormData((prev) => ({
      ...prev,
      weightOptions: next.join(", "),
    }));
  };

  // Toggle Popular Flavor
  const handleToggleFlavor = (flavor: string) => {
    let next: string[];
    const exists = selectedFlavors.some((f) => f.toLowerCase() === flavor.toLowerCase());
    if (exists) {
      next = selectedFlavors.filter((f) => f.toLowerCase() !== flavor.toLowerCase());
    } else {
      next = [...selectedFlavors, flavor];
    }
    setFormData((prev) => ({
      ...prev,
      availableFlavors: next.join(", "),
    }));
  };

  // Quick select weight presets
  const handleSelectWeightPreset = (preset: "standard" | "all" | "clear") => {
    if (preset === "clear") {
      setFormData((prev) => ({ ...prev, weightOptions: "" }));
      return;
    }
    if (preset === "standard") {
      setFormData((prev) => ({ ...prev, weightOptions: "500g, 1kg" }));
      return;
    }
    if (preset === "all") {
      const tier = formData.tier || "None";
      const available = WEIGHT_LIST.filter((w) => {
        if (tier === "2" && w.val < 1) return false;
        if (tier === "3" && w.val < 2.5) return false;
        return true;
      }).map((w) => w.label);
      setFormData((prev) => ({ ...prev, weightOptions: available.join(", ") }));
    }
  };

  // Toggle Vendor
  const handleToggleVendor = (vendorId: string) => {
    const current = formData.requiredVendors || [];
    let next: string[];
    if (current.includes(vendorId)) {
      next = current.filter((v) => v !== vendorId);
    } else {
      next = [...current, vendorId];
    }
    setFormData((prev) => ({ ...prev, requiredVendors: next }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-8 text-foreground">
      {/* ── Section 1: General Info ─────────────────────────── */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Cake className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Basic Information</h3>
            <p className="text-[11px] text-muted-foreground">Product name and public storefront description</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Product Name *</span>
            <span className="text-[11px] font-normal text-muted-foreground lowercase">displayed on menu</span>
          </label>
          <input
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
            placeholder="e.g. Belgian Chocolate Truffle Cake"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[85px] transition-all placeholder:text-muted-foreground/60 resize-y"
            placeholder="Indulgent Dutch chocolate sponge layered with velvety dark truffle ganache..."
          />
        </div>
      </div>

      {/* ── Section 2: Pricing & Category (Main redesign) ──── */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Money4 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Pricing & Category</h3>
            <p className="text-[11px] text-muted-foreground">Base starting price, category classification & cake tier</p>
          </div>
        </div>

        {/* 2-Column Grid: Price & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Base Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Base Price *</span>
              <span className="text-[11px] font-normal text-muted-foreground">(for 500g / base unit)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm pointer-events-none">
                ₹
              </span>
              <input
                required
                type="number"
                min="0"
                step="any"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                placeholder="450"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Category *
            </label>
            <div className="relative">
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full pl-3.5 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer transition-all"
              >
                <option value="" disabled>Select category</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ArrowDown2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Cake Tier Selector */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Cake Tier Structure</span>
            <span className="text-[11px] font-normal text-muted-foreground">Sets minimum weight limits</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { val: "None", label: "Single Tier", hint: "Standard cakes" },
              { val: "1", label: "1 Tier", hint: "Standard 1 tier" },
              { val: "2", label: "2 Tier", hint: "Min 1.0 kg" },
              { val: "3", label: "3 Tier", hint: "Min 2.5 kg" },
            ].map((t) => {
              const isSelected = (formData.tier || "None") === t.val;
              return (
                <button
                  type="button"
                  key={t.val}
                  onClick={() => {
                    const newTier = t.val as any;
                    let validWeights = formData.weightOptions;
                    if (newTier === "2" || newTier === "3") {
                      // Remove invalid sub-minimum weights
                      const minVal = newTier === "2" ? 1 : 2.5;
                      const filtered = selectedWeights.filter((sw) => {
                        const found = WEIGHT_LIST.find((wl) => wl.label === sw);
                        return found ? found.val >= minVal : true;
                      });
                      validWeights = filtered.join(", ");
                    }
                    setFormData({ ...formData, tier: newTier, weightOptions: validWeights });
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/30"
                      : "border-border bg-background hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.hint}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 3: Available Weights & Flavors ─────────── */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Layer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Available Weights & Flavors</h3>
            <p className="text-[11px] text-muted-foreground">Select portions and flavor variations offered to customers</p>
          </div>
        </div>

        {/* Weights */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Available Weights
            </label>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleSelectWeightPreset("standard")}
                className="text-[11px] px-2 py-0.5 rounded-md bg-secondary/40 text-foreground font-semibold hover:bg-secondary transition-colors"
              >
                500g & 1kg
              </button>
              <button
                type="button"
                onClick={() => handleSelectWeightPreset("all")}
                className="text-[11px] px-2 py-0.5 rounded-md bg-secondary/40 text-foreground font-semibold hover:bg-secondary transition-colors"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleSelectWeightPreset("clear")}
                className="text-[11px] px-2 py-0.5 rounded-md text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Weight Chips */}
          <div className="flex flex-wrap gap-2">
            {WEIGHT_LIST.map((w) => {
              const tier = formData.tier || "None";
              const isRestricted =
                (tier === "2" && w.val < 1) || (tier === "3" && w.val < 2.5);

              if (isRestricted) return null;

              const isSelected = selectedWeights.includes(w.label);

              return (
                <button
                  type="button"
                  key={w.label}
                  onClick={() => handleToggleWeight(w.label)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20 scale-[1.02]"
                      : "bg-background border-border text-foreground hover:bg-muted hover:border-primary/40"
                  }`}
                >
                  {w.label}
                </button>
              );
            })}
          </div>

          {formData.tier && formData.tier !== "None" && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              <InfoCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Weights restricted to {formData.tier} Tier minimums.</span>
            </div>
          )}

          {selectedWeights.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Selected ({selectedWeights.length}):{" "}
              <span className="font-semibold text-foreground">{selectedWeights.join(", ")}</span>
            </p>
          )}
        </div>

        {/* Flavors */}
        <div className="space-y-2.5 pt-2 border-t border-border/60">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Available Flavors</span>
            <span className="text-[11px] font-normal text-muted-foreground lowercase">tap to toggle quick flavors</span>
          </label>

          {/* Quick Click Flavor Chips */}
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_FLAVORS.map((flavor) => {
              const isSelected = selectedFlavors.some(
                (f) => f.toLowerCase() === flavor.toLowerCase()
              );
              return (
                <button
                  type="button"
                  key={flavor}
                  onClick={() => handleToggleFlavor(flavor)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                    isSelected
                      ? "bg-primary/15 text-primary border-primary/40 font-bold"
                      : "bg-background/80 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {isSelected ? "✓ " : "+ "}
                  {flavor}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={formData.availableFlavors}
            onChange={(e) => setFormData({ ...formData, availableFlavors: e.target.value })}
            className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
            placeholder="Custom flavors (comma separated), e.g. Belgian Truffle, Rasmalai Fusion"
          />
        </div>
      </div>

      {/* ── Section 4: Vendors, Customization & Status ───── */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Vendors & Customization</h3>
            <p className="text-[11px] text-muted-foreground">Required external vendor tasks and storefront availability</p>
          </div>
        </div>

        {/* Customizable Design Toggle */}
        <div
          onClick={() => setFormData({ ...formData, isCustomizable: !formData.isCustomizable })}
          className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
            formData.isCustomizable
              ? "bg-primary/10 border-primary/40 shadow-xs"
              : "bg-background border-border hover:bg-muted/40"
          }`}
        >
          <input
            type="checkbox"
            id="customizableToggle"
            checked={formData.isCustomizable}
            onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
          <div className="flex-1">
            <label htmlFor="customizableToggle" className="text-xs font-bold text-foreground cursor-pointer block">
              Enable Custom Design / Photo & Message
            </label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Allows customers to upload photo cake references or add custom celebration messages at checkout.
            </p>
          </div>
        </div>

        {/* Required Vendors as Modern Cards */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Required Vendor Tasks</span>
            <span className="text-[11px] font-normal text-muted-foreground lowercase">auto-notifies vendor portal</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {VENDOR_OPTIONS.map((v) => {
              const isSelected = (formData.requiredVendors || []).includes(v.id);
              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => handleToggleVendor(v.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                      : "border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      {v.icon}
                      <span className="text-xs font-bold text-foreground">{v.label}</span>
                    </div>
                    {isSelected && <TickCircle className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{v.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Status (Active / Out of Stock / Inactive) */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Storefront Visibility
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: "active", label: "Active", dot: "bg-emerald-500", desc: "Live on store" },
              { val: "out_of_stock", label: "Out of Stock", dot: "bg-amber-500", desc: "Sold out tag" },
              { val: "inactive", label: "Draft / Hidden", dot: "bg-neutral-400", desc: "Hidden from site" },
            ].map((s) => {
              const isSelected = formData.status === s.val;
              return (
                <button
                  type="button"
                  key={s.val}
                  onClick={() => setFormData({ ...formData, status: s.val as any })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/30"
                      : "border-border bg-background hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-xs font-bold">{s.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 5: Media & Gallery ─────────────────────── */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Media & Images</h3>
            <p className="text-[11px] text-muted-foreground">Upload or choose high-resolution product imagery from Cloudinary</p>
          </div>
        </div>

        <ProductImageUploader
          images={formData.images}
          onChange={(urls) => setFormData({ ...formData, images: urls })}
        />
      </div>

      {/* ── Actions Footer ─────────────────────────────────── */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur-md pt-4 pb-2 border-t border-border flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 py-3 px-5 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <span>Saving Product...</span>
          ) : (
            <>
              <Save2 className="w-4 h-4" />
              <span>Save Product</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
