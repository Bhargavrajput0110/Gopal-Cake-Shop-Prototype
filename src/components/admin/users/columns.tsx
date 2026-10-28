import * as React from "react"
import { ColumnDef } from "@/components/ui/data-table"
import { UserResponseDTO } from "@/dtos/UserSchemas"
import { StatusBadge } from "@/components/ui/status-badge"
import { Role } from "@prisma/client"

const ROLE_STYLES: Record<Role, { label: string; cls: string }> = {
  ADMIN:          { label: "Admin",           cls: "bg-rose-500/10 text-rose-600 border border-rose-500/30" },
  MANAGER:        { label: "Manager",         cls: "bg-violet-500/10 text-violet-600 border border-violet-500/30" },
  SALESPERSON:    { label: "Salesperson",     cls: "bg-blue-500/10 text-blue-600 border border-blue-500/30" },
  CHEF:           { label: "Chef",            cls: "bg-orange-500/10 text-orange-600 border border-orange-500/30" },
  DELIVERY:       { label: "Delivery",        cls: "bg-green-500/10 text-green-600 border border-green-500/30" },
  VENDOR_FLORIST: { label: "Florist",         cls: "bg-pink-500/10 text-pink-600 border border-pink-500/30" },
  VENDOR_PHOTO:   { label: "Photo Vendor",    cls: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/30" },
  VENDOR_ACRYLIC: { label: "Acrylic Vendor",  cls: "bg-teal-500/10 text-teal-600 border border-teal-500/30" },
}

const BRANCH_LABELS: Record<string, string> = {
  khanderao:  "Khanderao",
  uma:        "Uma",
  warasiya:   "Warasiya",
  ellorapark: "Ellora Park",
}

export const columns: ColumnDef<UserResponseDTO, any>[] = [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => {
      const user = row.original
      const style = ROLE_STYLES[user.role as Role] ?? { label: user.role, cls: "bg-muted/50 text-foreground border border-border" }
      const initials = user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
      return (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${style.cls}`}>
            {initials}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{user.name}</p>
            {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const style = ROLE_STYLES[row.original.role as Role] ?? { label: row.original.role, cls: "bg-muted/50 text-foreground border border-border" }
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${style.cls}`}>
          {style.label}
        </span>
      )
    }
  },
  {
    accessorKey: "branchId",
    header: "Scope",
    cell: ({ row }) => {
      const role = row.original.role as Role
      if (role === "ADMIN") {
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            🌐 Global
          </span>
        )
      }
      if (role.startsWith("VENDOR_")) {
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            Vendor Tasks
          </span>
        )
      }
      const branchLabel = row.original.branchId ? (BRANCH_LABELS[row.original.branchId] ?? row.original.branchId) : null
      return branchLabel ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border">
          🏪 {branchLabel}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-destructive">
          ⚠️ No Access
        </span>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      let variant: any = "pending"
      switch (row.original.status) {
        case 'ACTIVE':      variant = 'active';   break;
        case 'SUSPENDED':   variant = 'warning';  break;
        case 'DEACTIVATED': variant = 'inactive'; break;
        case 'LOCKED':      variant = 'danger';   break;
        case 'INVITED':     variant = 'pending';  break;
      }
      return <StatusBadge status={variant} label={row.original.status} />
    }
  },
  {
    accessorKey: "lastLoginAt",
    header: "Last Login",
    cell: ({ row }) => {
      const dateVal = row.original.lastLoginAt
      if (!dateVal) return <span className="text-muted-foreground text-xs italic">Never</span>
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) return <span className="text-muted-foreground text-xs italic">Never</span>
      return (
        <div className="text-xs font-medium text-foreground">
          {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })},{' '}
          <span className="text-muted-foreground">
            {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        </div>
      )
    }
  }
]
