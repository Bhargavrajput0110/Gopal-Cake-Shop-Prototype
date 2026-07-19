"use client";

import { useState, useEffect, useMemo } from "react";
import { Add, ArrowLeft } from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";
import Link from "next/link";
import { DashboardSection } from "@/components/ui/dashboard-widgets";
import { DataTable } from "@/components/ui/data-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { columns, ProductWithCategory } from "./columns";
import { ProductFilters, type Category } from "@/components/admin/products/ProductFilters";
import { ProductForm, type ProductFormData } from "@/components/admin/products/ProductForm";

type Product = {
  id: string;
  name: string;
  description: string;
  basePrice?: number;
  categoryId: string;
  thumbnail?: string;
  images?: string[];
  weightVariants?: any;
  availableForSale?: boolean;
  slug?: string;
  status?: string;
  updatedAt?: string;
  isCustomizable?: boolean;
  requiredVendors?: string[];
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isArchived, setIsArchived] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    status: "active",
    images: [],
    weightOptions: "",
    availableFlavors: "",

    isCustomizable: false,
    requiredVendors: [],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Price Update State
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [selectedBulkRows, setSelectedBulkRows] = useState<ProductWithCategory[]>([]);
  const [bulkPriceValue, setBulkPriceValue] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, isArchived]);

  const fetchData = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'all') params.set('categoryId', selectedCategory);
      if (isArchived) params.set('isArchived', 'true');

      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/v1/products?${params.toString()}`),
        fetch("/api/v1/categories")
      ]);
      
      if (prodRes.ok && catRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.success) {
          setProducts(prodData.data.items);
          setTotalPages(prodData.data.totalPages);
          setTotalItems(prodData.data.total);
          setCurrentPage(page);
        } else {
          setProducts(prodData); // Fallback if API hasn't updated yet
        }
        
        const catData = await catRes.json();
        setCategories(catData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProductsWithCategory = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.categoryId, c.name]));
    
    return products.map(p => ({
      ...p,
      productId: p.id,
      price: p.basePrice,
      images: p.thumbnail ? [p.thumbnail] : [],
      categoryName: categoryMap.get(p.categoryId) || "Unknown",
      status: p.availableForSale ? 'active' : 'sold-out'
    })) as ProductWithCategory[];
  }, [products, categories]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      
      let weightOptionsStr = "";
      if (product.weightVariants) {
         try {
           const parsed = typeof product.weightVariants === 'string' ? JSON.parse(product.weightVariants) : product.weightVariants;
           if (Array.isArray(parsed)) weightOptionsStr = parsed.map((w: any) => w.weight).join(", ");
         } catch(e) {}
      }
      
      setFormData({
        name: product.name,
        description: product.description || "",
        price: (product.basePrice || 0).toString(),
        categoryId: product.categoryId || "",
        status: product.availableForSale ? "active" : "out_of_stock",
        images: product.thumbnail ? [product.thumbnail] : [],
        weightOptions: weightOptionsStr,
        availableFlavors: "", // Flavors are not in Prisma model for now

        isCustomizable: product.isCustomizable || false,
        requiredVendors: product.requiredVendors || []
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        categoryId: categories.length > 0 ? categories[0].categoryId : "",
        status: "active",
        images: [],
        weightOptions: "",
        availableFlavors: "",

        isCustomizable: false,
        requiredVendors: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payload = {
      name: formData.name,
      description: formData.description,
      basePrice: Number(formData.price),
      categoryId: formData.categoryId,
      availableForSale: formData.status === "active",
      isCustomizable: formData.isCustomizable,
      requiredVendors: formData.requiredVendors,
      thumbnail: formData.images?.[0] || null,
      weightVariants: formData.weightOptions.split(",").map(s => {
        const val = s.trim();
        return val ? { weight: val, price: Number(formData.price) } : null;
      }).filter(Boolean),
      currentUpdatedAt: editingProduct?.updatedAt,
    };

    try {
      const url = editingProduct ? `/api/v1/products/${editingProduct.id}` : "/api/v1/products";
      const method = editingProduct ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const errorData = await res.json();
        if (res.status === 409 || errorData.code === 'CONCURRENCY_CONFLICT') {
          alert("This product was modified by another user. Please refresh and try again.");
        } else {
          alert(`Failed to save product: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Error saving product.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (productId: string) => {
    setItemToDelete(productId);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/products/${itemToDelete}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleClone = async (productId: string) => {
    try {
      const res = await fetch(`/api/v1/products/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clone" })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error("Failed to clone", e);
    }
  };

  const handleToggleAvailability = async (productId: string, currentStatus: string) => {
    try {
      const res = await fetch(`/api/v1/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availableForSale: currentStatus !== "active" })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error("Failed to toggle availability", e);
    }
  };

  const handleBulkUpdatePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPrice = Number(bulkPriceValue);
    if (!newPrice || newPrice <= 0) return alert("Enter a valid price");
    
    setIsBulkUpdating(true);
    try {
      const updates = selectedBulkRows.map(r => ({ id: r.productId, newPrice }));
      const res = await fetch("/api/v1/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-price-update", updates })
      });
      if (res.ok) {
        setIsBulkPriceModalOpen(false);
        setBulkPriceValue("");
        setSelectedBulkRows([]);
        fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <DashboardSection 
        title="Product Manager"
        description="Manage your catalog, prices, and stock."
        action={
          <div className="flex gap-3">
            <BackButton fallback="/admin" label="Back" variant="outline" />
            <Button variant="default" className="flex-1 font-bold" onClick={() => handleOpenModal()}>
              <Add className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        }
      />

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          label="Products"
          columns={columns}
          data={filteredProductsWithCategory}
          isLoading={isLoading}
          persistState={true}
          toolbar={
            <ProductFilters 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              isArchived={isArchived}
              setIsArchived={setIsArchived}
            />
          }
          serverPagination={{
            meta: {
              pageIndex: currentPage - 1, // TanStack table is 0-indexed
              pageSize: 20,
              pageCount: totalPages,
              total: totalItems
            },
            onPaginationChange: (pageIndex, pageSize) => {
              fetchData(pageIndex + 1);
            }
          }}
          bulkActions={[
            {
              label: "Bulk Update Price",
              onAction: (rows) => {
                setSelectedBulkRows(rows);
                setIsBulkPriceModalOpen(true);
              }
            }
          ]}
          rowActions={[
            {
              label: "Edit",
              onClick: (row) => handleOpenModal(products.find(p => p.id === row.productId))
            },
            {
              label: "Clone",
              onClick: (row) => handleClone(row.productId)
            },
            {
              label: "Toggle Availability",
              onClick: (row) => handleToggleAvailability(row.productId, row.status)
            },
            {
              label: "Delete",
              variant: "destructive",
              onClick: (row) => confirmDelete(row.productId)
            },
            {
              label: "Restore",
              hidden: (row) => !isArchived,
              onClick: async (row) => {
                await fetch(`/api/v1/products/${row.productId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isArchived: false })
                });
                fetchData();
              }
            }
          ]}
        />
      </div>

      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent className="sm:max-w-2xl w-full flex flex-col h-full">
          <SheetHeader className="mb-4 shrink-0">
            <SheetTitle>{editingProduct ? "Edit Product" : "Add New Product"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pr-2 pb-10 hide-scrollbar">
            <ProductForm
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              onSubmit={handleSave}
              isSaving={isSaving}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={executeDelete}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete Product"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Bulk Price Update Modal */}
      <Sheet open={isBulkPriceModalOpen} onOpenChange={setIsBulkPriceModalOpen}>
        <SheetContent className="sm:max-w-md w-full">
          <SheetHeader className="mb-6">
            <SheetTitle>Bulk Update Price</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleBulkUpdatePriceSubmit} className="space-y-6">
            <p className="text-sm text-muted-foreground">
              You are updating the base price for {selectedBulkRows.length} product(s).
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Base Price (₹)</label>
              <input 
                type="number" 
                value={bulkPriceValue}
                onChange={e => setBulkPriceValue(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <Button type="submit" disabled={isBulkUpdating} className="w-full">
              {isBulkUpdating ? "Updating..." : "Update Prices"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
