import * as React from "react"
import { CloudPlus, CloseSquare, TickCircle, Danger } from "iconsax-react"
import { Button } from "@/components/ui/button"

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [files, setFiles] = React.useState<File[]>([])
  const [isUploading, setIsUploading] = React.useState(false)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setIsUploading(true)
    
    // Simulate upload process to DRAFT status
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsUploading(false)
    setStep(2)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-full transition-colors"
        >
          <CloseSquare className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">Bulk Import Designs</h2>

        {step === 1 && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-secondary/50">
              <CloudPlus className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Drag & drop images here</p>
              <p className="text-xs text-muted-foreground mb-4">Support .png, .jpg up to 5MB each</p>
              <label className="cursor-pointer">
                <input 
                  id="bulk-import-file"
                  type="file" 
                  multiple 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <Button variant="outline" type="button" onClick={() => document.getElementById('bulk-import-file')?.click()}>
                  Select Files
                </Button>
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="text-sm">
                <p className="font-medium mb-2">{files.length} files selected:</p>
                <ul className="text-muted-foreground text-xs space-y-1 max-h-24 overflow-y-auto">
                  {files.map((f, i) => <li key={i}>{f.name}</li>)}
                </ul>
              </div>
            )}

            <Button 
              className="w-full" 
              disabled={files.length === 0 || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? "Uploading..." : `Upload ${files.length} Designs`}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center py-8">
            <TickCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-lg font-bold mb-2">Upload Complete!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {files.length} designs have been uploaded to your catalog as <span className="font-bold">DRAFT</span>.
            </p>
            <p className="text-sm bg-accent/50 p-4 rounded-md text-accent-foreground mb-6">
              You can now browse the <strong>DRAFT</strong> tab in your library to tag and publish these designs when you're ready. Your Sales team won't see them until they are published.
            </p>
            <Button className="w-full" onClick={() => {
              setStep(1);
              setFiles([]);
              onClose();
            }}>
              Go to Drafts
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
