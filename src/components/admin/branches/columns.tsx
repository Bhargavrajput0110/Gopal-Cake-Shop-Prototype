import * as React from "react"
import { ColumnDef } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Shop } from "iconsax-react"
import { BranchResponseDTO } from "@/dtos/BranchSchemas"

export const columns: ColumnDef<BranchResponseDTO, any>[] = [
  {
    accessorKey: "name",
    header: "Branch Info",
    cell: ({ row }) => {
      const branch = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Shop className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-foreground">{branch.name}</p>
            <p className="text-xs text-muted-foreground uppercase">{branch.code}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "address",
    header: "Location",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground max-w-[200px] truncate">
          {row.original.address}
        </div>
      )
    }
  },
  {
    accessorKey: "phone",
    header: "Contact",
    cell: ({ row }) => {
      return (
        <div className="text-sm font-medium">
          {row.original.phone || <span className="text-muted-foreground italic">No phone</span>}
        </div>
      )
    }
  },
  {
    accessorKey: "deliveryEnabled",
    header: "Delivery",
    cell: ({ row }) => {
      return (
        <StatusBadge status={row.original.deliveryEnabled ? "active" : "inactive"} />
      )
    }
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      return (
        <StatusBadge status={row.original.isActive ? "active" : "inactive"} />
      )
    }
  }
]
