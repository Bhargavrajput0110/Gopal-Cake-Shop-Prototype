import * as React from "react"
import { ColumnDef } from "@/components/ui/data-table"
import { StatusBadge, BadgeStatus } from "@/components/ui/status-badge"
import { Gallery } from "iconsax-react"

export type ProductWithCategory = {
  productId: string
  name: string
  description: string
  price: number
  categoryId: string
  categoryName: string
  images: string[]
  weightOptions?: string[]
  availableFlavors?: string[]

  status: BadgeStatus
}

export const columns: ColumnDef<ProductWithCategory, any>[] = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original
      const image = product.images?.[0]
      
      return (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
            {image ? (
              <img src={image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Gallery className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-bold text-foreground">{product.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{product.description}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "categoryId",
    header: "Category",
    cell: ({ row }) => {
      return (
        <span className="px-3 py-1 bg-secondary rounded-lg text-xs font-bold text-muted-foreground">
          {row.original.categoryName}
        </span>
      )
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      return (
        <div className="font-bold text-foreground">
          ₹{row.original.price}
        </div>
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
