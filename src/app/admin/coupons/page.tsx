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
import { columns, type Coupon } from "./columns";
import { CouponFilters } from "@/components/admin/coupons/CouponFilters";
import { CouponForm, type CouponFormData } from "@/components/admin/coupons/CouponForm";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    usageLimit: "",
    validFrom: "",
    validUntil: "",
    isActive: true,
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
      const res = await fetch("/api/v1/coupons");
      if (res.ok) {
        setCoupons(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => 
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [coupons, searchQuery]);

  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue.toString(),
        minOrderValue: coupon.minOrderValue?.toString() || "",
        maxDiscount: coupon.maxDiscount?.toString() || "",
        usageLimit: coupon.usageLimit?.toString() || "",
        validFrom: formatDateForInput(coupon.validFrom),
        validUntil: formatDateForInput(coupon.validUntil),
        isActive: coupon.isActive,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        minOrderValue: "",
        maxDiscount: "",
        usageLimit: "",
        validFrom: "",
        validUntil: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payload = {
      code: formData.code,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
      validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
      isActive: formData.isActive,
    };

    try {
      const url = editingCoupon ? `/api/v1/coupons/${editingCoupon.id}` : "/api/v1/coupons";
      const method = editingCoupon ? "PATCH" : "POST";
      
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
        alert(`Failed to save coupon: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error saving coupon.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (couponId: string) => {
    setItemToDelete(couponId);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/coupons/${itemToDelete}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete coupon.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <DashboardSection 
        title="Coupon Manager"
        description="Create and manage discount codes and promotional offers."
        action={
          <div className="flex gap-3">
            <BackButton fallback="/admin" label="Back" variant="outline" />
            <Button onClick={() => handleOpenModal()}>
              <Add className="w-4 h-4 mr-2" /> Add Coupon
            </Button>
          </div>
        }
      />

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          label="Coupons"
          columns={columns}
          data={filteredCoupons}
          isLoading={isLoading}
          persistState={true}
          toolbar={
            <CouponFilters 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          }
          rowActions={[
            {
              label: "Edit",
              onClick: (row) => handleOpenModal(coupons.find(c => c.id === row.id))
            },
            {
              label: "Delete",
              variant: "destructive",
              onClick: (row) => confirmDelete(row.id)
            }
          ]}
        />
        {/* Empty State */}
        {!isLoading && filteredCoupons.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-bold text-foreground mb-1">No coupons yet</p>
            <p className="text-muted-foreground text-sm max-w-sm">
              Create your first discount code to boost sales.
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
        <SheetContent className="sm:max-w-md w-full overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingCoupon ? "Edit Coupon" : "New Coupon"}</SheetTitle>
          </SheetHeader>
          <CouponForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSave}
            isSaving={isSaving}
          />
        </SheetContent>
      </Sheet>

      <ConfirmationDialog 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={executeDelete}
        title="Delete Coupon"
        description="Are you sure you want to delete this coupon? This will prevent any further uses. This action cannot be undone."
        confirmText="Delete Coupon"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
