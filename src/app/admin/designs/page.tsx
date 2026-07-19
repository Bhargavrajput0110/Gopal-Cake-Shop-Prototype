"use client"

import * as React from "react"
import { Add, SearchNormal1, Gallery, Archive, Edit2 } from "iconsax-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { DesignFormModal } from "./components/DesignFormModal"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { BackButton } from "@/components/ui/BackButton"

export default function AdminDesignsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingDesign, setEditingDesign] = React.useState<any>(null)
  const [designToArchive, setDesignToArchive] = React.useState<string | null>(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await fetchClient<any>('/categories')
      const items = res.data || res
      return Array.isArray(items) ? items : []
    }
  })

  const { data: designsPayload, isLoading } = useQuery({
    queryKey: ['admin-designs', search, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedCategory !== 'all') params.append('categoryId', selectedCategory)
      const res = await fetchClient<any>(`/designs?${params.toString()}`)
      return res.data || { items: [] }
    }
  })
  
  const designs = designsPayload?.items || []

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchClient(`/designs/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-designs'] })
      setDesignToArchive(null)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="mb-2">
            <BackButton fallback="/admin" label="Back" variant="outline" size="sm" />
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Design Library</h1>
          <p className="text-muted-foreground font-bold text-sm">Manage reusable cake designs</p>
        </div>
        <Button onClick={() => { setEditingDesign(null); setIsModalOpen(true); }} className="font-bold">
          <Add className="w-4 h-4 mr-2" /> Upload Design
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, code, tags, themes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none font-semibold min-w-[200px]"
        >
          <option value="all">All Categories</option>
          {categories.map((c: any) => (
            <option key={c.categoryId || c.id} value={c.categoryId || c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : designs.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border text-muted-foreground">
          <Gallery className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-bold">No designs found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {designs.map((design: any) => (
            <div key={design.id} className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="aspect-square bg-muted relative overflow-hidden flex items-center justify-center">
                {design.imageUrl ? (
                  <img src={design.imageUrl} alt={design.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Gallery className="w-8 h-8 text-muted-foreground opacity-50" />
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => { setEditingDesign(design); setIsModalOpen(true); }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDesignToArchive(design.id)}
                    className="p-2 bg-white/10 hover:bg-destructive/80 rounded-full text-white backdrop-blur-sm transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-black text-foreground truncate">{design.name}</h3>
                </div>
                <p className="text-xs font-bold text-muted-foreground font-mono">{design.code}</p>
                
                <div className="mt-3 flex flex-wrap gap-1 mt-auto">
                  {design.tags?.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider font-bold bg-secondary/50 text-secondary-foreground px-1.5 py-0.5 rounded-sm">
                      {tag}
                    </span>
                  ))}
                  {design.tags?.length > 3 && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm">
                      +{design.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <DesignFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingDesign}
          categories={categories}
        />
      )}

      <ConfirmationDialog
        isOpen={!!designToArchive}
        onClose={() => setDesignToArchive(null)}
        onConfirm={() => {
          if (designToArchive) archiveMutation.mutate(designToArchive)
        }}
        title="Archive Design"
        description="Are you sure you want to archive this design? It will no longer be available for new orders."
        confirmText="Archive Design"
        variant="danger"
        isLoading={archiveMutation.isPending}
      />
    </div>
  )
}
