"use client";

import * as React from "react";
import { Role } from "@prisma/client";
import {
  TickCircle,
  CloseCircle,
  Eye,
  ShoppingCart,
  Cake,
  Car,
  People,
  Chart,
  Setting2,
  Global,
  Building,
  Camera,
  Brush,
  Scissor,
} from "iconsax-react";

interface Capability {
  label: string;
  icon: React.ReactNode;
  roles: Record<Role, boolean | "partial">;
  note?: Record<Role, string>;
}

const CAPABILITIES: Capability[] = [
  {
    label: "View Orders",
    icon: <ShoppingCart className="w-3.5 h-3.5" />,
    roles: {
      ADMIN: true,
      MANAGER: true,
      SALESPERSON: true,
      CHEF: "partial",
      DELIVERY: "partial",
      VENDOR_FLORIST: "partial",
      VENDOR_PHOTO: "partial",
      VENDOR_ACRYLIC: "partial",
    },
    note: {
      ADMIN: "All branches",
      MANAGER: "Own branch",
      SALESPERSON: "Own branch",
      CHEF: "Kitchen tickets only",
      DELIVERY: "Delivery tasks only",
      VENDOR_FLORIST: "Florist tasks only",
      VENDOR_PHOTO: "Photo tasks only",
      VENDOR_ACRYLIC: "Acrylic tasks only",
    },
  },
  {
    label: "Create / Edit Orders",
    icon: <Eye className="w-3.5 h-3.5" />,
    roles: {
      ADMIN: true,
      MANAGER: true,
      SALESPERSON: true,
      CHEF: false,
      DELIVERY: false,
      VENDOR_FLORIST: false,
      VENDOR_PHOTO: false,
      VENDOR_ACRYLIC: false,
    },
    note: {
      ADMIN: "All branches",
      MANAGER: "Own branch",
      SALESPERSON: "Own branch",
      CHEF: "",
      DELIVERY: "",
      VENDOR_FLORIST: "",
      VENDOR_PHOTO: "",
      VENDOR_ACRYLIC: "",
    },
  },
  {
    label: "Kitchen Display (KDS)",
    icon: <Cake className="w-3.5 h-3.5" />,
    roles: {
      ADMIN: true,
      MANAGER: true,
      SALESPERSON: false,
      CHEF: true,
      DELIVERY: false,
      VENDOR_FLORIST: false,
      VENDOR_PHOTO: false,
      VENDOR_ACRYLIC: false,
    },
    note: {
      ADMIN: "All kitchens",
      MANAGER: "Own branch",
      SALESPERSON: "",
      CHEF: "Own branch kitchen",
      DELIVERY: "",
      VENDOR_FLORIST: "",
      VENDOR_PHOTO: "",
      VENDOR_ACRYLIC: "",
    },
  },
  {
    label: "Delivery Tasks",
    icon: <Car className="w-3.5 h-3.5" />,
    roles: {
      ADMIN: true,
      MANAGER: true,
      SALESPERSON: false,
      CHEF: false,
      DELIVERY: true,
      VENDOR_FLORIST: false,
      VENDOR_PHOTO: false,
      VENDOR_ACRYLIC: false,
    },
    note: {
      ADMIN: "All branches",
      MANAGER: "Own branch",
      SALESPERSON: "",
      CHEF: "",
      DELIVERY: "Assigned deliveries",
      VENDOR_FLORIST: "",
      VENDOR_PHOTO: "",
      VENDOR_ACRYLIC: "",
    },
  },
  {
    label: "Vendor Portal",
    icon: <Camera className="w-3.5 h-3.5" />,
    roles: {
      ADMIN: true,
      MANAGER: "partial",
      SALESPERSON: false,
      CHEF: false,
      DELIVERY: false,
      VENDOR_FLORIST: true,
      VENDOR_PHOTO: true,
      VENDOR_ACRYLIC: true,
    },
    note: {
      ADMIN: "All vendors",
      MANAGER: "View only",
      SALESPERSON: "",
      CHEF: "",
      DELIVERY: "",
      VENDOR_FLORIST: "Florist tasks",
      VENDOR_PHOTO: "Photography tasks",
      VENDOR_ACRYLIC: "Acrylic printing tasks",
    },
  },
  {
    label: "Customer Management",
    icon: <People className="w-3.5 h-3.5" />,
    roles: {
      ADMIN: true,
      MANAGER: true,
      SALESPERSON: "partial",
      CHEF: false,
      DELIVERY: false,
      VENDOR_FLORIST: false,
      VENDOR_PHOTO: false,
      VENDOR_ACRYLIC: false,
    },
    note: {
      ADMIN: "All branches",
      MANAGER: "Own branch",
      SALESPERSON: "Read only",
      CHEF: "",
      DELIVERY: "",
      VENDOR_FLORIST: "",
      VENDOR_PHOTO: "",
      VENDOR_ACRYLIC: "",
    },
  },
  {
    label: "Analytics & Reports",
    icon: <Chart className="w-3.5 h-3.5" />,
    roles: {
      ADMIN: true,
      MANAGER: true,
      SALESPERSON: false,
      CHEF: false,
      DELIVERY: false,
      VENDOR_FLORIST: false,
      VENDOR_PHOTO: false,
      VENDOR_ACRYLIC: false,
    },
    note: {
      ADMIN: "All branches",
      MANAGER: "Own branch",
      SALESPERSON: "",
      CHEF: "",
      DELIVERY: "",
      VENDOR_FLORIST: "",
      VENDOR_PHOTO: "",
      VENDOR_ACRYLIC: "",
    },
  },
  {
    label: "User & Settings Management",
    icon: <Setting2 className="w-3.5 h-3.5" />,
    roles: {
      ADMIN: true,
      MANAGER: false,
      SALESPERSON: false,
      CHEF: false,
      DELIVERY: false,
      VENDOR_FLORIST: false,
      VENDOR_PHOTO: false,
      VENDOR_ACRYLIC: false,
    },
    note: {
      ADMIN: "Full system access",
      MANAGER: "",
      SALESPERSON: "",
      CHEF: "",
      DELIVERY: "",
      VENDOR_FLORIST: "",
      VENDOR_PHOTO: "",
      VENDOR_ACRYLIC: "",
    },
  },
];

const ROLE_META: Record<Role, { label: string; color: string; icon: React.ReactNode; scope: string }> = {
  ADMIN: {
    label: "Administrator",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    icon: <Global className="w-4 h-4" />,
    scope: "Global — all branches",
  },
  MANAGER: {
    label: "Manager",
    color: "bg-violet-500/10 text-violet-600 border-violet-500/30",
    icon: <Building className="w-4 h-4" />,
    scope: "Branch-scoped",
  },
  SALESPERSON: {
    label: "Salesperson",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    icon: <ShoppingCart className="w-4 h-4" />,
    scope: "Branch-scoped",
  },
  CHEF: {
    label: "Chef",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    icon: <Cake className="w-4 h-4" />,
    scope: "Branch kitchen only",
  },
  DELIVERY: {
    label: "Delivery Driver",
    color: "bg-green-500/10 text-green-600 border-green-500/30",
    icon: <Car className="w-4 h-4" />,
    scope: "Assigned deliveries only",
  },
  VENDOR_FLORIST: {
    label: "Florist Vendor",
    color: "bg-pink-500/10 text-pink-600 border-pink-500/30",
    icon: <Brush className="w-4 h-4" />,
    scope: "Florist tasks only",
  },
  VENDOR_PHOTO: {
    label: "Photo Vendor",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
    icon: <Camera className="w-4 h-4" />,
    scope: "Photography tasks only",
  },
  VENDOR_ACRYLIC: {
    label: "Acrylic Vendor",
    color: "bg-teal-500/10 text-teal-600 border-teal-500/30",
    icon: <Scissor className="w-4 h-4" />,
    scope: "Acrylic printing tasks only",
  },
};

interface RoleCapabilitiesProps {
  role: Role;
}

export function RoleCapabilities({ role }: RoleCapabilitiesProps) {
  const meta = ROLE_META[role];

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      {/* Role header */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-border`}>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${meta.color}`}>
          {meta.icon}
          {meta.label}
        </div>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground font-medium">{meta.scope}</span>
      </div>

      {/* Capabilities list */}
      <div className="divide-y divide-border/50">
        {CAPABILITIES.map((cap) => {
          const access = cap.roles[role];
          const note = cap.note?.[role];
          return (
            <div key={cap.label} className="flex items-center gap-3 px-4 py-2.5">
              <div className="text-muted-foreground shrink-0">{cap.icon}</div>
              <span className="text-xs font-medium text-foreground flex-1">{cap.label}</span>
              {access === true ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  {note && <span className="text-xs text-muted-foreground">{note}</span>}
                  <TickCircle className="w-4 h-4 text-emerald-500" variant="Bold" />
                </div>
              ) : access === "partial" ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  {note && <span className="text-xs text-amber-600">{note}</span>}
                  <TickCircle className="w-4 h-4 text-amber-500" variant="Bold" />
                </div>
              ) : (
                <CloseCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" variant="Bold" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ROLE_META };
