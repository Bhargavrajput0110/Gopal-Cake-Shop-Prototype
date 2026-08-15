"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Save2 } from "iconsax-react"
import { WeightPriceConfigurator } from "./WeightPriceConfigurator"
import CloudinaryUploader from "@/components/ui/CloudinaryUploader"

// 62 Starter Categories from Gopal Cake Shop catalog for guaranteed UI population
const DEFAULT_62_CATEGORIES = [
  { categoryId: 'mom-cake', name: 'Mom Cake', slug: 'mom-cake' },
  { categoryId: 'women-cake', name: 'Women Cake', slug: 'women-cake' },
  { categoryId: 'baby-shower-cake', name: 'Baby Shower Cake', slug: 'baby-shower-cake' },
  { categoryId: 'welcome-baby-cake', name: 'Welcome Baby Cake', slug: 'welcome-baby-cake' },
  { categoryId: 'dad-cake', name: 'Dad Cake', slug: 'dad-cake' },
  { categoryId: 'men-cake', name: 'Men Cake', slug: 'men-cake' },
  { categoryId: 'boys-cake', name: 'Boys Cake', slug: 'boys-cake' },
  { categoryId: 'girls-cake', name: 'Girls Cake', slug: 'girls-cake' },
  { categoryId: 'fresh-flower-cake', name: 'Fresh Flower Cake', slug: 'fresh-flower-cake' },
  { categoryId: '1st-birthday-cake', name: '1st Birthday Cake', slug: '1st-birthday-cake' },
  { categoryId: '5th-birthday-cake', name: '5th Birthday Cake', slug: '5th-birthday-cake' },
  { categoryId: '13th-birthday-cake', name: '13th Birthday Cake', slug: '13th-birthday-cake' },
  { categoryId: 'rice-paper-cake', name: 'Rice Paper Cake', slug: 'rice-paper-cake' },
  { categoryId: 'isomalt-cake', name: 'Isomalt Cake', slug: 'isomalt-cake' },
  { categoryId: 'king-cake', name: 'King Cake', slug: 'king-cake' },
  { categoryId: 'cricket-cake', name: 'Cricket Cake', slug: 'cricket-cake' },
  { categoryId: 'football-cake', name: 'Football Cake', slug: 'football-cake' },
  { categoryId: 'teddy-cake', name: 'Teddy Cake', slug: 'teddy-cake' },
  { categoryId: 'jungle-cake', name: 'Jungle Cake', slug: 'jungle-cake' },
  { categoryId: 'rainbow-cake', name: 'Rainbow Cake', slug: 'rainbow-cake' },
  { categoryId: 'anniversary-cake', name: 'Anniversary Cake', slug: 'anniversary-cake' },
  { categoryId: '25th-anniversary-cake', name: '25th Anniversary Cake', slug: '25th-anniversary-cake' },
  { categoryId: 'bento-cake', name: 'Bento Cake', slug: 'bento-cake' },
  { categoryId: 'for-men', name: 'For Men', slug: 'for-men' },
  { categoryId: 'for-women', name: 'For Women', slug: 'for-women' },
  { categoryId: 'for-anniversary', name: 'For Anniversary', slug: 'for-anniversary' },
  { categoryId: 'couple-cake', name: 'Couple Cake', slug: 'couple-cake' },
  { categoryId: 'love-theme-cake', name: 'Love Theme Cake', slug: 'love-theme-cake' },
  { categoryId: 'unicorn-cake', name: 'Unicorn Cake', slug: 'unicorn-cake' },
  { categoryId: 'butterfly-cake', name: 'Butterfly Cake', slug: 'butterfly-cake' },
  { categoryId: 'kpop-demon-hunters-cake', name: 'KPop Demon Hunters Cake', slug: 'kpop-demon-hunters-cake' },
  { categoryId: 'fruit-cake', name: 'Fruit Cake', slug: 'fruit-cake' },
  { categoryId: 'super-mario-cake', name: 'Super Mario Cake', slug: 'super-mario-cake' },
  { categoryId: 'bow-cake', name: 'Bow Cake', slug: 'bow-cake' },
  { categoryId: 'starbucks-cake', name: 'Starbucks Cake', slug: 'starbucks-cake' },
  { categoryId: 'pinata-cake', name: 'Pinata Cake', slug: 'pinata-cake' },
  { categoryId: 'boss-baby-cake', name: 'Boss Baby Cake', slug: 'boss-baby-cake' },
  { categoryId: 'wife-cake', name: 'Wife Cake', slug: 'wife-cake' },
  { categoryId: 'astronaut-cake', name: 'Astronaut Cake', slug: 'astronaut-cake' },
  { categoryId: 'hamper-cake', name: 'Hamper Cake', slug: 'hamper-cake' },
  { categoryId: 'mickey-mouse-cake', name: 'Mickey Mouse Cake', slug: 'mickey-mouse-cake' },
  { categoryId: 'army-cake', name: 'Army Cake', slug: 'army-cake' },
  { categoryId: 'spiderman-cake', name: 'Spiderman Cake', slug: 'spiderman-cake' },
  { categoryId: '50th-anniversary-cake', name: '50th Anniversary Cake', slug: '50th-anniversary-cake' },
  { categoryId: 'graduation-cake', name: 'Graduation Cake', slug: 'graduation-cake' },
  { categoryId: 'corporate-cake', name: 'Corporate Cake', slug: 'corporate-cake' },
  { categoryId: 'doctor-cake', name: 'Doctor Cake', slug: 'doctor-cake' },
  { categoryId: 'bike-cake', name: 'Bike Cake', slug: 'bike-cake' },
  { categoryId: 'car-cake', name: 'Car Cake', slug: 'car-cake' },
  { categoryId: 'top-forward-cake', name: 'Top Forward Cake', slug: 'top-forward-cake' },
  { categoryId: 'levitating-cake', name: 'Levitating Cake', slug: 'levitating-cake' },
  { categoryId: 'mcqueen-cake', name: 'McQueen Cake', slug: 'mcqueen-cake' },
  { categoryId: 'dinosaur-cake', name: 'Dinosaur Cake', slug: 'dinosaur-cake' },
  { categoryId: 'engagement-cake', name: 'Engagement Cake', slug: 'engagement-cake' },
  { categoryId: 'harry-potter-cake', name: 'Harry Potter Cake', slug: 'harry-potter-cake' },
  { categoryId: 'evil-eye-cake', name: 'Evil Eye Cake', slug: 'evil-eye-cake' },
  { categoryId: 'hot-wheels-cake', name: 'Hot Wheels Cake', slug: 'hot-wheels-cake' },
  { categoryId: 'jcb-cake', name: 'JCB Cake', slug: 'jcb-cake' },
  { categoryId: 'cocomelon-cake', name: 'Cocomelon Cake', slug: 'cocomelon-cake' },
  { categoryId: 'batman-cake', name: 'Batman Cake', slug: 'batman-cake' },
  { categoryId: 'avengers-cake', name: 'Avengers Cake', slug: 'avengers-cake' },
  { categoryId: 'vintage-photos-cake', name: 'Vintage Photos Cake', slug: 'vintage-photos-cake' },
  { categoryId: 'alcohol-bottle-themed-cake', name: 'Alcohol Bottle Themed Cake', slug: 'alcohol-bottle-themed-cake' },
];

export function DesignFormModal({ isOpen, onClose, initialData }: any) {
  const queryClient = useQueryClient()
  const [customAdded, setCustomAdded] = React.useState<any[]>([])
  const categories = React.useMemo(() => {
    const map = new Map<string, any>();
    DEFAULT_62_CATEGORIES.forEach(c => map.set(c.slug || c.categoryId, c));
    customAdded.forEach(c => map.set(c.slug || c.categoryId, c));
    return Array.from(map.values());
  }, [customAdded])

  React.useEffect(() => {
    fetch('/api/v1/categories')
      .then(res => res.json())
      .then(data => {
        const fetched = Array.isArray(data) ? data : (data?.data || []);
        if (fetched.length > 0) {
          setCustomAdded(prev => {
            const map = new Map<string, any>();
            prev.forEach(c => map.set(c.slug || c.categoryId, c));
            fetched.forEach((c: any) => map.set(c.slug || c.categoryId, c));
            return Array.from(map.values());
          });
        }
      })
      .catch(console.error);
  }, []);
  const [formData, setFormData] = React.useState({
    code: initialData?.code || "",
    name: initialData?.name || initialData?.title || "",
    description: initialData?.description || "",
    image: null as File | null,
    imageUrl: initialData?.imageUrl || initialData?.thumbnail || "",
    categoryIds: initialData?.categories?.map((c: any) => c.category?.slug || c.category?.id || c.categoryId || c.id || c) || (Array.isArray(initialData?.categoryIds) ? initialData.categoryIds : (initialData?.category?.slug ? [initialData.category.slug] : (initialData?.categoryId ? [initialData.categoryId] : []))),
    tags: Array.isArray(initialData?.tags) ? initialData.tags.join(", ") : (initialData?.tags || ""),
    themes: Array.isArray(initialData?.themes) ? initialData.themes.join(", ") : (initialData?.themes || ""),
    colours: Array.isArray(initialData?.colours) ? initialData.colours.join(", ") : (initialData?.colours || ""),
    occasions: Array.isArray(initialData?.occasions) ? initialData.occasions.join(", ") : (initialData?.occasions || ""),
    status: initialData?.status || "ACTIVE",
    recommendedTier: initialData?.recommendedTier !== undefined && initialData?.recommendedTier !== null ? initialData.recommendedTier : null,
    weightConfig: initialData?.weightConfig || {},
    basePrice: initialData?.basePrice !== undefined && initialData?.basePrice !== null ? initialData.basePrice : (initialData?.price || ""),
    isPhotoCake: Boolean(initialData?.isPhotoCake)
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        code: initialData?.code || "",
        name: initialData?.name || initialData?.title || "",
        description: initialData?.description || "",
        image: null as File | null,
        imageUrl: initialData?.imageUrl || initialData?.thumbnail || "",
        categoryIds: initialData?.categories?.map((c: any) => c.categoryId || c.id || c) || (Array.isArray(initialData?.categoryIds) ? initialData.categoryIds : (initialData?.category?.slug ? [initialData.category.slug] : (initialData?.categoryId ? [initialData.categoryId] : []))),
        tags: Array.isArray(initialData?.tags) ? initialData.tags.join(", ") : (initialData?.tags || ""),
        themes: Array.isArray(initialData?.themes) ? initialData.themes.join(", ") : (initialData?.themes || ""),
        colours: Array.isArray(initialData?.colours) ? initialData.colours.join(", ") : (initialData?.colours || ""),
        occasions: Array.isArray(initialData?.occasions) ? initialData.occasions.join(", ") : (initialData?.occasions || ""),
        status: initialData?.status || "ACTIVE",
        recommendedTier: initialData?.recommendedTier !== undefined && initialData?.recommendedTier !== null ? initialData.recommendedTier : null,
        weightConfig: initialData?.weightConfig || {},
        basePrice: initialData?.basePrice !== undefined && initialData?.basePrice !== null ? initialData.basePrice : (initialData?.price || ""),
        isPhotoCake: Boolean(initialData?.isPhotoCake)
      });
    }
  }, [isOpen, initialData]);

  const [isAddingCategory, setIsAddingCategory] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState("")
  const [isSavingCat, setIsSavingCat] = React.useState(false)
  const [isCatDropdownOpen, setIsCatDropdownOpen] = React.useState(false)
  const [catSearch, setCatSearch] = React.useState("")

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    setIsSavingCat(true)
    try {
      let newCat;
      try {
        const res = await fetchClient<any>('/categories', {
          method: 'POST',
          body: JSON.stringify({ name: newCategoryName.trim(), status: 'active' })
        })
        newCat = res.data || res
      } catch (e) {
        // If it fails (e.g. 409 Conflict), assume it already exists and use the slug
        newCat = { slug: newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') }
      }

      const catId = newCat.categoryId || newCat.slug || newCat.id || newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      await queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      
      setCustomAdded(prev => {
        if (prev.find(p => p.slug === catId)) return prev;
        return [...prev, { categoryId: catId, name: newCategoryName.trim(), slug: catId }]
      })
      
      setFormData((prev: any) => {
        const existingIds = prev.categoryIds || []
        if (existingIds.includes(catId)) return prev;
        return { ...prev, categoryIds: [...existingIds, catId] }
      })
      
      setNewCategoryName("")
      setIsAddingCategory(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSavingCat(false)
    }
  }



  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        tags: typeof formData.tags === 'string' ? formData.tags.split(',').map((s: string) => s.trim()).filter(Boolean) : (formData.tags || []),
        themes: typeof formData.themes === 'string' ? formData.themes.split(',').map((s: string) => s.trim()).filter(Boolean) : (formData.themes || []),
        colours: typeof formData.colours === 'string' ? formData.colours.split(',').map((s: string) => s.trim()).filter(Boolean) : (formData.colours || []),
        occasions: typeof formData.occasions === 'string' ? formData.occasions.split(',').map((s: string) => s.trim()).filter(Boolean) : (formData.occasions || []),
        basePrice: Number((() => {
          const enabledWeights = Object.keys(formData.weightConfig || {}).map(Number).sort((a, b) => a - b);
          const lowestWeight = enabledWeights[0];
          return lowestWeight ? formData.weightConfig[lowestWeight]?.price : (formData.basePrice || 600);
        })()),
        isPhotoCake: Boolean(formData.isPhotoCake),
        currentUpdatedAt: initialData?.updatedAt
      }

      // Store in prototype memory for instant visibility on Home & Admin screens during Phase 1
      try {
        const existingLocal = JSON.parse(localStorage.getItem('gopal_saved_designs') || '[]');
        const newEntry = {
          ...(initialData || {}),
          ...payload,
          id: initialData?.id || `des-custom-${Date.now()}`,
          code: formData.code || initialData?.code || `DSP-${Date.now().toString().slice(-4)}`,
          status: 'ACTIVE',
          updatedAt: new Date().toISOString()
        };
        let updated;
        if (initialData?.id) {
          const idx = existingLocal.findIndex((item: any) => item.id === initialData.id);
          if (idx !== -1) {
            updated = [...existingLocal];
            updated[idx] = newEntry;
          } else {
            updated = [newEntry, ...existingLocal];
          }
        } else {
          updated = [newEntry, ...existingLocal];
        }
        localStorage.setItem('gopal_saved_designs', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save fallback notice:', err);
      }
      
      try {
        if (initialData?.id) {
          return await fetchClient(`/designs/${initialData.id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          })
        } else {
          return await fetchClient(`/designs`, {
            method: "POST",
            body: JSON.stringify(payload)
          })
        }
      } catch (apiError: any) {
        console.warn('Backend connection note (saved to local prototype storage):', apiError.message);
        return { success: true, localOnly: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-designs'] })
      onClose()
    }
  })

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:!max-w-[720px] data-[side=right]:!max-w-[720px] overflow-y-auto p-0 bg-muted/10">
        <div className="p-6 border-b border-border bg-background sticky top-0 z-40 shadow-xs flex items-center justify-between">
          <div>
            <SheetTitle className="text-xl font-black text-foreground flex items-center gap-2">
              {initialData ? "✏️ Edit Design Product" : "✨ Add New Design Product"}
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {initialData ? "Update product details, pricing matrix, or images." : "Follow the 3 simple steps below to add a new cake to your bakery catalog."}
            </p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="p-6 space-y-6">
          
          {/* ======================================================== */}
          {/* CARD 1: IDENTITY & PRESENTATION */}
          {/* ======================================================== */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">1</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Cake Identity & Photo</h3>
                <p className="text-[11px] text-muted-foreground">How customers will see this cake on the storefront & menu</p>
              </div>
            </div>

            {/* Photo Upload & Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
              {/* Image Uploader Box */}
              <div className="sm:col-span-1">
                <label className="text-xs font-bold text-foreground block mb-1.5">Cake Photo *</label>
                <CloudinaryUploader
                  onUploadSuccess={(urls) => setFormData({ ...formData, imageUrl: urls[0] || "" })}
                  maxFiles={1}
                  label="Upload Photo"
                  existingImages={formData.imageUrl ? [formData.imageUrl] : []}
                  folder="gopal-cakes/designs"
                />
              </div>

              {/* Name & Category Selector */}
              <div className="sm:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Design Name *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Royal Gold Floral Elegance Cake"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/50 transition-all shadow-xs" 
                  />
                </div>

                {/* Category Selection inside Card 1 */}
                <div className="space-y-1.5 bg-muted/30 p-3 rounded-xl border border-border/70">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Bakery Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(!isAddingCategory)}
                      className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2.5 py-0.5 rounded-full transition-colors"
                    >
                      {isAddingCategory ? "Cancel" : "+ New Category"}
                    </button>
                  </div>

                  {isAddingCategory ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-primary/40 animate-in fade-in zoom-in-95 duration-150 shadow-xs mt-1">
                      <input
                        type="text"
                        placeholder="e.g. Wedding Cakes, Bento..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-3 py-1 bg-background border border-input rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={isSavingCat || !newCategoryName.trim()}
                        className="px-3 py-1 rounded-md bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                      >
                        {isSavingCat ? "Saving..." : "Add"}
                      </button>
                    </div>
                  ) : null}

                  <div className="relative pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCatDropdownOpen(!isCatDropdownOpen)
                        setCatSearch("")
                      }}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs hover:border-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 text-left"
                    >
                      <span className={formData.categoryIds[0] ? "text-foreground font-bold" : "text-muted-foreground font-normal"}>
                        {formData.categoryIds[0]
                          ? (categories.find(c => (c.categoryId || c.id) === formData.categoryIds[0])?.name || formData.categoryIds[0].replace(/-/g, ' ').toUpperCase())
                          : "Select a Category..."}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground ml-2">{isCatDropdownOpen ? "▲" : "▼"}</span>
                    </button>

                    {isCatDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-full z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[220px]">
                        <div className="p-2 border-b border-border bg-muted/30 sticky top-0 z-10">
                          <input
                            type="text"
                            placeholder="Search among 62 categories..."
                            value={catSearch}
                            onChange={(e) => setCatSearch(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs font-semibold bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="overflow-y-auto flex-1 p-1 space-y-0.5 divide-y divide-border/20">
                          {categories
                            .filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                            .map((c: any) => {
                              const cid = c.categoryId || c.id;
                              const isSelected = formData.categoryIds[0] === cid;
                              return (
                                <button
                                  key={cid}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, categoryIds: [cid] });
                                    setIsCatDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors ${
                                    isSelected 
                                      ? "bg-primary text-primary-foreground font-bold" 
                                      : "hover:bg-muted/80 text-foreground"
                                  }`}
                                >
                                  <span>{c.name}</span>
                                  {isSelected && <span className="text-xs font-black">✓</span>}
                                </button>
                              );
                            })
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Short Cake Description */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Cake Description & Layers</span>
                <span className="text-[10px] font-normal text-muted-foreground">Optional summary for customers</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Handcrafted with Belgian dark chocolate ganache, adorned with edible roses and shimmering gold accents."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/50 resize-none shadow-xs" 
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* CARD 2: PRICING, TIERS & WEIGHT SCALE */}
          {/* ======================================================== */}
          <div className="bg-gradient-to-br from-card via-card to-primary/[0.02] border border-primary/20 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-primary/10">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm">2</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Pricing & Weight Scale</h3>
                <p className="text-[11px] text-muted-foreground">Set your starting rate and configure prices for larger weights</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Starting Display Price */}
              <div className="space-y-1.5 bg-background p-3.5 rounded-xl border border-border shadow-2xs">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Starting Display Rate *</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-extrabold">Auto-calculated</span>
                </label>
                <p className="text-[10px] text-muted-foreground leading-tight">Automatically fetched from the lowest available weight price.</p>
                <div className="relative pt-1">
                  <span className="absolute left-3.5 top-3.5 text-sm font-black text-muted-foreground">₹</span>
                  <input
                    type="number"
                    disabled
                    value={(() => {
                      const enabledWeights = Object.keys(formData.weightConfig || {}).map(Number).sort((a, b) => a - b);
                      const lowestWeight = enabledWeights[0];
                      return lowestWeight ? formData.weightConfig[lowestWeight]?.price : formData.basePrice;
                    })()}
                    className="w-full pl-8 pr-3.5 py-2 bg-muted border-2 border-border/50 rounded-lg text-base font-black text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Cake Tier Option */}
              <div className="space-y-1.5 bg-background p-3.5 rounded-xl border border-border shadow-2xs">
                <label className="text-xs font-bold text-foreground block">Cake Tier Category *</label>
                <p className="text-[10px] text-muted-foreground leading-tight">Recommended tier structure for this cake</p>
                <div className="pt-1">
                  <select
                    required
                    value={formData.recommendedTier ?? ""}
                    onChange={e => setFormData({...formData, recommendedTier: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full px-3.5 py-2.5 bg-background border-2 border-primary/30 rounded-lg text-sm font-bold focus:border-primary cursor-pointer transition-all text-foreground"
                  >
                    <option value="" disabled>Select Tier Style</option>
                    <option value="1">🎂 1 Tier (Standard Single Layer)</option>
                    <option value="2">🎂🎂 2 Tier (Medium Celebration)</option>
                    <option value="3">🎂🎂🎂 3 Tier (Grand Wedding / Event)</option>
                    <option value="0">⭐ Any / Flexible / Not Tiered</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Weight Price Configurator */}
            <div className="space-y-2 bg-background p-4 rounded-xl border border-border shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs font-bold text-foreground">⚖️ Weight Availability Matrix</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-extrabold">
                  0.5 kg — 10.0 kg
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pb-1">
                Toggle which sizes customers can purchase and customize individual weight rates below:
              </p>
              <WeightPriceConfigurator
                initialConfig={formData.weightConfig}
                onChange={(config) => setFormData((prev: any) => ({ ...prev, weightConfig: config }))}
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* CARD 3: SPECIAL RULES & DISCOVERY */}
          {/* ======================================================== */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">3</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Custom Order Rules & Tags</h3>
                <p className="text-[11px] text-muted-foreground">Configure checkout prompts & search tags</p>
              </div>
            </div>

            {/* Photo Cake Option Toggle */}
            <div 
              onClick={() => setFormData(prev => ({ ...prev, isPhotoCake: !prev.isPhotoCake }))}
              className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                formData.isPhotoCake 
                  ? 'border-[var(--brand-deep-rose)] bg-[var(--brand-deep-rose)]/10 shadow-sm' 
                  : 'border-input bg-background hover:border-primary/40'
              }`}
            >
              <div className="space-y-1">
                <span className="text-sm font-extrabold flex items-center gap-2 text-foreground">
                  <span>📸 Require Edible Photo Print at Checkout?</span>
                  {formData.isPhotoCake && (
                    <span className="text-[10px] bg-[var(--brand-deep-rose)] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                      ACTIVE
                    </span>
                  )}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When turned ON, customers ordering this design will be required to upload their photo for edible ink printing.
                </p>
              </div>
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 ml-4 ${formData.isPhotoCake ? 'bg-[var(--brand-deep-rose)] border-[var(--brand-deep-rose)] text-white' : 'border-muted-foreground/40 bg-background'}`}>
                {formData.isPhotoCake && <span className="text-xs font-black">✓</span>}
              </div>
            </div>

            {/* Tags & Themes 2-Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Search Tags</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Comma separated</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. superhero, kids, fondant"
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary/50" 
                />
                <p className="text-[10px] text-muted-foreground">Helps customers find this cake in site search</p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Cake Themes</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Comma separated</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. marvel, floral, romantic"
                  value={formData.themes}
                  onChange={e => setFormData({...formData, themes: e.target.value})}
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary/50" 
                />
                <p className="text-[10px] text-muted-foreground">Used for theme filtering in catalog</p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* STICKY ACTION FOOTER BAR */}
          {/* ======================================================== */}
          <div className="sticky bottom-0 z-40 bg-card border-t border-border p-4 rounded-2xl shadow-xl flex items-center justify-end gap-3 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="px-5 py-2.5 h-11 rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="px-6 py-2.5 h-11 rounded-xl bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-[var(--brand-deep-rose)]/20 transition-all hover:-translate-y-0.5" 
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : <><Save2 className="w-4 h-4 mr-2" /> {initialData ? "💾 Update Design Product" : "✨ Publish Design Product"}</>}
            </Button>
          </div>
          
          {saveMutation.isError && (
            <p className="text-sm text-destructive font-bold text-center mt-2">
              {(saveMutation.error as any).message || "An error occurred during save."}
            </p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  )
}
