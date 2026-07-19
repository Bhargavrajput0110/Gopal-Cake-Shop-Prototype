import * as React from "react"
import { SearchNormal1 } from "iconsax-react"

export interface Category {
  categoryId: string
  name: string
  productId?: string // Keeping legacy type structure
}

interface ProductFiltersProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  selectedCategory: string
  setSelectedCategory: (val: string) => void
  categories: Category[]
  isArchived: boolean
  setIsArchived: (val: boolean) => void
}

export function ProductFilters({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  isArchived,
  setIsArchived
}: ProductFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 w-full items-center">
      <div className="relative flex-1 w-full">
        <SearchNormal1 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search products by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>
      <select 
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="w-full md:w-64 px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
      >
        <option value="all">All Categories</option>
        {categories.map(c => (
          <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer">
        <input 
          type="checkbox" 
          checked={isArchived}
          onChange={(e) => setIsArchived(e.target.checked)}
          className="rounded border-border text-primary focus:ring-primary/50"
        />
        Show Archived
      </label>
    </div>
  )
}
