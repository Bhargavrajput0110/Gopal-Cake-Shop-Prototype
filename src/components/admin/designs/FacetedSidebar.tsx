import * as React from "react"
import { SearchNormal1, ArrowDown2, ArrowUp2 } from "iconsax-react"

export interface FacetOption {
  label: string
  value: string
}

export interface FacetGroup {
  id: string
  label: string
  options: FacetOption[]
}

interface FacetedSidebarProps {
  groups: FacetGroup[]
  selectedFacets: Record<string, string[]>
  onFacetChange: (groupId: string, value: string, checked: boolean) => void
  searchQuery: string
  onSearchChange: (val: string) => void
}

export function FacetedSidebar({
  groups,
  selectedFacets,
  onFacetChange,
  searchQuery,
  onSearchChange
}: FacetedSidebarProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>(
    groups.reduce((acc, g) => ({ ...acc, [g.id]: true }), {})
  )

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="w-full md:w-64 shrink-0 flex flex-col gap-6 bg-card border border-border p-4 rounded-xl shadow-sm h-fit">
      {/* Search */}
      <div className="relative">
        <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search designs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Facets */}
      <div className="flex flex-col gap-4">
        {groups.map(group => {
          const isExpanded = expandedGroups[group.id]
          const selectedInGroup = selectedFacets[group.id] || []

          return (
            <div key={group.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <button 
                onClick={() => toggleGroup(group.id)}
                className="flex items-center justify-between w-full text-left font-bold text-sm text-foreground mb-3"
              >
                <span>{group.label} {selectedInGroup.length > 0 && `(${selectedInGroup.length})`}</span>
                {isExpanded ? <ArrowUp2 className="w-4 h-4 text-muted-foreground" /> : <ArrowDown2 className="w-4 h-4 text-muted-foreground" />}
              </button>
              
              {isExpanded && (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {group.options.map(opt => {
                    const isChecked = selectedInGroup.includes(opt.value)
                    return (
                      <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => onFacetChange(group.id, opt.value, e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary/50 w-4 h-4"
                        />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                          {opt.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
