"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Add, 
  SearchNormal1, 
  Edit2, 
  Trash, 
  Coffee, 
  TickCircle, 
  CloseCircle, 
  Warning2, 
  CloseSquare, 
  Refresh, 
  Gallery, 
  Box, 
  Flash,
  Eye,
  EyeSlash,
  Grid3,
  RowVertical
} from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { MediaGallery } from "@/components/admin/media/MediaGallery";
import { motion, AnimatePresence } from "framer-motion";

// Known canonical category ID for Hot Bakes
const HOT_BAKES_CATEGORY_ID = "cmuts899k0000ygu3pigymkyy";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number | string;
  categoryId?: string | null;
  availableForSale: boolean;
  thumbnail?: string | null;
  sku?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export default function HotBakesAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Category State
  const [resolvedCategoryId, setResolvedCategoryId] = useState(HOT_BAKES_CATEGORY_ID);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formThumbnail, setFormThumbnail] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Delete State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / Feedback State
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // 1. Fetch Hot Bakes Products & Category
  const fetchHotBakes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // First ensure category resolution
      let catId = HOT_BAKES_CATEGORY_ID;
      try {
        const catRes = await fetch("/api/v1/categories");
        if (catRes.ok) {
          const catList = await catRes.json();
          const hbCat = catList.find((c: any) => 
            c.slug === "hot-bakes" || 
            c.id === HOT_BAKES_CATEGORY_ID || 
            c.name?.toLowerCase().includes("hot bake")
          );
          if (hbCat) {
            catId = hbCat.categoryId || hbCat.id;
            setResolvedCategoryId(catId);
          }
        }
      } catch (err) {
        console.warn("Could not check categories list, using fallback ID:", err);
      }

      // Query products for this category
      const res = await fetch(`/api/v1/products?categoryId=${catId}&limit=100`);
      if (!res.ok) throw new Error("Failed to load Hot Bakes products");
      
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data.items || []);
      } else if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error("[Hot Bakes] Load error:", err);
      setError(err.message || "Failed to load Hot Bakes items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotBakes();
  }, [fetchHotBakes]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        !query || 
        p.name.toLowerCase().includes(query) || 
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query));

      // Status
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && p.availableForSale) ||
        (statusFilter === "inactive" && !p.availableForSale);

      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.availableForSale).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [products]);

  // Open Modal for Create or Edit
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormPrice("");
    // Auto-generate next SKU recommendation
    const nextNum = products.length + 1;
    setFormSku(`HOT-PUFF-${String(nextNum).padStart(2, "0")}`);
    setFormDescription("");
    setFormThumbnail("");
    setFormAvailable(true);
    setFormError("");
    setIsGalleryOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormPrice(String(product.basePrice || ""));
    setFormSku(product.sku || "");
    setFormDescription(product.description || "");
    setFormThumbnail(product.thumbnail || "");
    setFormAvailable(product.availableForSale);
    setFormError("");
    setIsGalleryOpen(false);
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
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      showToast(`${product.name} marked as ${nextVal ? "Available for Sale" : "Out of Stock"}`);
    } catch (err: any) {
      console.error(err);
      // Revert optimistic update
      setProducts((prev) => 
        prev.map((p) => (p.id === product.id ? { ...p, availableForSale: product.availableForSale } : p))
      );
      alert("Could not update status. Please try again.");
    }
  };

  // Save (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Product name is required.");
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
        description: formDescription.trim() || null,
        thumbnail: formThumbnail.trim() || null,
        availableForSale: formAvailable,
        categoryId: resolvedCategoryId,
        isCustomizable: false,
      };

      if (editingProduct) {
        // Update
        const res = await fetch(`/api/v1/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || "Failed to update Hot Bake product");
        }
        showToast(`Updated "${formName}" successfully!`);
      } else {
        // Create
        const res = await fetch("/api/v1/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || "Failed to create Hot Bake product");
        }
        showToast(`Added "${formName}" to Hot Bakes queue!`);
      }

      setIsModalOpen(false);
      fetchHotBakes();
    } catch (err: any) {
      console.error("[Save Hot Bake] Error:", err);
      setFormError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete / Archive Product
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/products/${productToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete product");
      }
      showToast(`Removed "${productToDelete.name}" from Hot Bakes`);
      setProductToDelete(null);
      fetchHotBakes();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to remove product");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[120] bg-[#3E2723] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#C5A059]/40"
          >
            <TickCircle className="w-5 h-5 text-[#C5A059]" variant="Bold" />
            <span className="text-sm font-semibold">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <BackButton fallback="/admin" label="Back to Admin Dashboard" variant="outline" size="sm" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059]/15 text-[#3E2723] flex items-center justify-center font-bold">
              <Coffee className="w-6 h-6 text-[#C5A059]" variant="Bold" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#3E2723] tracking-tight font-serif flex items-center gap-2">
                Hot Bakes Management
                <span className="text-xs font-bold uppercase tracking-wider bg-[#C5A059]/20 text-[#3E2723] px-2.5 py-1 rounded-md border border-[#C5A059]/30">
                  Category 2
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Manage freshly baked savory items (Puffs, Baked Snacks) prepared at Warasiya Factory for counter sales & inter-branch transfer.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchHotBakes}
            disabled={loading}
            className="border-black/10 hover:bg-black/5"
            title="Refresh items"
          >
            <Refresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-1.5 font-semibold text-xs">Refresh</span>
          </Button>
          <Button 
            onClick={handleOpenCreateModal}
            className="bg-[#C5A059] hover:bg-[#b08e4d] text-[#3E2723] font-bold shadow-md shadow-[#C5A059]/20 flex items-center gap-1.5 px-4"
          >
            <Add className="w-5 h-5" variant="Bold" />
            <span>Add Hot Bake</span>
          </Button>
        </div>
      </div>

      {/* Warasiya Factory Dispatch Routing Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 font-bold">
            🔥
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#3E2723] flex items-center gap-1.5">
              Warasiya Factory Central Kitchen Routing
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                Active System
              </span>
            </h4>
            <p className="text-xs text-muted-foreground">
              All items in this section are automatically assigned to <strong>Chef Santosh (Warasiya Factory)</strong>. Orders from Khanderao, Uma, or Ellora automatically trigger inter-branch driver transfer slips.
            </p>
          </div>
        </div>
      </div>

      {/* Stat Chips */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Hot Bakes</div>
          <div className="text-2xl font-black text-[#3E2723] mt-1">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <TickCircle className="w-3.5 h-3.5" variant="Bold" /> Active for Sale
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.active}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs">
          <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1">
            <CloseCircle className="w-3.5 h-3.5" variant="Bold" /> Out of Stock
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats.inactive}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-black/5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <SearchNormal1 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search puff name, SKU..."
            className="w-full pl-10 pr-9 py-2 bg-black/[0.03] border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:bg-white transition-all font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
            >
              <CloseSquare className="w-4 h-4" variant="Bold" />
            </button>
          )}
        </div>

        {/* Filter Pills & View Mode */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
          {/* Status Pills */}
          <div className="flex items-center bg-black/[0.04] p-1 rounded-xl gap-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "all"
                  ? "bg-white text-[#3E2723] shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "active"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "inactive"
                  ? "bg-white text-rose-600 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Out of Stock ({stats.inactive})
            </button>
          </div>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-black/[0.04] p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === "grid" ? "bg-white text-[#3E2723] shadow-xs" : "text-muted-foreground"
              }`}
              title="Grid View"
            >
              <Grid3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === "table" ? "bg-white text-[#3E2723] shadow-xs" : "text-muted-foreground"
              }`}
              title="Table View"
            >
              <RowVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-muted-foreground">Loading Hot Bakes inventory...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-600 space-y-3">
          <Warning2 className="w-10 h-10 mx-auto" />
          <p className="font-bold">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchHotBakes} className="border-rose-300">
            Retry
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-black/5 shadow-xs space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-3xl">
            🥐
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#3E2723]">No Hot Bakes found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              {searchQuery || statusFilter !== "all" 
                ? "No products match your search or filter criteria. Try clearing search."
                : "No items have been added to the Hot Bakes category yet. Click below to add your first fresh bake!"}
            </p>
          </div>
          <Button 
            onClick={handleOpenCreateModal}
            className="bg-[#C5A059] hover:bg-[#b08e4d] text-[#3E2723] font-bold shadow-md shadow-[#C5A059]/20"
          >
            <Add className="w-4 h-4 mr-1.5" variant="Bold" /> Add First Hot Bake
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
              <div className="relative aspect-4/3 bg-amber-50/50 overflow-hidden">
                {product.thumbnail ? (
                  <img 
                    src={product.thumbnail} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-800/40 gap-2">
                    <span className="text-4xl">🥐</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Hot Bake</span>
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

                {/* Baked at Warasiya tag */}
                <div className="absolute bottom-2 left-2 right-2 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4 rounded-b-xl text-[10px] text-white/90 font-medium flex items-center gap-1">
                  <span>🔥</span> Warasiya Factory Dispatch
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
                      Freshly baked warm savory item.
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
                    className="flex-1 text-xs font-bold border-black/10 hover:bg-black/5"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1 text-[#3E2723]" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setProductToDelete(product)}
                    className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 p-2"
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
              <thead className="bg-black/[0.02] text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-black/5">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Bake Route</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-medium">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 border border-black/5 overflow-hidden shrink-0 flex items-center justify-center">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">🥐</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[#3E2723]">{product.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{product.description || "Hot savory puff"}</div>
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
                        🔥 Warasiya Chef Santosh
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
                    <Coffee className="w-5 h-5 text-[#C5A059]" variant="Bold" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#3E2723] font-serif">
                      {editingProduct ? "Edit Hot Bake Product" : "Add Hot Bake Product"}
                    </h2>
                    <p className="text-xs text-muted-foreground">Category 2: Hot Bakes · Warasiya Factory</p>
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
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Cheese Corn Puff, Paneer Tikka Puff"
                    className="w-full px-3.5 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:bg-white"
                  />
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
                      placeholder="e.g. 25"
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
                      placeholder="e.g. HOT-PUFF-02"
                      className="w-full px-3.5 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:bg-white uppercase"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                    Description / Ingredients
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Flaky multi-layered puff stuffed with seasoned fillings."
                    className="w-full px-3.5 py-2 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:bg-white resize-none"
                  />
                </div>

                {/* Thumbnail Image */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                      Product Image (URL or Gallery)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsGalleryOpen(!isGalleryOpen)}
                      className="text-xs font-bold text-[#C5A059] hover:underline flex items-center gap-1"
                    >
                      <Gallery className="w-3.5 h-3.5" />
                      {isGalleryOpen ? "Hide Gallery" : "Browse Media Gallery"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formThumbnail}
                      onChange={(e) => setFormThumbnail(e.target.value)}
                      placeholder="Paste image URL (https://...)"
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

                  {/* Image Preview */}
                  {formThumbnail && (
                    <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-black/10">
                      <img src={formThumbnail} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Embedded Gallery Picker */}
                  {isGalleryOpen && (
                    <div className="mt-3 p-3 border border-black/10 rounded-2xl bg-black/[0.02] max-h-60 overflow-y-auto">
                      <MediaGallery 
                        selectable 
                        onSelect={(url) => {
                          setFormThumbnail(url);
                          setIsGalleryOpen(false);
                        }} 
                      />
                    </div>
                  )}
                </div>

                {/* Availability Toggle */}
                <div className="p-3.5 rounded-2xl bg-black/[0.02] border border-black/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#3E2723]">Available for Sale</div>
                    <div className="text-[11px] text-muted-foreground">Show this item in POS for billing</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="w-5 h-5 accent-[#C5A059] rounded cursor-pointer"
                  />
                </div>

                {/* Warasiya Kitchen Dispatch Info Banner */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
                  <span className="text-base shrink-0">ℹ️</span>
                  <div>
                    <strong>Category Auto-Assignment:</strong> This item is automatically assigned to <strong>Category: Hot Bakes</strong> and will be routed to Warasiya Factory central kitchen.
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => setIsModalOpen(false)}
                    className="font-bold text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#C5A059] hover:bg-[#b08e4d] text-[#3E2723] font-bold text-xs shadow-md shadow-[#C5A059]/20 flex items-center gap-1.5 px-5"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-[#3E2723] border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <TickCircle className="w-4 h-4" variant="Bold" />
                        <span>{editingProduct ? "Save Changes" : "Create Hot Bake"}</span>
                      </>
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
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${productToDelete?.name}"?`}
        description="Are you sure you want to remove this item from the Hot Bakes menu? It will no longer be available in POS."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
