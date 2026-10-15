"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Lovely, 
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
  Flash,
  Heart
} from "iconsax-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { MediaGallery } from "@/components/admin/media/MediaGallery";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";
import { motion, AnimatePresence } from "framer-motion";

// Known canonical category ID for Bouquets
const BOUQUETS_CATEGORY_ID = "cmv9h4efd0000a0u3u8yom3qt";

// Common flower varieties for bouquets
export const FLOWER_VARIETIES = [
  "Red Roses",
  "Pink Roses",
  "Lilies",
  "Orchids",
  "Carnations",
  "Mixed Flowers",
  "Sunflowers",
  "Exotic Flora"
];

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  basePrice: number | string;
  availableForSale: boolean;
  thumbnail: string | null;
  requiredVendors?: string[];
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt?: string;
}

export default function BouquetsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [varietyFilter, setVarietyFilter] = useState<string>("all");
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
  const [formVariety, setFormVariety] = useState("Red Roses");
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

  // Fetch Bouquets
  const fetchBouquets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch category id or fallback
      let catId = BOUQUETS_CATEGORY_ID;
      try {
        const catRes = await fetch("/api/v1/categories");
        if (catRes.ok) {
          const catData = await catRes.json();
          const categories = Array.isArray(catData) ? catData : catData.data || [];
          const bqtCat = categories.find((c: any) => c.slug === "bouquets" || c.name === "Bouquets");
          if (bqtCat) {
            catId = bqtCat.id || catId;
          }
        }
      } catch (e) {
        console.warn("[Bouquets] Category fetch warning, using default:", e);
      }

      // 2. Query products for this category
      const res = await fetch(`/api/v1/products?categoryId=${catId}&limit=100`);
      if (!res.ok) throw new Error("Failed to load Bouquets products");
      const data = await res.json();
      
      const items: Product[] = data.data?.items || data.data || [];
      setProducts(items);
    } catch (err: any) {
      console.error("[Bouquets] Load error:", err);
      setError(err.message || "Failed to load Bouquets products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBouquets();
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

      const matchVariety =
        varietyFilter === "all" ||
        (p.name && p.name.toLowerCase().includes(varietyFilter.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(varietyFilter.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(varietyFilter.toLowerCase()));

      return matchSearch && matchStatus && matchVariety;
    });
  }, [products, searchQuery, statusFilter, varietyFilter]);

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

  // Generate Recommended SKU based on flower variety
  const generateRecommendedSku = (variety: string) => {
    let tag = "ROSE";
    const v = variety.toLowerCase();
    if (v.includes("lily") || v.includes("lilies")) tag = "LILY";
    else if (v.includes("orchid")) tag = "ORCH";
    else if (v.includes("carnation")) tag = "CARN";
    else if (v.includes("mix")) tag = "MIX";
    else if (v.includes("sunflower")) tag = "SUN";
    else if (v.includes("exotic")) tag = "EXOT";

    const prefix = `BQT-${tag}-`;
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
    setFormVariety("Red Roses");
    setFormSku(generateRecommendedSku("Red Roses"));
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
    
    // Detect variety
    let matchedVariety = "Red Roses";
    const nameLower = product.name.toLowerCase();
    for (const v of FLOWER_VARIETIES) {
      if (nameLower.includes(v.toLowerCase())) {
        matchedVariety = v;
        break;
      }
    }
    setFormVariety(matchedVariety);

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
      showToast(`"${product.name}" is now ${nextVal ? "Active & Available" : "Marked Out of Stock"}!`);
    } catch (err: any) {
      console.error("[Toggle Bouquet] Error:", err);
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
      setFormError("Bouquet name is required.");
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
        categoryId: BOUQUETS_CATEGORY_ID,
        isCustomizable: false,
        requiredVendors: ["VENDOR_FLORIST"],
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
            "Failed to update Bouquet";
          throw new Error(msg);
        }
        showToast(`Updated "${formName}" successfully! 💐`);
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
            "Failed to add Bouquet";
          throw new Error(msg);
        }
        showToast(`Added "${formName}" to Florist Queue! 💐`);
      }

      setIsModalOpen(false);
      fetchBouquets();
    } catch (err: any) {
      console.error("[Save Bouquet] Error:", err);
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
      if (!res.ok) throw new Error("Failed to delete Bouquet product");
      
      showToast(`Removed "${productToDelete.name}" from catalog.`);
      setProductToDelete(null);
      fetchBouquets();
    } catch (err: any) {
      console.error("[Delete Bouquet] Error:", err);
      showToast("Failed to delete bouquet.");
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
            <span className="text-xl">💐</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E91E63] bg-[#E91E63]/10 px-2.5 py-0.5 rounded-full border border-[#E91E63]/20">
              Category 4 · Florist Vendor
            </span>
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Vendor Vikas Bhai (9558951977)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#3E2723] font-serif tracking-tight">
            Bouquets & Floral Gifts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage fresh floral bouquets assigned automatically to Florist Vendor for celebration orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBouquets}
            disabled={isLoading}
            className="h-10 px-3.5 rounded-xl border-black/10 hover:bg-black/5 text-[#3E2723]"
          >
            <Refresh2 className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="h-10 px-5 rounded-xl bg-[#E91E63] hover:bg-[#C2185B] text-white font-bold shadow-md shadow-[#E91E63]/20 flex items-center gap-1.5 transition-all transform active:scale-95"
          >
            <Add className="w-5 h-5" variant="Bold" />
            <span>Add Bouquet</span>
          </Button>
        </div>
      </div>

      {/* Florist Vendor Routing Information Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFF0F5] via-[#FFE4E1] to-[#FFD1DC] border border-[#E91E63]/30 p-5 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              💐
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[#880E4F] text-base font-serif">
                  Automated Florist Vendor Routing
                </h3>
                <span className="text-[10px] font-bold bg-[#E91E63] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Vendor Partner
                </span>
              </div>
              <p className="text-xs text-[#4A148C]/90 max-w-3xl leading-relaxed">
                Products added here are automatically linked to <strong>Florist Vendor Vikas Bhai</strong> (<code>9558951977</code>). When a bouquet is ordered (as an add-on with a cake or as a standalone gift), it is instantly routed to the Florist Portal for fresh flower procurement and arrangement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-[#E91E63]/20 text-xs">
            <span className="font-bold text-[#880E4F]">Assigned Vendor:</span>
            <span className="bg-rose-100 text-rose-900 font-bold px-2 py-0.5 rounded-md text-[11px]">
              Vikas Bhai · 9558951977
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Bouquets</div>
            <div className="text-2xl sm:text-3xl font-black text-[#3E2723] mt-1">{stats.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Lovely className="w-5 h-5 text-[#E91E63]" variant="Bold" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Active for Sale</div>
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
            <div className="text-xs font-bold uppercase tracking-wider text-[#E91E63]">Average Price</div>
            <div className="text-2xl sm:text-3xl font-black text-[#3E2723] mt-1">₹{stats.avgPrice}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E91E63]/10 text-[#E91E63] flex items-center justify-center font-black text-base">
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
            placeholder="Search bouquet name, SKU, flower..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E91E63]/50 focus:bg-white transition-all"
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

          {/* Variety Filter */}
          <div className="flex items-center bg-black/[0.03] p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setVarietyFilter("all")}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                varietyFilter === "all" ? "bg-white text-[#3E2723] shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Flowers
            </button>
            {["Roses", "Lilies", "Orchids"].map((v) => (
              <button
                key={v}
                onClick={() => setVarietyFilter(v)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  varietyFilter === v ? "bg-white text-[#3E2723] shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
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
          <Refresh2 className="w-8 h-8 animate-spin text-[#E91E63]" />
          <p className="text-sm font-semibold">Loading Bouquets Catalog...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Warning2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchBouquets} className="bg-white">
            Try Again
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-black/5 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center text-3xl">
            💐
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#3E2723]">No Bouquets Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery || statusFilter !== "all" || varietyFilter !== "all"
                ? "No bouquets match your search or filter criteria. Try clearing search."
                : "You have not added any bouquets yet. Add your first flower bouquet to enable florist orders."}
            </p>
          </div>
          <Button
            onClick={handleOpenCreateModal}
            className="rounded-xl bg-[#E91E63] text-white hover:bg-[#C2185B]"
          >
            <Add className="w-4 h-4 mr-1.5" variant="Bold" /> Add First Bouquet
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
              <div className="relative aspect-4/3 bg-pink-50/40 overflow-hidden">
                {product.thumbnail ? (
                  <img 
                    src={product.thumbnail} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-pink-800/40 gap-2">
                    <span className="text-4xl">💐</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Florist Bouquet</span>
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

                {/* Florist Vendor Tag */}
                <div className="absolute bottom-2 left-2 right-2 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4 rounded-b-xl text-[10px] text-white/95 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>💐</span> Florist Vikas Bhai
                  </span>
                  <span className="bg-pink-500/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-bold">
                    Vendor Order
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-[#3E2723] text-base leading-snug group-hover:text-[#E91E63] transition-colors">
                    {product.name}
                  </h3>
                  {product.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic mt-1">
                      Freshly arranged celebration bouquet.
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
                    title="Click to toggle availability"
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
                    <Edit2 className="w-3.5 h-3.5 mr-1 text-[#E91E63]" />
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
                  <th className="py-3 px-4">Bouquet & Photo</th>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Vendor Assignment</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-pink-50/50 overflow-hidden shrink-0 border border-black/5 flex items-center justify-center">
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">💐</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[#3E2723]">{product.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {product.description || "Fresh floral bouquet for celebrations"}
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
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                        💐 Florist Vikas Bhai
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
                  <div className="w-9 h-9 rounded-xl bg-[#E91E63]/20 text-[#E91E63] flex items-center justify-center font-bold">
                    <Lovely className="w-5 h-5 text-[#E91E63]" variant="Bold" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#3E2723] font-serif">
                      {editingProduct ? "Edit Bouquet" : "Add Flower Bouquet"}
                    </h2>
                    <p className="text-xs text-muted-foreground">Category 4: Flower Bouquets · Florist Vendor</p>
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
                    Bouquet Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. 12 Red Roses Celebration Bouquet, Pastel Lilies"
                    className="w-full px-3.5 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E91E63]/50 focus:bg-white"
                  />
                </div>

                {/* Flower Variety Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                      Flower Variety / Style *
                    </label>
                    <span className="text-xs font-bold text-[#E91E63] bg-[#E91E63]/10 px-2.5 py-0.5 rounded-full border border-[#E91E63]/20 font-mono">
                      Selected: {formVariety}
                    </span>
                  </div>

                  {/* Variety Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {FLOWER_VARIETIES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setFormVariety(v);
                          if (!editingProduct) {
                            setFormSku(generateRecommendedSku(v));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          formVariety === v
                            ? "bg-[#E91E63] text-white border-[#E91E63] shadow-xs scale-105"
                            : "bg-black/[0.02] border-black/10 text-muted-foreground hover:bg-black/5 hover:text-foreground"
                        }`}
                      >
                        {v}
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
                      placeholder="e.g. 499"
                      className="w-full px-3.5 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#E91E63]/50 focus:bg-white"
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
                      placeholder="e.g. BQT-ROSE-01"
                      className="w-full px-3.5 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#E91E63]/50 focus:bg-white uppercase"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                    Stems, Fillers & Packaging Details
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="12 fresh Dutch red roses with gypsophila fillers in rustic paper packaging."
                    className="w-full px-3.5 py-2 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E91E63]/50 focus:bg-white resize-none"
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
                      <CloudPlus className="w-3.5 h-3.5 text-[#E91E63]" />
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
                      <Gallery className="w-3.5 h-3.5 text-[#E91E63]" />
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
                        folder="gopal-cakes/bouquets"
                        maxFiles={1}
                        label="Upload Bouquet Photo"
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
                        folder="gopal-cakes/bouquets"
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
                        className="w-full px-3.5 py-2 bg-black/[0.02] border border-black/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#E91E63]/50 focus:bg-white"
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
                    <div className="mt-2 p-2.5 rounded-xl bg-pink-500/5 border border-pink-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-black/10 shrink-0">
                          <img src={formThumbnail} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-[#3E2723] block">Active Bouquet Thumbnail</span>
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
                    <div className="text-xs font-bold text-[#3E2723]">Available for Sale</div>
                    <div className="text-[11px] text-muted-foreground">Show in POS and online checkout for billing</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="w-5 h-5 accent-[#E91E63] rounded cursor-pointer"
                  />
                </div>

                {/* Florist Vendor Routing Info Banner */}
                <div className="p-3 rounded-xl bg-pink-50 border border-pink-200/60 text-[11px] text-[#880E4F] flex items-start gap-2">
                  <span className="text-base shrink-0">💐</span>
                  <div>
                    <strong>Florist Vendor Auto-Tagging:</strong> This product will be automatically assigned to <strong>Florist Vendor Vikas Bhai (9558951977)</strong> via <code>VENDOR_FLORIST</code> dispatch.
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
                    className="rounded-xl bg-[#E91E63] hover:bg-[#C2185B] text-white font-bold px-6 shadow-md shadow-[#E91E63]/20"
                  >
                    {isSaving ? (
                      <>
                        <Refresh2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : editingProduct ? (
                      "Save Changes"
                    ) : (
                      "Add Bouquet"
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
        title="Remove Bouquet Product"
        description={`Are you sure you want to remove "${productToDelete?.name}" from Bouquets catalog? This will hide it from customer listings.`}
        confirmText={isDeleting ? "Removing..." : "Yes, Remove"}
        onConfirm={handleDeleteProduct}
        onClose={() => !isDeleting && setProductToDelete(null)}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
