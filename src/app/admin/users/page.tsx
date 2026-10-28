"use client";

import { useState, useMemo } from "react";
import { Add } from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";
import { DashboardSection } from "@/components/ui/dashboard-widgets";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { getUserColumns } from "@/components/admin/users/columns";
import { UserFilters } from "@/components/admin/users/UserFilters";
import { UserForm } from "@/components/admin/users/UserForm";
import { useUsers } from "@/hooks/useUsers";
import { useBranches } from "@/hooks/useBranches";
import { UserResponseDTO, InviteUserDTO } from "@/dtos/UserSchemas";
import { AccountStatus } from "@prisma/client";

export default function AdminUsers() {
  const { users, isLoading, inviteUser, updateRole, updateStatus } = useUsers();
  const { branches } = useBranches();

  // Branch map for looking up human-readable branch names
  const branchMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (branches?.length) {
      for (const b of branches) {
        map[b.id] = b.name;
        if (b.code) map[b.code.toLowerCase()] = b.name;
      }
    }
    return map;
  }, [branches]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponseDTO | null>(null);
  const [formData, setFormData] = useState<InviteUserDTO>({
    name: "",
    email: "",
    phone: "",
    role: "SALESPERSON",
    branchId: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Status Action State
  const [statusAction, setStatusAction] = useState<{ id: string, action: 'SUSPEND' | 'ACTIVATE' | 'DEACTIVATE' | null }>({ id: '', action: null });
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleOpenModal = (user?: UserResponseDTO) => {
    if (user) {
      setEditingUser(user);
      // Auto-detect delivery scope for drivers if not explicitly set
      let initialScope = user.deliveryScope || "";
      if (user.role === "DELIVERY" && !initialScope) {
        if (!user.branchId || user.email?.includes("global")) {
          initialScope = "ALL_BRANCHES";
        } else {
          initialScope = user.branchId;
        }
      }

      setFormData({
        name: user.name,
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        branchId: user.branchId || "",
        deliveryScope: initialScope,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "SALESPERSON",
        branchId: "",
        deliveryScope: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const isDelivery = formData.role === 'DELIVERY';
      const isGlobalDelivery = isDelivery && (formData.deliveryScope === 'ALL_BRANCHES' || !formData.deliveryScope);
      
      const payload: InviteUserDTO = {
        ...formData,
        branchId: formData.role === 'ADMIN' || isGlobalDelivery ? null : (formData.branchId || null),
        deliveryScope: isDelivery ? (formData.deliveryScope || 'ALL_BRANCHES') : null,
      };

      if (editingUser) {
        await updateRole(editingUser.id, { 
          role: payload.role, 
          branchId: payload.branchId,
          deliveryScope: payload.deliveryScope,
        });
      } else {
        await inviteUser(payload);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error saving user.");
    } finally {
      setIsSaving(false);
    }
  };

  const executeStatusChange = async () => {
    if (!statusAction.action || !statusAction.id) return;
    setIsStatusChanging(true);
    try {
      let targetStatus: AccountStatus = 'ACTIVE';
      if (statusAction.action === 'SUSPEND') targetStatus = 'SUSPENDED';
      if (statusAction.action === 'DEACTIVATE') targetStatus = 'DEACTIVATED';
      
      await updateStatus(statusAction.id, { status: targetStatus });
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to change user status.");
    } finally {
      setIsStatusChanging(false);
      setStatusAction({ id: '', action: null });
    }
  };

  const handleDirectActivate = async (id: string) => {
    try {
      await updateStatus(id, { status: 'ACTIVE' });
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to activate user.");
    }
  };

  // Generate customized table columns with direct action triggers and dynamic branch mapping
  const columns = useMemo(() => {
    return getUserColumns({
      onEdit: (user) => handleOpenModal(user),
      onStatusChange: (id, action) => {
        if (action === 'ACTIVATE') {
          handleDirectActivate(id);
        } else {
          setStatusAction({ id, action });
        }
      },
      branchMap,
    });
  }, [branchMap]);

  return (
    <div className="space-y-6 pb-16">
      <DashboardSection 
        title="Users & Roles"
        description="Manage employee accounts, role capabilities, and branch assignments."
        action={
          <div className="flex gap-3">
            <BackButton fallback="/admin" label="Back" variant="outline" />
            <Button onClick={() => handleOpenModal()}>
              <Add className="w-4 h-4 mr-2" /> Invite User
            </Button>
          </div>
        }
      />

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          label="Users"
          columns={columns}
          data={filteredUsers}
          isLoading={isLoading}
          persistState={false}
          onRowClick={(user) => handleOpenModal(user)}
          toolbar={
            <UserFilters 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          }
        />
        {!isLoading && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-bold text-foreground mb-1">No users yet</p>
            <p className="text-muted-foreground text-sm max-w-sm">
              Invite your first employee to grant them access to the ERP.
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
        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto p-6 bg-card border-l border-border shadow-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingUser ? `Edit Role & Access — ${editingUser.name}` : "Invite New User"}
            </SheetTitle>
          </SheetHeader>
          <UserForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSave}
            isSaving={isSaving}
            isEditing={!!editingUser}
            availableBranches={branches}
          />
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialogs for Status Transitions */}
      <ConfirmationDialog 
        isOpen={statusAction.action === 'SUSPEND'}
        onClose={() => setStatusAction({ id: '', action: null })}
        onConfirm={executeStatusChange}
        title="Suspend User Account"
        description="This will temporarily lock the user out of the system. Existing sessions will be revoked. You can reactivate them later."
        confirmText="Suspend User"
        variant="warning"
        isLoading={isStatusChanging}
      />
      
      <ConfirmationDialog 
        isOpen={statusAction.action === 'DEACTIVATE'}
        onClose={() => setStatusAction({ id: '', action: null })}
        onConfirm={executeStatusChange}
        title="Deactivate User Account"
        description="Deactivating represents a permanent departure (e.g. employee left company). History is preserved, but they cannot login. Their active sessions will be revoked."
        confirmText="Deactivate User"
        variant="danger"
        isLoading={isStatusChanging}
      />
    </div>
  );
}
