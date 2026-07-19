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
import { columns, type Category } from "./columns";
import { CategoryFilters } from "@/components/admin/categories/CategoryFilters";
import { CategoryForm, type CategoryFormData } from "@/components/admin/categories/CategoryForm";

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    displayOrder: "0",
    status: "active",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/categories");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setCategories(data);
          return;
        }
      }
    } catch (error) {
      console.warn("API failed, falling back to mock categories");
    } finally {
      setIsLoading(false);
    }
    
    // Fallback Mock Data
    setCategories([
      { id: 'mock', categoryId: "cat-01", name: "Custom Wedding Cakes", displayOrder: 1, status: "active" },
      { id: 'mock', categoryId: "cat-02", name: "Premium Pastries", displayOrder: 2, status: "active" },
      { id: 'mock', categoryId: "cat-03", name: "Photo Cakes", displayOrder: 3, status: "active" },
      { id: 'mock', categoryId: "cat-04", name: "Dry Cakes (Tea Time)", displayOrder: 4, status: "active" },
      { id: 'mock', categoryId: "cat-05", name: "Seasonal / Festival", displayOrder: 5, status: "inactive" },
    ]);
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        displayOrder: category.displayOrder?.toString() || "0",
        status: category.status as any || "active",
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        displayOrder: categories.length.toString(),
        status: "active",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payload: any = {
      name: formData.name,
      displayOrder: Number(formData.displayOrder),
      status: formData.status,
      ...( !editingCategory && { id: 'mock', categoryId: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') } )
    };
    
    if (editingCategory && editingCategory.updatedAt) {
      payload.currentUpdatedAt = editingCategory.updatedAt;
    }

    try {
      const url = editingCategory ? `/api/v1/categories/${editingCategory.categoryId}` : "/api/v1/categories";
      const method = editingCategory ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.code === 'CONCURRENCY_CONFLICT') {
          alert(errorData.error || "This category was modified by another user. Please refresh and try again.");
        } else {
          alert(errorData.error || "Failed to save category.");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Error saving category.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: 'mock', categoryId: string) => {
    setItemToDelete(categoryId);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/categories/${itemToDelete}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        setItemToDelete(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.code === 'CATEGORY_HAS_PRODUCTS') {
          alert(errorData.error || "Cannot delete category because it contains active or archived products. Reassign or delete them first.");
          setItemToDelete(null); // close dialog
        } else {
          alert(errorData.error || "Failed to delete category.");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <DashboardSection 
        title="Category Manager"
        description="Organize your product catalog efficiently."
        action={
          <div className="flex gap-3">
            <BackButton fallback="/admin" label="Back" variant="outline" />
            <Button onClick={() => handleOpenModal()}>
              <Add className="w-4 h-4 mr-2" /> Add Category
            </Button>
          </div>
        }
      />

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          label="Categories"
          columns={columns}
          data={filteredCategories}
          isLoading={isLoading}
          persistState={true}
          toolbar={
            <CategoryFilters 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          }
          rowActions={[
            {
              label: "Edit",
              onClick: (row) => handleOpenModal(categories.find(c => c.categoryId === row.categoryId))
            },
            {
              label: "Delete",
              variant: "destructive",
              onClick: (row: any) => confirmDelete(row.categoryId, row.name)
            }
          ]}
        />
        {/* Empty State */}
        {!isLoading && filteredCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-bold text-foreground mb-1">No categories yet</p>
            <p className="text-muted-foreground text-sm max-w-sm">
              Create your first category to organize your products.
            </p>
            {searchQuery && (
              <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent className="sm:max-w-md w-full flex flex-col h-full">
          <SheetHeader className="mb-4 shrink-0">
            <SheetTitle>{editingCategory ? "Edit Category" : "New Category"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pr-2 pb-10 hide-scrollbar">
            <CategoryForm
              formData={formData}
              setFormData={setFormData}
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
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete Category"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
