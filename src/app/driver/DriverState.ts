import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DriverOrderDTO } from '@/dtos/OrderSchemas'
import { fetchClient } from '@/lib/api/client'
export interface SyncDriverActionDTO {
  orderId: string
  action: string
  timestamp: string
  [key: string]: any
}

interface DriverState {
  tasks: DriverOrderDTO[]
  offlineQueue: SyncDriverActionDTO[]
  isOnline: boolean
  lastSyncAt: number | null
  activeDriver: { id: string, name: string } | null
  
  setTasks: (tasks: DriverOrderDTO[]) => void
  setOnlineStatus: (isOnline: boolean) => void
  queueAction: (action: SyncDriverActionDTO) => void
  clearQueue: () => void
  syncQueue: () => Promise<void>
  setActiveDriver: (driver: { id: string, name: string } | null) => void
  
  // Optimistic updates
  optimisticUpdateTask: (orderId: string, updates: Partial<DriverOrderDTO>) => void
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      tasks: [],
      offlineQueue: [],
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
      lastSyncAt: null,
      activeDriver: null,
      
      setTasks: (tasks) => set({ tasks }),
      
      setOnlineStatus: (isOnline) => set({ isOnline }),
      
      setActiveDriver: (driver) => set({ activeDriver: driver }),

      queueAction: (action) => {
        set((state) => ({ offlineQueue: [...state.offlineQueue, action] }))
      },
      
      clearQueue: () => set({ offlineQueue: [] }),
      
      optimisticUpdateTask: (orderId, updates) => {
        set((state) => ({
          tasks: state.tasks.map(d => 
            d.id === orderId ? { ...d, ...updates } : d
          )
        }))
      },
      
      syncQueue: async () => {
        const state = get()
        if (state.offlineQueue.length === 0 || !state.isOnline) return
        
        try {
          const res = await fetchClient<{synced: any[]}>('/driver/tasks/sync', {
            method: 'POST',
            body: JSON.stringify({ actions: state.offlineQueue })
          })
          
          if (res && res.synced) {
            // Remove successful ones from queue
            const successIds = new Set(res.synced.filter(r => r.success).map(r => r.orderId))
            set((s) => ({
              offlineQueue: s.offlineQueue.filter(a => !successIds.has(a.orderId)),
              lastSyncAt: Date.now()
            }))
          }
        } catch (error) {
          console.error("Failed to sync queue:", error)
        }
      }
    }),
    {
      name: 'bakery-driver-storage',
      partialize: (state) => ({ offlineQueue: state.offlineQueue }) // Only persist the queue
    }
  )
)
