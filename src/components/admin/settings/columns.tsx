import * as React from "react"
import { ColumnDef } from "@/components/ui/data-table"
import { Setting4 } from "iconsax-react"
import { SettingResponseDTO } from "@/dtos/SettingsSchemas"
import { format } from "date-fns"

export const columns: ColumnDef<SettingResponseDTO, any>[] = [
  {
    accessorKey: "key",
    header: "Setting Key",
    cell: ({ row }) => {
      const setting = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Setting4 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-foreground font-mono text-sm">{setting.key}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => {
      return (
        <div className="text-sm font-mono max-w-[300px] truncate bg-muted/30 px-2 py-1 rounded inline-block">
          {row.original.value}
        </div>
      )
    }
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground max-w-[300px] truncate">
          {row.original.description || <span className="italic">No description</span>}
        </div>
      )
    }
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.updatedAt), 'MMM dd, yyyy HH:mm')}
        </div>
      )
    }
  },
]
