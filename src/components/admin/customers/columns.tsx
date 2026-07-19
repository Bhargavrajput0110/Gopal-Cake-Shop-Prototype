import * as React from "react"
import { ColumnDef } from "@/components/ui/data-table"
import { Profile2User } from "iconsax-react"
import { CustomerResponseDTO } from "@/dtos/CustomerSchemas"
import { StatusBadge } from "@/components/ui/status-badge"

export const columns: ColumnDef<CustomerResponseDTO, any>[] = [
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Profile2User className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-foreground">{customer.name}</p>
            <p className="text-xs text-muted-foreground">{customer.phone}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {row.original.email ? (
            <a href={`mailto:${row.original.email}`} className="text-primary hover:underline">{row.original.email}</a>
          ) : (
            <span className="text-muted-foreground italic">No email</span>
          )}
        </div>
      )
    }
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground max-w-[200px] truncate">
          {row.original.address || <span className="italic">No address</span>}
        </div>
      )
    }
  },
  {
    accessorKey: "totalOrders",
    header: "Total Orders",
    cell: ({ row }) => {
      return (
        <div className="text-sm font-bold">
          {row.original.totalOrders}
        </div>
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
