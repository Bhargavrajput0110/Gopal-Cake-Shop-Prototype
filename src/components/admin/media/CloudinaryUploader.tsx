'use client'

import { useState, useRef } from 'react'
import { CloudPlus, CloseSquare, Refresh2, Gallery } from "iconsax-react"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CloudinaryUploaderProps {
  onUploadSuccess: (asset: any) => void
  folder?: string
}

export function CloudinaryUploader({ onUploadSuccess, folder = 'gopal-cake-shop' }: CloudinaryUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      const url = URL.createObjectURL(selected)
      setPreview(url)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped && dropped.type.startsWith('image/')) {
      setFile(dropped)
      const url = URL.createObjectURL(dropped)
      setPreview(url)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await fetch('/api/v1/admin/media', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      const asset = await res.json()
      onUploadSuccess(asset)
      setFile(null)
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error(err)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const clearSelection = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="w-full space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${preview ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50'}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {!preview ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-secondary rounded-full">
              <CloudPlus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Click or drag image to upload</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WEBP (max 5MB)</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </Button>
            <Input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center space-y-4">
            <div className="relative w-full max-w-sm rounded-md overflow-hidden border">
              <img src={preview} alt="Preview" className="w-full h-auto object-cover" />
              <button 
                onClick={clearSelection}
                className="absolute top-2 right-2 p-1 bg-background/80 hover:bg-background rounded-full shadow-sm transition-colors"
              >
                <CloseSquare className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <Button onClick={handleUpload} disabled={isUploading} className="w-full max-w-sm">
              {isUploading ? (
                <>
                  <Refresh2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Image'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
