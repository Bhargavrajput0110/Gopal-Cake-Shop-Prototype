import * as React from "react"
import { ColumnDef } from "@/components/ui/data-table"
import { ShieldTick, ShieldCross } from "iconsax-react"
import { UserResponseDTO } from "@/dtos/UserSchemas"
import { StatusBadge } from "@/components/ui/status-badge"

export const columns: ColumnDef<UserResponseDTO, any>[] = [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            {user.role === 'ADMIN' ? <ShieldCross className="w-5 h-5 text-destructive" /> : 
             user.role === 'MANAGER' ? <ShieldTick className="w-5 h-5 text-primary" /> : 
             <ShieldTick className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-bold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      return (
        <div className="text-sm font-bold bg-muted/50 px-2 py-1 rounded inline-block">
          {row.original.role}
        </div>
      )
    }
  },
  {
    accessorKey: "branchId",
    header: "Scope",
    cell: ({ row }) => {
      if (['ADMIN'].includes(row.original.role)) {
        return <span className="text-sm font-bold text-primary">GLOBAL</span>
      }
      return (
        <div className="text-sm">
          {row.original.branchId ? (
            <span className="font-mono bg-muted/30 px-2 py-1 rounded">Branch: {row.original.branchId}</span>
          ) : (
            <span className="text-destructive font-bold text-xs">NO ACCESS (UNASSIGNED)</span>
          )}
        </div>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      // Map AccountStatus to StatusBadge variants (active, inactive, warning, danger, pending)
      let variant: any = "pending"
      switch (row.original.status) {
        case 'ACTIVE': variant = 'active'; break;
        case 'SUSPENDED': variant = 'warning'; break;
        case 'DEACTIVATED': variant = 'inactive'; break;
        case 'LOCKED': variant = 'danger'; break;
        case 'INVITED': variant = 'pending'; break;
      }
      return (
        <StatusBadge status={variant} label={row.original.status} />
      )
    }
  },
  {
    accessorKey: "lastLoginAt",
    header: "Last Login",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {row.original.lastLoginAt ? new Date(row.original.lastLoginAt).toLocaleDateString() : 'Never'}
        </div>
      )
    }
  }
]
