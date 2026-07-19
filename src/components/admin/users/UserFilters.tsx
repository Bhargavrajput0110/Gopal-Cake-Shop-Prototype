import * as React from "react"
import { SearchNormal1 } from "iconsax-react"

interface UserFiltersProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
}

export function UserFilters({
  searchQuery,
  setSearchQuery,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      <div className="relative flex-1 md:max-w-md">
        <SearchNormal1 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>
    </div>
  )
}
