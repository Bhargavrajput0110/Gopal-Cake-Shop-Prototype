"use client";

import { useState, useMemo } from "react";
import { Add, ArrowLeft } from "iconsax-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { DashboardSection } from "@/components/ui/dashboard-widgets";
import { DataTable } from "@/components/ui/data-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { columns } from "@/components/admin/branches/columns";
import { BranchFilters } from "@/components/admin/branches/BranchFilters";
import { BranchForm, type BranchFormData } from "@/components/admin/branches/BranchForm";
import { useBranches } from "@/hooks/useBranches";
import { BranchResponseDTO } from "@/dtos/BranchSchemas";

export default function AdminBranches() {
  const { branches, isLoading, createBranch, updateBranch, deleteBranch } = useBranches();
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchResponseDTO | null>(null);
  const [formData, setFormData] = useState<BranchFormData>({
    name: "",
    code: "",
    address: "",
    phone: "",
    isActive: true,
    deliveryEnabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredBranches = useMemo(() => {
    return branches.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [branches, searchQuery]);

  const handleOpenModal = (branch?: BranchResponseDTO) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        code: branch.code,
        address: branch.address,
        phone: branch.phone || "",
        isActive: branch.isActive,
        deliveryEnabled: branch.deliveryEnabled,
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: "",
        code: "",
        address: "",
        phone: "",
        isActive: true,
        deliveryEnabled: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, formData);
      } else {
        await createBranch(formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error saving branch.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (branchId: string) => {
    setItemToDelete(branchId);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBranch(itemToDelete);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to delete branch.");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <DashboardSection 
        title="Branch Manager"
        description="Manage your physical store locations and operations."
        action={
          <div className="flex gap-3">
            <BackButton fallback="/admin" label="Back" variant="outline" />
            <Button onClick={() => handleOpenModal()}>
              <Add className="w-4 h-4 mr-2" /> Add Branch
            </Button>
          </div>
        }
      />

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          label="Branches"
          columns={columns}
          data={filteredBranches}
          isLoading={isLoading}
          persistState={true}
          toolbar={
            <BranchFilters 
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
              label: "Delete",
              variant: "destructive",
              onClick: (row) => confirmDelete(row.id)
            }
          ]}
        />
        {/* Empty State */}
        {!isLoading && filteredBranches.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-bold text-foreground mb-1">No branches yet</p>
            <p className="text-muted-foreground text-sm max-w-sm">
              Create your first physical store location.
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
            <SheetTitle>{editingBranch ? "Edit Branch" : "New Branch"}</SheetTitle>
          </SheetHeader>
          <BranchForm
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
        title="Delete Branch"
        description="Are you sure you want to delete this branch? This will affect staff and orders assigned to this location. This action cannot be undone."
        confirmText="Delete Branch"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
