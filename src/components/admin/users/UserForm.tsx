"use client";

import * as React from "react";
import { Save2, Send, Warning2, TickCircle } from "iconsax-react";
import { Role } from "@prisma/client";
import { InviteUserDTO } from "@/dtos/UserSchemas";
import { RoleCapabilities, ROLE_META } from "./RoleCapabilities";
import { BRANCH_LABELS } from "./columns";

const ROLE_NEEDS_BRANCH: Role[] = ["MANAGER", "SALESPERSON", "CHEF", "DELIVERY"];
const ROLES_NO_BRANCH: Role[] = ["ADMIN", "VENDOR_FLORIST", "VENDOR_PHOTO", "VENDOR_ACRYLIC"];

interface UserFormProps {
  formData: InviteUserDTO;
  setFormData: React.Dispatch<React.SetStateAction<InviteUserDTO>>;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  isEditing: boolean;
  availableBranches?: { id: string; name: string }[];
}

export function UserForm({ formData, setFormData, onSubmit, isSaving, isEditing, availableBranches }: UserFormProps) {
  const role = formData.role as Role;
  const meta = ROLE_META[role];
  const needsBranch = ROLE_NEEDS_BRANCH.includes(role);
  const isGlobal = role === "ADMIN";
  const isVendor = role?.startsWith("VENDOR_");

  const branchMissing = needsBranch && !formData.branchId;

  // Build resolved branch list from live DB branches + fallbacks
  const branchOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    if (availableBranches?.length) {
      for (const b of availableBranches) {
        map.set(b.id, b.name);
      }
    }
    // Known core branches
    if (!map.has("cmswuiiu000021su3kv1mr41f")) map.set("cmswuiiu000021su3kv1mr41f", "Factory Warasiya");
    if (!map.has("khanderao")) map.set("khanderao", "Khanderao Market");
    if (!map.has("uma")) map.set("uma", "Uma Branch");
    if (!map.has("cmswuiita00011su3977ajl1z")) map.set("cmswuiita00011su3977ajl1z", "Market Branch");
    if (!map.has("cmswuiiun00031su3vfrn9eq5")) map.set("cmswuiiun00031su3vfrn9eq5", "Ellora Park");

    // If current user's branchId is not in the map, add it
    if (formData.branchId && !map.has(formData.branchId)) {
      const fallbackName = BRANCH_LABELS[formData.branchId] || formData.branchId;
      map.set(formData.branchId, fallbackName);
    }

    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [availableBranches, formData.branchId]);

  const assignedBranchLabel = React.useMemo(() => {
    if (!formData.branchId) return null;
    const match = branchOptions.find((b) => b.id === formData.branchId);
    return match ? match.label : formData.branchId;
  }, [formData.branchId, branchOptions]);

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
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as Role,
                // Reset branch when switching to global/vendor role
                branchId: ROLES_NO_BRANCH.includes(e.target.value as Role) ? null : formData.branchId,
              })
            }
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

        {/* Branch scope */}
        {needsBranch && (
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
        <RoleCapabilities role={role} assignedBranchName={assignedBranchLabel} />
      </div>

      {/* ── Submit ──────────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
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
