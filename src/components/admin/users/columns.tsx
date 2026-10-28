import * as React from "react"
import { ColumnDef } from "@/components/ui/data-table"
import { UserResponseDTO } from "@/dtos/UserSchemas"
import { StatusBadge } from "@/components/ui/status-badge"
import { Role } from "@prisma/client"
import { ShieldSecurity, More, PauseCircle, PlayCircle, Trash } from "iconsax-react"

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

export const BRANCH_LABELS: Record<string, string> = {
  // Database CUID IDs
  cmswuiiu000021su3kv1mr41f: "Factory Warasiya",
  cmswuiita00011su3977ajl1z: "Khanderao Market",
  cmswuiiun00031su3vfrn9eq5: "Ellora Park",
  // Common codes and slugs
  khanderao:                 "Khanderao Market",
  khd:                       "Khanderao Market",
  uma:                       "Uma Branch",
  warasiya:                  "Factory Warasiya",
  ellorapark:                "Ellora Park",
  market:                    "Khanderao Market",
}

export function getBranchDisplayName(branchId?: string | null, branchMap?: Record<string, string>): string | null {
  if (!branchId) return null
  if (branchMap && branchMap[branchId]) return branchMap[branchId]
  if (BRANCH_LABELS[branchId]) return BRANCH_LABELS[branchId]
  if (BRANCH_LABELS[branchId.toLowerCase()]) return BRANCH_LABELS[branchId.toLowerCase()]
  return branchId
}

function UserRowMenu({
  user,
  onEdit,
  onStatusChange,
}: {
  user: UserResponseDTO
  onEdit: (user: UserResponseDTO) => void
  onStatusChange: (id: string, action: 'SUSPEND' | 'ACTIVATE' | 'DEACTIVATE') => void
}) {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        aria-label="More user options"
        title="More actions"
      >
        <More className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-card border border-border shadow-xl py-1 z-50 text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onEdit(user)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-foreground hover:bg-muted font-medium transition-colors cursor-pointer text-left"
          >
            <ShieldSecurity className="w-3.5 h-3.5 text-primary" />
            Edit Role & Access
          </button>

          {user.status === "ACTIVE" ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onStatusChange(user.id, "SUSPEND")
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-500/10 font-medium transition-colors cursor-pointer text-left"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              Suspend Account
            </button>
          ) : user.status === "SUSPENDED" ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onStatusChange(user.id, "ACTIVATE")
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-500/10 font-medium transition-colors cursor-pointer text-left"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Activate Account
            </button>
          ) : null}

          {user.status !== "DEACTIVATED" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onStatusChange(user.id, "DEACTIVATE")
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 font-medium transition-colors cursor-pointer text-left border-t border-border mt-1"
            >
              <Trash className="w-3.5 h-3.5" />
              Deactivate Account
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function getUserColumns({
  onEdit,
  onStatusChange,
  branchMap,
}: {
  onEdit: (user: UserResponseDTO) => void
  onStatusChange: (id: string, action: 'SUSPEND' | 'ACTIVATE' | 'DEACTIVATE') => void
  branchMap?: Record<string, string>
}): ColumnDef<UserResponseDTO, any>[] {
  return [
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
        const user = row.original
        const role = user.role as Role
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
        if (role === "DELIVERY") {
          const scope = user.deliveryScope
          if (scope === "ALL_BRANCHES" || scope === "GLOBAL" || (!user.branchId && user.email?.includes("global"))) {
            return (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                🌐 All Branches
              </span>
            )
          }
          if (scope && scope.includes(",")) {
            const count = scope.split(",").length
            return (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                🚚 {count} Branches
              </span>
            )
          }
          if (scope === "UMA_WARASHIYA_PLUS_ASSIGNED") {
            return (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                🚚 Uma + Warasiya
              </span>
            )
          }
          const branchLabel = getBranchDisplayName(user.branchId, branchMap)
          if (branchLabel) {
            return (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border">
                🏪 {branchLabel}
              </span>
            )
          }
          if (scope) {
            return (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                🌐 {scope}
              </span>
            )
          }
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md border border-destructive/20">
              ⚠️ No Access
            </span>
          )
        }
        const branchLabel = getBranchDisplayName(user.branchId, branchMap)
        return branchLabel ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border">
            🏪 {branchLabel}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md border border-destructive/20">
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
    },
    {
      id: "actions",
      header: () => (
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right block pr-2">
          Actions
        </span>
      ),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onEdit(user)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Edit roles, branch permissions, and access capabilities"
            >
              <ShieldSecurity className="w-3.5 h-3.5" variant="Bold" />
              Edit Access
            </button>
            <UserRowMenu user={user} onEdit={onEdit} onStatusChange={onStatusChange} />
          </div>
        )
      }
    }
  ]
}

// Fallback export for static usage
export const columns = getUserColumns({
  onEdit: () => {},
  onStatusChange: () => {},
})
