"use client";

import * as React from "react";
import { Save2, Send, Warning2, TickCircle } from "iconsax-react";
import { Role } from "@prisma/client";
import { InviteUserDTO } from "@/dtos/UserSchemas";
import { RoleCapabilities, ROLE_META } from "./RoleCapabilities";
import { BRANCH_LABELS } from "./columns";

const ROLES_SINGLE_BRANCH: Role[] = ["MANAGER", "SALESPERSON", "CHEF"];

const BRANCH_SUBTITLES: Record<string, string> = {
  cmswuiiu000021su3kv1mr41f: "Central Factory & Baking Unit",
  varasiya: "Central Factory & Baking Unit",
  khanderao: "HQ Retail Showroom",
  uma: "Main Outlet (Waghodia)",
  cmswuiiun00031su3vfrn9eq5: "Ellora Park Retail Branch",
  elora: "Ellora Park Retail Branch",
};

interface UserFormProps {
  formData: InviteUserDTO;
  setFormData: React.Dispatch<React.SetStateAction<InviteUserDTO>>;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  isEditing: boolean;
  availableBranches?: { id: string; name: string }[];
}

export function UserForm({
  formData,
  setFormData,
  onSubmit,
  isSaving,
  isEditing,
  availableBranches,
}: UserFormProps) {
  const role = formData.role as Role;
  const isGlobal = role === "ADMIN";
  const isVendor = role?.startsWith("VENDOR_");
  const isDeliveryRole = role === "DELIVERY";
  const needsSingleBranch = ROLES_SINGLE_BRANCH.includes(role);

  // Normalize legacy Market branchId to canonical khanderao
  React.useEffect(() => {
    if (formData.branchId === "cmswuiita00011su3977ajl1z") {
      setFormData(prev => ({ ...prev, branchId: "khanderao" }));
    }
  }, [formData.branchId, setFormData]);

  // Build resolved branch list from live DB branches (strictly 4 branches)
  const branchOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    if (availableBranches?.length) {
      for (const b of availableBranches) {
        // Exclude any legacy duplicate Market branch entry
        if (b.id === "cmswuiita00011su3977ajl1z" || b.name.toLowerCase() === "market branch") {
          continue;
        }
        map.set(b.id, b.name);
      }
    }
    // Exactly 4 canonical branches
    if (!map.has("cmswuiiu000021su3kv1mr41f")) map.set("cmswuiiu000021su3kv1mr41f", "Factory Warasiya");
    if (!map.has("khanderao")) map.set("khanderao", "Khanderao Market");
    if (!map.has("uma")) map.set("uma", "Uma Branch");
    if (!map.has("cmswuiiun00031su3vfrn9eq5")) map.set("cmswuiiun00031su3vfrn9eq5", "Ellora Park");

    // If current user's branchId is not in the map, add it
    const activeBranchId = formData.branchId === "cmswuiita00011su3977ajl1z" ? "khanderao" : formData.branchId;
    if (activeBranchId && !map.has(activeBranchId)) {
      const fallbackName = BRANCH_LABELS[activeBranchId] || activeBranchId;
      map.set(activeBranchId, fallbackName);
    }

    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [availableBranches, formData.branchId]);

  const allBranchIds = React.useMemo(() => branchOptions.map((b) => b.id), [branchOptions]);

  // Selected branch IDs for delivery persons
  const selectedDeliveryBranchIds = React.useMemo(() => {
    if (!isDeliveryRole) return [];
    const scope = formData.deliveryScope;

    // Global delivery: ALL_BRANCHES, GLOBAL, or null branchId in editing
    if (
      scope === "ALL_BRANCHES" ||
      scope === "GLOBAL" ||
      (isEditing && !formData.branchId && (!scope || scope === ""))
    ) {
      return allBranchIds;
    }

    if (scope && scope.includes(",")) {
      return scope.split(",").map((s) => s.trim()).filter(Boolean);
    }

    if (scope === "UMA_WARASHIYA_PLUS_ASSIGNED") {
      return ["uma", "cmswuiiu000021su3kv1mr41f"];
    }

    if (scope === "WARASHIYA_PLUS_ASSIGNED" || scope === "WARASHIYA") {
      return ["cmswuiiu000021su3kv1mr41f"];
    }

    if (formData.branchId) {
      return [formData.branchId];
    }

    return [];
  }, [isDeliveryRole, formData.deliveryScope, formData.branchId, allBranchIds, isEditing]);

  const isAllDeliverySelected =
    isDeliveryRole &&
    (formData.deliveryScope === "ALL_BRANCHES" ||
      (selectedDeliveryBranchIds.length === allBranchIds.length && allBranchIds.length > 0));

  const handleSelectAllBranches = () => {
    setFormData((prev) => ({
      ...prev,
      deliveryScope: "ALL_BRANCHES",
      branchId: null,
    }));
  };

  const handleClearAllBranches = () => {
    setFormData((prev) => ({
      ...prev,
      deliveryScope: "",
      branchId: null,
    }));
  };

  const handleToggleDeliveryBranch = (bId: string) => {
    let next: string[];
    if (isAllDeliverySelected) {
      next = allBranchIds.filter((id) => id !== bId);
    } else if (selectedDeliveryBranchIds.includes(bId)) {
      next = selectedDeliveryBranchIds.filter((id) => id !== bId);
    } else {
      next = [...selectedDeliveryBranchIds, bId];
    }

    if (next.length === 0) {
      setFormData((prev) => ({
        ...prev,
        deliveryScope: "",
        branchId: null,
      }));
    } else if (next.length === allBranchIds.length) {
      setFormData((prev) => ({
        ...prev,
        deliveryScope: "ALL_BRANCHES",
        branchId: null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        deliveryScope: next.join(","),
        branchId: next[0] || null,
      }));
    }
  };

  const assignedBranchLabel = React.useMemo(() => {
    if (role === "ADMIN") return "Global (All branches & central operations)";
    if (isDeliveryRole) {
      if (isAllDeliverySelected || formData.deliveryScope === "ALL_BRANCHES") {
        return "Global (All 5 branches covered)";
      }
      if (selectedDeliveryBranchIds.length > 1) {
        return `${selectedDeliveryBranchIds.length} Branches Assigned`;
      }
      if (selectedDeliveryBranchIds.length === 1) {
        const found = branchOptions.find((b) => b.id === selectedDeliveryBranchIds[0]);
        return found ? found.label : selectedDeliveryBranchIds[0];
      }
      return null;
    }
    if (!formData.branchId) return null;
    const match = branchOptions.find((b) => b.id === formData.branchId);
    return match ? match.label : formData.branchId;
  }, [
    role,
    isDeliveryRole,
    isAllDeliverySelected,
    formData.deliveryScope,
    selectedDeliveryBranchIds,
    formData.branchId,
    branchOptions,
  ]);

  const branchMissing = needsSingleBranch && !formData.branchId;

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-8">
      {/* ── User summary card when editing ─────────────────────── */}
      {isEditing && (
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-muted/40 border border-border">
          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0">
            {formData.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-foreground truncate">{formData.name}</h4>
            <p className="text-xs text-muted-foreground truncate">{formData.email || "No email provided"}</p>
            {formData.phone && <p className="text-[11px] text-muted-foreground mt-0.5">📞 {formData.phone}</p>}
          </div>
        </div>
      )}

      {/* ── Identity fields (invite only) ─────────────────────── */}
      {!isEditing && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
            User Details
          </h3>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Full Name *</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g., Rajpal Sharma"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Email Address *</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g., rajpal@gopalcake.internal"
            />
            <p className="text-xs text-muted-foreground">
              An invite link will be sent to set a password.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Phone Number</label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g., 9876543210"
            />
          </div>
        </div>
      )}

      {/* ── Role & Branch ──────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          Role & Access Scope
        </h3>

        {/* Role selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">System Role *</label>
          <select
            required
            value={formData.role}
            onChange={(e) => {
              const newRole = e.target.value as Role;
              const willBeDelivery = newRole === "DELIVERY";
              setFormData({
                ...formData,
                role: newRole,
                branchId: newRole === "ADMIN" ? null : willBeDelivery ? null : formData.branchId,
                deliveryScope: willBeDelivery ? "ALL_BRANCHES" : null,
              });
            }}
            className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
          >
            <optgroup label="Management">
              <option value="ADMIN">Administrator — Global Access (all branches)</option>
              <option value="MANAGER">Manager — Branch Operations</option>
            </optgroup>
            <optgroup label="Branch Staff">
              <option value="SALESPERSON">Salesperson — Order Entry & Sales</option>
              <option value="CHEF">Chef — Kitchen Display (KDS)</option>
              <option value="DELIVERY">Delivery Driver — Delivery Tasks</option>
            </optgroup>
            <optgroup label="External Vendors">
              <option value="VENDOR_FLORIST">Vendor — Florist</option>
              <option value="VENDOR_PHOTO">Vendor — Photography</option>
              <option value="VENDOR_ACRYLIC">Vendor — Acrylic Printing</option>
            </optgroup>
          </select>
        </div>

        {/* ── Delivery Multi-Branch Selection ───────────────────── */}
        {isDeliveryRole && (
          <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex items-start justify-between gap-2">
              <div>
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Assigned Delivery Coverage</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Multi-Branch
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select which branches this delivery driver can accept orders and dispatch from.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllBranches}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isAllDeliverySelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-card hover:bg-emerald-500/10 hover:text-emerald-700 text-foreground border border-border"
                  }`}
                >
                  <TickCircle className="w-3.5 h-3.5" variant={isAllDeliverySelected ? "Bold" : "Linear"} />
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAllBranches}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-card hover:bg-destructive/10 hover:text-destructive text-muted-foreground border border-border transition-all cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Global delivery indicator */}
            {isAllDeliverySelected && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                <TickCircle className="w-4 h-4 text-emerald-600 shrink-0" variant="Bold" />
                <span className="text-xs font-semibold text-emerald-800">
                  <strong>Global Delivery Driver:</strong> Covers all {allBranchIds.length} branches across Vadodara.
                </span>
              </div>
            )}

            {/* Branch Checkboxes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {branchOptions.map((b) => {
                const checked = selectedDeliveryBranchIds.includes(b.id);
                return (
                  <div
                    key={b.id}
                    onClick={() => handleToggleDeliveryBranch(b.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all select-none ${
                      checked
                        ? "bg-card border-primary/50 text-foreground shadow-xs ring-1 ring-primary/20"
                        : "bg-background/60 border-border text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}} // handled by div onClick
                      className="w-4 h-4 rounded text-primary border-input focus:ring-primary/40 cursor-pointer accent-primary shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{b.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {BRANCH_SUBTITLES[b.id] || "Branch Outlet"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning if nothing selected */}
            {selectedDeliveryBranchIds.length === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold mt-1">
                <Warning2 className="w-4 h-4 shrink-0" />
                No branch selected — driver will have NO access to delivery tasks.
              </div>
            )}
          </div>
        )}

        {/* ── Single Branch Selector (Manager, Sales, Chef) ────── */}
        {needsSingleBranch && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Assigned Branch *</label>
            <select
              value={formData.branchId || ""}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value || null })}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
            >
              <option value="">— Select a branch —</option>
              {branchOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            {branchMissing && (
              <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold mt-1">
                <Warning2 className="w-3.5 h-3.5" />
                No branch assigned — this user will have NO access to branch features.
              </div>
            )}
          </div>
        )}

        {isGlobal && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <TickCircle className="w-4 h-4 text-emerald-500 shrink-0" variant="Bold" />
            <span className="text-xs font-semibold text-emerald-700">
              Administrators have <strong>global access</strong> across all branches — no branch assignment needed.
            </span>
          </div>
        )}

        {isVendor && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Warning2 className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-amber-700">
              Vendor accounts are not branch-scoped. They only see their assigned vendor tasks.
            </span>
          </div>
        )}
      </div>

      {/* ── Capabilities preview ──────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          What this role can access
        </h3>
        <RoleCapabilities
          role={role}
          assignedBranchName={assignedBranchLabel}
          deliveryScope={formData.deliveryScope}
        />
      </div>

      {/* ── Submit ──────────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            "Processing…"
          ) : isEditing ? (
            <>
              <Save2 className="w-4 h-4" /> Save Changes
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Send Invite
            </>
          )}
        </button>
      </div>
    </form>
  );
}
