import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Define generic types for KDSBoard so it doesn't strictly depend on ChefOrderDTO
export type KDSOrder = {
  id: string
  status: string
  // Add other required fields for rendering the ticket, but we'll accept a render function for max flexibility
}

type KDSStage = {
  id: string
  label: string
  statuses: string[]
}

const DEFAULT_STAGES: KDSStage[] = [
  { id: 'NEW', label: 'New Orders', statuses: ['NEW', 'WAITING_FOR_CHEF'] },
  { id: 'accepted', label: 'Accepted', statuses: ['CHEF_ACCEPTED'] },
  { id: 'making', label: 'Making', statuses: ['MAKING'] },
  { id: 'DECORATING', label: 'DECORATING', statuses: ['DECORATING'] }
]

export interface KDSBoardProps<T extends KDSOrder> {
  orders: T[]
  stages?: KDSStage[]
  renderTicket: (order: T) => React.ReactNode
}

export function KDSBoard<T extends KDSOrder>({ orders, stages = DEFAULT_STAGES, renderTicket }: KDSBoardProps<T>) {
  return (
    <div className="flex h-full gap-4 overflow-x-auto p-4 snap-x bg-background w-full">
      {stages.map(stage => {
        const laneOrders = orders.filter(o => stage.statuses.includes(o.status))
        
        return (
          <div key={stage.id} className="flex flex-col min-w-[320px] w-[320px] max-w-[320px] bg-muted/20 border rounded-xl overflow-hidden snap-start shrink-0">
            <div className="p-3 bg-muted/50 border-b flex justify-between items-center shrink-0">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">{stage.label}</h3>
              <span className="bg-background text-foreground text-xs font-black px-2 py-0.5 rounded-full border shadow-sm">
                {laneOrders.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {laneOrders.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                  No orders
                </div>
              ) : (
                <AnimatePresence>
                  {laneOrders.map(order => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      {renderTicket(order)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
