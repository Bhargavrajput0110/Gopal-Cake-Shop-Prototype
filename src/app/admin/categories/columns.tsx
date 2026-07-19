import * as React from "react"
import { ColumnDef } from "@/components/ui/data-table"
import { StatusBadge, BadgeStatus } from "@/components/ui/status-badge"
import { FolderConnection } from "iconsax-react"

export type Category = {
  id: string
  categoryId: string
  name: string
  displayOrder: number
  status: string
  updatedAt?: string
}

export const columns: ColumnDef<Category, any>[] = [
  {
    accessorKey: "name",
    header: "Category Name",
    cell: ({ row }) => {
      const category = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <FolderConnection className="w-5 h-5" />
          </div>
          <p className="font-bold text-foreground">{category.name}</p>
        </div>
      )
    },
  },
  {
    accessorKey: "categoryId",
    header: "ID / Slug",
    cell: ({ row }) => {
      return (
        <code className="px-2 py-1 bg-secondary rounded text-xs text-muted-foreground font-medium">
          {row.original.categoryId}
        </code>
      )
    },
  },
  {
    accessorKey: "displayOrder",
    header: "Display Order",
    cell: ({ row }) => {
      return (
        <span className="font-medium text-foreground">
          {row.original.displayOrder}
        </span>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <StatusBadge status={row.original.status as BadgeStatus} />
    }
  }
]
