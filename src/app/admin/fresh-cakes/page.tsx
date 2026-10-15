"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Cake, 
  SearchNormal1, 
  Add, 
  Edit2, 
  Trash, 
  Eye, 
  EyeSlash, 
  Refresh2, 
  TickCircle, 
  CloseCircle, 
  Warning2,
  CloseSquare,
  Gallery,
  CloudPlus,
  Box,
  Shop,
  Star1,
  Flash
} from "iconsax-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { MediaGallery } from "@/components/admin/media/MediaGallery";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";
import { motion, AnimatePresence } from "framer-motion";

// Known canonical category ID for Fresh Cakes
const FRESH_CAKES_CATEGORY_ID = "cmv94ork70000lou35ftrwfno";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  basePrice: number | string;
  availableForSale: boolean;
  thumbnail: string | null;
  weightVariants?: any;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt?: string;
}

export default function FreshCakesAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [weightFilter, setWeightFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formWeight, setFormWeight] = useState("500g");
  const [formDescription, setFormDescription] = useState("");
  const [formThumbnail, setFormThumbnail] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);
  const [imageSource, setImageSource] = useState<"upload" | "gallery" | "url">("upload");

  // Delete State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Fresh Cakes
  const fetchFreshCakes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch category id or fallback
      let catId = FRESH_CAKES_CATEGORY_ID;
      try {
        const catRes = await fetch("/api/v1/categories");
        if (catRes.ok) {
          const catData = await catRes.json();
          const categories = Array.isArray(catData) ? catData : catData.data || [];
          const fcCat = categories.find((c: any) => c.slug === "fresh-cakes" || c.name === "Fresh Cakes");
          if (fcCat) {
            catId = fcCat.id || catId;
          }
        }
      } catch (e) {
        console.warn("[Fresh Cakes] Category fetch warning, using default:", e);
      }

      // 2. Query products for this category
      const res = await fetch(`/api/v1/products?categoryId=${catId}&limit=100`);
      if (!res.ok) throw new Error("Failed to load Fresh Cakes products");
      const data = await res.json();
      
      const items: Product[] = data.data?.items || data.data || [];
      setProducts(items);
    } catch (err: any) {
      console.error("[Fresh Cakes] Load error:", err);
      setError(err.message || "Failed to load Fresh Cakes products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFreshCakes();
  }, []);

  // Filtered List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.availableForSale) ||
        (statusFilter === "inactive" && !p.availableForSale);

      const matchWeight =
        weightFilter === "all" ||
        (p.name && p.name.toLowerCase().includes(weightFilter.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(weightFilter.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(weightFilter.toLowerCase()));

      return matchSearch && matchStatus && matchWeight;
    });
  }, [products, searchQuery, statusFilter, weightFilter]);

  // Quick Stats
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.availableForSale).length;
    const inactive = total - active;
    const avgPrice = total > 0
      ? Math.round(products.reduce((acc, p) => acc + Number(p.basePrice || 0), 0) / total)
      : 0;
    return { total, active, inactive, avgPrice };
  }, [products]);

  // Generate Recommended SKU
  const generateRecommendedSku = (weight: string) => {
    const prefix = weight.includes("1") ? "FC-1KG-" : "FC-500-";
    let highestNum = 0;
    products.forEach((p) => {
      if (p.sku && p.sku.toUpperCase().startsWith(prefix)) {
        const parts = p.sku.split("-");
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > highestNum) {
          highestNum = num;
        }
      }
    });
    const nextNum = String(highestNum + 1).padStart(2, "0");
    return `${prefix}${nextNum}`;
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormPrice("");
    setFormWeight("500g");
    setFormSku(generateRecommendedSku("500g"));
    setFormDescription("");
    setFormThumbnail("");
    setFormAvailable(true);
    setFormError("");
    setImageSource("upload");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormPrice(String(product.basePrice || ""));
    setFormSku(product.sku || "");
    
    // Detect weight from name or sku
    let weight = "500g";
    if (product.name.toLowerCase().includes("1kg") || product.name.toLowerCase().includes("1 kg")) weight = "1 Kg";
    else if (product.name.toLowerCase().includes("250g") || product.name.toLowerCase().includes("bento")) weight = "250g (Bento)";
    else if (product.name.toLowerCase().includes("1.5kg")) weight = "1.5 Kg";
    setFormWeight(weight);

    setFormDescription(product.description || "");
    setFormThumbnail(product.thumbnail || "");
    setFormAvailable(product.availableForSale);
    setFormError("");
    setImageSource("upload");
    setIsModalOpen(true);
  };

  // Quick 1-click Toggle Availability
  const handleToggleAvailability = async (product: Product) => {
    const nextVal = !product.availableForSale;
    
    // Optimistic update
    setProducts((prev) => 
      prev.map((p) => (p.id === product.id ? { ...p, availableForSale: nextVal } : p))
    );

    try {
      const res = await fetch(`/api/v1/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availableForSale: nextVal }),
      });
      if (!res.ok) throw new Error("Failed to update status on server");
      showToast(`"${product.name}" is now ${nextVal ? "Active in Showcase" : "Marked Out of Stock"}!`);
    } catch (err: any) {
      console.error("[Toggle Fresh Cake] Error:", err);
      // Revert optimistic update
      setProducts((prev) => 
        prev.map((p) => (p.id === product.id ? { ...p, availableForSale: !nextVal } : p))
      );
      showToast("Error updating status. Please try again.");
    }
  };

  // Save (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Cake name is required.");
      return;
    }
    const numPrice = Number(formPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError("Please enter a valid price (₹).");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: formName.trim(),
        basePrice: numPrice,
        sku: formSku.trim() || undefined,
        description: formDescription.trim() || undefined,
        thumbnail: formThumbnail.trim() || undefined,
        availableForSale: formAvailable,
        categoryId: FRESH_CAKES_CATEGORY_ID,
        isCustomizable: false,
      };

      if (editingProduct) {
        // Update
        const res = await fetch(`/api/v1/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = 
            resData.message || 
            resData.error || 
            (resData.details && resData.details[0]?.message) || 
            "Failed to update Fresh Cake";
          throw new Error(msg);
        }
        showToast(`Updated "${formName}" successfully! 🎂`);
      } else {
        // Create
        const res = await fetch("/api/v1/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = 
            resData.message || 
            resData.error || 
            (resData.details && resData.details[0]?.message) || 
            "Failed to add Fresh Cake";
          throw new Error(msg);
        }
        showToast(`Added "${formName}" to Counter Showcase! 🎂`);
      }

      setIsModalOpen(false);
      fetchFreshCakes();
    } catch (err: any) {
      console.error("[Save Fresh Cake] Error:", err);
      setFormError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/products/${productToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete Fresh Cake product");
      
      showToast(`Removed "${productToDelete.name}" from catalog.`);
      setProductToDelete(null);
      fetchFreshCakes();
    } catch (err: any) {
      console.error("[Delete Fresh Cake] Error:", err);
      showToast("Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[120] bg-[#3E2723] text-white px-5 py-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 text-sm font-semibold"
          >
            <span className="text-xl">🎂</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-0.5 rounded-full border border-[#C5A059]/20">
              Category 3 · Showcase Stock
            </span>
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Counter Sales Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#3E2723] font-serif tracking-tight">
            Fresh Cakes (Counter Display)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage ready-to-sell counter cakes on display shelf across store showcases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFreshCakes}
            disabled={isLoading}
            className="h-10 px-3.5 rounded-xl border-black/10 hover:bg-black/5 text-[#3E2723]"
          >
            <Refresh2 className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="h-10 px-5 rounded-xl bg-[#3E2723] hover:bg-[#2C1810] text-[#FFF9F2] font-bold shadow-md shadow-[#3E2723]/20 flex items-center gap-1.5 transition-all transform active:scale-95"
          >
            <Add className="w-5 h-5" variant="Bold" />
            <span>Add Fresh Cake</span>
          </Button>
        </div>
      </div>

      {/* Fresh Cakes Showcase Information Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFF8E7] via-[#FFF3D6] to-[#FFE8B3] border border-[#C5A059]/30 p-5 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C5A059] text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              🎂
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[#3E2723] text-base font-serif">
                  Ready-to-Sell Counter Cakes Showcase
                </h3>
                <span className="text-[10px] font-bold bg-[#C5A059] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Shelf Stock
                </span>
              </div>
              <p className="text-xs text-[#3E2723]/80 max-w-3xl leading-relaxed">
                These are pre-baked, decorated standard-sized cakes kept in branch refrigerated display counters for walk-in immediate purchase.
                Toggling an item <strong>Active/Out of Stock</strong> instantly reflects on the POS billing screen for quick counter checkout.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-white/70 backdrop-blur-sm p-2 rounded-2xl border border-[#C5A059]/20 text-xs">
            <span className="font-bold text-[#3E2723]">Standard Sizes:</span>
            <span className="bg-amber-100 text-amber-900 font-mono font-bold px-2 py-0.5 rounded-md text-[11px]">500g</span>
            <span className="bg-amber-100 text-amber-900 font-mono font-bold px-2 py-0.5 rounded-md text-[11px]">1 Kg</span>
            <span className="bg-amber-100 text-amber-900 font-mono font-bold px-2 py-0.5 rounded-md text-[11px]">250g Bento</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Counter Cakes</div>
            <div className="text-2xl sm:text-3xl font-black text-[#3E2723] mt-1">{stats.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#3E2723]/5 text-[#3E2723] flex items-center justify-center">
            <Cake className="w-5 h-5 text-[#3E2723]" variant="Bold" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Active in Showcase</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{stats.active}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TickCircle className="w-5 h-5" variant="Bold" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-500">Out of Stock</div>
            <div className="text-2xl sm:text-3xl font-black text-rose-500 mt-1">{stats.inactive}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <CloseCircle className="w-5 h-5" variant="Bold" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">Average Counter Price</div>
            <div className="text-2xl sm:text-3xl font-black text-[#3E2723] mt-1">₹{stats.avgPrice}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center font-black text-base">
            ₹
          </div>
        </div>
      </div>

      {/* Search, Filter Toolbar & View Toggle */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-black/5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <SearchNormal1 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cake name, SKU, flavor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-black/[0.03] p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "all" ? "bg-white text-[#3E2723] shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "active" ? "bg-white text-emerald-600 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "inactive" ? "bg-white text-rose-500 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Out of Stock ({stats.inactive})
            </button>
          </div>

          {/* Weight Filter */}
          <div className="flex items-center bg-black/[0.03] p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setWeightFilter("all")}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                weightFilter === "all" ? "bg-white text-[#3E2723] shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Sizes
            </button>
            <button
              onClick={() => setWeightFilter("500g")}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                weightFilter === "500g" ? "bg-white text-[#3E2723] shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              500g
            </button>
            <button
              onClick={() => setWeightFilter("1kg")}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                weightFilter === "1kg" ? "bg-white text-[#3E2723] shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              1 Kg
            </button>
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center bg-black/[0.03] p-1 rounded-xl text-xs font-bold ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                viewMode === "grid" ? "bg-white text-[#3E2723] shadow-xs" : "text-muted-foreground"
              }`}
              title="Grid View"
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                viewMode === "table" ? "bg-white text-[#3E2723] shadow-xs" : "text-muted-foreground"
              }`}
              title="Table View"
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Refresh2 className="w-8 h-8 animate-spin text-[#C5A059]" />
          <p className="text-sm font-semibold">Loading Fresh Counter Cakes...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Warning2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchFreshCakes} className="bg-white">
            Try Again
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-black/5 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center text-3xl">
            🎂
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#3E2723]">No Fresh Cakes Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery || statusFilter !== "all" || weightFilter !== "all"
                ? "No cakes match your search or filter criteria. Try clearing search."
                : "You have not added any counter cakes yet. Add your first showcase cake to start selling."}
            </p>
          </div>
          <Button
            onClick={handleOpenCreateModal}
            className="rounded-xl bg-[#3E2723] text-white hover:bg-[#2C1810]"
          >
            <Add className="w-4 h-4 mr-1.5" variant="Bold" /> Add First Fresh Cake
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="bg-white rounded-2xl border border-black/5 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200 group"
            >
              {/* Image Header */}
              <div className="relative aspect-4/3 bg-amber-50/40 overflow-hidden">
                {product.thumbnail ? (
                  <img 
                    src={product.thumbnail} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-800/40 gap-2">
                    <span className="text-4xl">🎂</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Counter Cake</span>
                  </div>
                )}

                {/* SKU Badge */}
                {product.sku && (
                  <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                    {product.sku}
                  </span>
                )}

                {/* Availability Badge */}
                <span className={`absolute top-2.5 right-2.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
                  product.availableForSale 
                    ? "bg-emerald-500 text-white" 
                    : "bg-rose-500 text-white"
                }`}>
                  {product.availableForSale ? "Active" : "Out of Stock"}
                </span>

                {/* Counter Showcase Tag */}
                <div className="absolute bottom-2 left-2 right-2 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4 rounded-b-xl text-[10px] text-white/90 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>🎂</span> Counter Showcase
                  </span>
                  <span className="bg-white/20 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-bold">
                    Walk-in Ready
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-[#3E2723] text-base leading-snug group-hover:text-[#C5A059] transition-colors">
                    {product.name}
                  </h3>
                  {product.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic mt-1">
                      Ready on counter display.
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Price</span>
                    <span className="text-xl font-black text-[#3E2723]">₹{Number(product.basePrice)}</span>
                  </div>

                  {/* Quick Toggle Switch */}
                  <button
                    onClick={() => handleToggleAvailability(product)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      product.availableForSale
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                    }`}
                    title="Click to toggle showcase availability"
                  >
                    {product.availableForSale ? (
                      <>
                        <Eye className="w-3.5 h-3.5" variant="Bold" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <EyeSlash className="w-3.5 h-3.5" variant="Bold" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenEditModal(product)}
                    className="flex-1 rounded-xl text-xs font-bold border-black/10 text-[#3E2723] hover:bg-black/5"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1 text-[#C5A059]" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setProductToDelete(product)}
                    className="rounded-xl text-xs text-rose-600 hover:bg-rose-50 px-2.5"
                    title="Delete product"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-black/5 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/[0.02] border-b border-black/5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Cake & Photo</th>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Placement</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-50/50 overflow-hidden shrink-0 border border-black/5 flex items-center justify-center">
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">🎂</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[#3E2723]">{product.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {product.description || "Counter cake on display shelf"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono font-bold text-muted-foreground">
                      {product.sku || "—"}
                    </td>
                    <td className="py-3 px-4 font-black text-base text-[#3E2723]">
                      ₹{Number(product.basePrice)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                        🎂 Counter Showcase
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleAvailability(product)}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                          product.availableForSale
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        {product.availableForSale ? (
                          <>
                            <TickCircle className="w-3 h-3" variant="Bold" /> Available
                          </>
                        ) : (
                          <>
                            <CloseCircle className="w-3 h-3" variant="Bold" /> Out of Stock
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(product)}
                        className="text-[#3E2723] hover:bg-black/5"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProductToDelete(product)}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSaving && setIsModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-black/10 w-full max-w-lg p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#C5A059]/20 text-[#3E2723] flex items-center justify-center font-bold">
                    <Cake className="w-5 h-5 text-[#C5A059]" variant="Bold" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#3E2723] font-serif">
                      {editingProduct ? "Edit Fresh Cake" : "Add Fresh Counter Cake"}
                    </h2>
                    <p className="text-xs text-muted-foreground">Category 3: Ready-to-Sell Counter Cakes · Shelf Stock</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
                >
                  <CloseSquare className="w-5 h-5" variant="Bold" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                    <Warning2 className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                    Cake Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Dutch Chocolate Truffle Cake (500g), Pineapple Fresh Cream (500g)"
                    className="w-full px-3.5 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:bg-white"
                  />
                </div>

                {/* Weight Variant Presets */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                    Standard Size / Weight
                  </label>
                  <div className="flex items-center gap-2">
                    {["500g", "1 Kg", "250g (Bento)", "1.5 Kg"].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => {
                          setFormWeight(w);
                          if (!editingProduct) {
                            setFormSku(generateRecommendedSku(w));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          formWeight === w
                            ? "bg-[#3E2723] text-white border-[#3E2723]"
                            : "bg-black/[0.02] border-black/10 text-muted-foreground hover:bg-black/5"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price and SKU Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="e.g. 450"
                      className="w-full px-3.5 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                      SKU Code
                    </label>
                    <input
                      type="text"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      placeholder="e.g. FC-500-01"
                      className="w-full px-3.5 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:bg-white uppercase"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                    Flavor Notes & Ingredients
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Rich dark chocolate ganache, moist sponge, topped with chocolate curls."
                    className="w-full px-3.5 py-2 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:bg-white resize-none"
                  />
                </div>

                {/* Thumbnail Image Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                      Product Image (Cloudinary CDN)
                    </label>
                    {formThumbnail && formThumbnail.includes("cloudinary.com") && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        ☁️ Cloudinary Verified
                      </span>
                    )}
                  </div>

                  {/* Image Source Tabs */}
                  <div className="flex items-center gap-1 bg-black/[0.04] p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setImageSource("upload")}
                      className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                        imageSource === "upload"
                          ? "bg-white text-[#3E2723] shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <CloudPlus className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Upload Device</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSource("gallery")}
                      className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                        imageSource === "gallery"
                          ? "bg-white text-[#3E2723] shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Gallery className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Media Library</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSource("url")}
                      className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                        imageSource === "url"
                          ? "bg-white text-[#3E2723] shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>Web URL</span>
                    </button>
                  </div>

                  {/* Tab 1: Direct Cloudinary Uploader */}
                  {imageSource === "upload" && (
                    <div className="p-3 border border-black/10 rounded-2xl bg-black/[0.01]">
                      <CloudinaryUploader 
                        folder="gopal-cakes/fresh-cakes"
                        maxFiles={1}
                        label="Upload Cake Photo"
                        existingImages={formThumbnail ? [formThumbnail] : []}
                        onUploadSuccess={(urls) => {
                          if (urls && urls.length > 0) {
                            setFormThumbnail(urls[0]);
                            showToast("Image uploaded to Cloudinary successfully! ☁️");
                          } else {
                            setFormThumbnail("");
                          }
                        }} 
                      />
                    </div>
                  )}

                  {/* Tab 2: Embedded Gallery Picker */}
                  {imageSource === "gallery" && (
                    <div className="p-3 border border-black/10 rounded-2xl bg-black/[0.02] max-h-60 overflow-y-auto">
                      <MediaGallery 
                        selectable 
                        folder="gopal-cakes/fresh-cakes"
                        onSelect={(url) => {
                          setFormThumbnail(url);
                          showToast("Selected from Media Library!");
                        }} 
                      />
                    </div>
                  )}

                  {/* Tab 3: Direct URL Input */}
                  {imageSource === "url" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formThumbnail}
                        onChange={(e) => setFormThumbnail(e.target.value)}
                        placeholder="https://res.cloudinary.com/... or image link"
                        className="w-full px-3.5 py-2 bg-black/[0.02] border border-black/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:bg-white"
                      />
                      {formThumbnail && (
                        <button
                          type="button"
                          onClick={() => setFormThumbnail("")}
                          className="p-2 text-muted-foreground hover:text-foreground"
                        >
                          <CloseSquare className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Active Selected Image Preview */}
                  {formThumbnail && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-black/10 shrink-0">
                          <img src={formThumbnail} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-[#3E2723] block">Active Cake Thumbnail</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px] sm:max-w-xs font-mono">
                            {formThumbnail}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormThumbnail("")}
                        className="text-xs text-rose-600 hover:underline font-bold px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Availability Toggle */}
                <div className="p-3.5 rounded-2xl bg-black/[0.02] border border-black/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#3E2723]">Available on Display Counter</div>
                    <div className="text-[11px] text-muted-foreground">Show in POS counter screen for billing</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="w-5 h-5 accent-[#C5A059] rounded cursor-pointer"
                  />
                </div>

                {/* Showcase Stock Info Banner */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
                  <span className="text-base shrink-0">🎂</span>
                  <div>
                    <strong>Category Auto-Assignment:</strong> This item is automatically assigned to <strong>Category: Fresh Cakes</strong> and displayed in front showcase inventory.
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border-black/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-[#3E2723] hover:bg-[#2C1810] text-white font-bold px-6 shadow-md shadow-[#3E2723]/20"
                  >
                    {isSaving ? (
                      <>
                        <Refresh2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : editingProduct ? (
                      "Save Changes"
                    ) : (
                      "Add Fresh Cake"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={!!productToDelete}
        title="Remove Fresh Cake Product"
        description={`Are you sure you want to remove "${productToDelete?.name}" from Fresh Cakes counter catalog? This will hide it from showcase listings.`}
        confirmText={isDeleting ? "Removing..." : "Yes, Remove"}
        onConfirm={handleDeleteProduct}
        onClose={() => !isDeleting && setProductToDelete(null)}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
