"use client";

import { useState, useMemo } from "react";
import { Add, ArrowLeft } from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";
import Link from "next/link";
import { DashboardSection } from "@/components/ui/dashboard-widgets";
import { DataTable } from "@/components/ui/data-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { columns } from "@/components/admin/customers/columns";
import { CustomerFilters } from "@/components/admin/customers/CustomerFilters";
import { CustomerForm, type CustomerFormData } from "@/components/admin/customers/CustomerForm";
import { useCustomers } from "@/hooks/useCustomers";
import { CustomerResponseDTO } from "@/dtos/CustomerSchemas";

export default function AdminCustomers() {
  const { customers, isLoading, createCustomer, updateCustomer } = useCustomers();
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerResponseDTO | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Deactivate State
  const [itemToDeactivate, setItemToDeactivate] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [customers, searchQuery]);

  const handleOpenModal = (customer?: CustomerResponseDTO) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || "",
        address: customer.address || "",
        isActive: customer.isActive,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = {
        ...formData,
        email: formData.email || null,
        address: formData.address || null,
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload);
      } else {
        await createCustomer(payload);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error saving customer.");
    } finally {
      setIsSaving(false);
    }
  };

  const executeDeactivate = async () => {
    if (!itemToDeactivate) return;
    setIsDeactivating(true);
    try {
      await updateCustomer(itemToDeactivate, { isActive: false });
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to deactivate customer.");
    } finally {
      setIsDeactivating(false);
      setItemToDeactivate(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <DashboardSection 
        title="Customer Manager"
        description="View and manage your customer database."
        action={
          <div className="flex gap-3">
            <BackButton fallback="/admin" label="Back" variant="outline" />
            <Button onClick={() => handleOpenModal()}>
              <Add className="w-4 h-4 mr-2" /> Add Customer
            </Button>
          </div>
        }
      />

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          label="Customers"
          columns={columns}
          data={filteredCustomers}
          isLoading={isLoading}
          persistState={true}
          toolbar={
            <CustomerFilters 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          }
          rowActions={[
            {
              label: "Edit",
              onClick: (row) => handleOpenModal(row)
            },
            {
              label: "Deactivate",
              variant: "destructive",
              onClick: (row) => setItemToDeactivate(row.id)
            }
          ]}
        />
        {/* Empty State */}
        {!isLoading && filteredCustomers.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-bold text-foreground mb-1">No customers yet</p>
            <p className="text-muted-foreground text-sm max-w-sm">
              Your customer database will grow as orders are placed.
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
            <SheetTitle>{editingCustomer ? "Edit Customer" : "New Customer"}</SheetTitle>
          </SheetHeader>
          <CustomerForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSave}
            isSaving={isSaving}
          />
        </SheetContent>
      </Sheet>

      <ConfirmationDialog 
        isOpen={!!itemToDeactivate}
        onClose={() => setItemToDeactivate(null)}
        onConfirm={executeDeactivate}
        title="Deactivate Customer"
        description="Are you sure you want to deactivate this customer? This preserves their order history but prevents them from placing new orders."
        confirmText="Deactivate Customer"
        variant="warning"
        isLoading={isDeactivating}
      />
    </div>
  );
}
