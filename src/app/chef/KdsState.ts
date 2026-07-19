import { create } from 'zustand'

export type KdsFilter = 'ALL' | 'TODAY' | 'NEXT_2_HOURS' | 'URGENT' | 'LATE' | 'ASSIGNED_TO_ME' | 'PHOTO_CAKES' | 'WEDDING_CAKES'

export type SoundMuteOption = 'NONE' | '30_MIN' | 'TODAY' | 'ALWAYS'

interface KdsState {
  filter: KdsFilter
  searchQuery: string
  soundMuteOption: SoundMuteOption
  muteUntil: number | null
  rushMode: boolean
  
  // Batch State
  batchMode: boolean
  selectedItemIds: Set<string>
  
  setFilter: (f: KdsFilter) => void
  setSearchQuery: (q: string) => void
  setSoundMuteOption: (opt: SoundMuteOption) => void
  toggleRushMode: () => void
  
  toggleBatchMode: () => void
  toggleSelection: (id: string) => void
  clearSelection: () => void
}

export const useKdsStore = create<KdsState>((set) => ({
  filter: 'ALL',
  searchQuery: '',
  soundMuteOption: 'NONE',
  muteUntil: null,
  rushMode: false,
  
  batchMode: false,
  selectedItemIds: new Set(),
  
  setFilter: (f) => set({ filter: f }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSoundMuteOption: (opt) => set((state) => {
    let muteUntil = null
    const now = Date.now()
    if (opt === '30_MIN') muteUntil = now + 30 * 60000
    if (opt === 'TODAY') {
      const eod = new Date()
      eod.setHours(23, 59, 59, 999)
      muteUntil = eod.getTime()
    }
    return { soundMuteOption: opt, muteUntil }
  }),
  toggleRushMode: () => set((state) => ({ rushMode: !state.rushMode })),
  
  toggleBatchMode: () => set((state) => ({ batchMode: !state.batchMode, selectedItemIds: state.batchMode ? new Set() : state.selectedItemIds })),
  toggleSelection: (id) => set((state) => {
    const newSet = new Set(state.selectedItemIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    return { selectedItemIds: newSet }
  }),
  clearSelection: () => set({ selectedItemIds: new Set(), batchMode: false })
}))
