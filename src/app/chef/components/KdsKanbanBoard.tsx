import * as React from "react"
import { ChefProductionItemDTO } from "@/dtos/OrderSchemas"
import { ProductionCard } from "./ProductionCard"
import { useKdsStore } from "../KdsState"

interface KdsKanbanBoardProps {
  items: ChefProductionItemDTO[]
}

const COLUMNS = [
  { id: 'WAITING_FOR_CHEF', label: 'Waiting' },
  { id: 'CHEF_ACCEPTED', label: 'Accepted' },
  { id: 'MAKING', label: 'Making' },
  { id: 'DECORATING', label: 'DECORATING' },
  { id: 'QC_PENDING', label: 'QC' },
  { id: 'PACKED', label: 'Packed' },
  { id: 'READY_FOR_PICKUP', label: 'Ready' },
]

export function KdsKanbanBoard({ items }: KdsKanbanBoardProps) {
  const { batchMode, selectedItemIds, toggleSelection } = useKdsStore()
  
  return (
    <div className="flex h-full overflow-x-auto gap-4 p-4 pb-8 snap-x">
      {COLUMNS.map(column => {
        const columnItems = items.filter(i => i.status === column.id)
        
        return (
          <div key={column.id} className="flex flex-col w-[340px] shrink-0 bg-white/40 backdrop-blur-md rounded-[2rem] border border-border/40 overflow-hidden snap-center shadow-[0_8px_32px_0_rgba(74,59,53,0.02)]">
            <div className="p-4 bg-white/50 border-b border-border/30 flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold text-foreground">{column.label}</h3>
              <span className="bg-secondary/10 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest shadow-sm text-secondary border border-secondary/20">
                {columnItems.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {columnItems.map((item, idx) => (
                <div key={item.id} className="relative flex items-stretch gap-2">
                  {batchMode && (
                    <div className="flex items-center justify-center shrink-0">
                      <input 
                        type="checkbox" 
                        checked={selectedItemIds.has(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="w-6 h-6 rounded accent-primary border-border cursor-pointer shadow-sm"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <ProductionCard item={item} queueNumber={idx + 1} />
                  </div>
                </div>
              ))}
              {columnItems.length === 0 && (
                <div className="h-full flex items-center justify-center text-muted-foreground opacity-50 text-sm font-bold">
                  Empty
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
