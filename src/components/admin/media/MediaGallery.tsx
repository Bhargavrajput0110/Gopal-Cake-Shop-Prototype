'use client'

import { useState, useEffect } from 'react'
import { Trash, Copy, TickSquare, Refresh2, Gallery } from "iconsax-react"
import { Button } from '@/components/ui/button'
import { CloudinaryUploader } from './CloudinaryUploader'

interface MediaAsset {
  id: string
  url: string
  format: string
  width: number
  height: number
  bytes: number
  folder: string | null
  createdAt: string
  uploadedBy?: { name: string, email: string }
}

interface MediaGalleryProps {
  onSelect?: (url: string) => void
  selectable?: boolean
  folder?: string
}

export function MediaGallery({ onSelect, selectable = false, folder }: MediaGalleryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchAssets = async () => {
    try {
      setIsLoading(true)
      const query = folder ? `?folder=${encodeURIComponent(folder)}` : ''
      const res = await fetch(`/api/v1/admin/media${query}`)
      if (!res.ok) throw new Error('Failed to fetch media')
      const data = await res.json()
      setAssets(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [folder])

  const handleUploadSuccess = (newAsset: MediaAsset) => {
    setAssets(prev => [newAsset, ...prev])
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) return
    
    try {
      setDeletingId(id)
      const res = await fetch(`/api/v1/admin/media/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to delete')
      setAssets(prev => prev.filter(asset => asset.id !== id))
    } catch (err) {
      console.error(err)
      alert('Failed to delete asset')
    } finally {
      setDeletingId(null)
    }
  }

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Upload New Media</h3>
        <CloudinaryUploader onUploadSuccess={handleUploadSuccess} folder={folder} />
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
          <span>Media Library {folder && <span className="text-muted-foreground text-sm font-normal">({folder})</span>}</span>
          <span className="text-sm font-normal text-muted-foreground">{assets.length} items</span>
        </h3>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Refresh2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-secondary/50">
            <Gallery className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No media assets found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map(asset => (
              <div key={asset.id} className="group relative border rounded-md overflow-hidden bg-secondary/20">
                <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                  <img 
                    src={asset.url} 
                    alt={asset.id} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    {selectable && (
                      <Button size="sm" variant="secondary" onClick={() => onSelect?.(asset.url)}>
                        Select Image
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(asset.url, asset.id)}
                        title="Copy URL"
                      >
                        {copiedId === asset.id ? <TickSquare className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="h-8 w-8"
                        onClick={() => handleDelete(asset.id)}
                        disabled={deletingId === asset.id}
                        title="Delete"
                      >
                        {deletingId === asset.id ? <Refresh2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-2 text-xs truncate border-t bg-background">
                  <p className="font-medium truncate" title={asset.id}>{asset.id.split('/').pop()}</p>
                  <p className="text-muted-foreground flex justify-between mt-1">
                    <span>{asset.format.toUpperCase()}</span>
                    <span>{(asset.bytes / 1024).toFixed(1)} KB</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
