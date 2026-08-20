import * as React from "react"
import { CloseSquare, Copy, ShoppingCart, Tag } from "iconsax-react"
import { Button } from "@/components/ui/button"
import { Design } from "./DesignCard"

interface DesignPreviewModalProps {
  design: Design | null
  isOpen: boolean
  onClose: () => void
  onCopyToOrder?: (design: Design) => void
  onEdit?: (design: Design) => void
  onDelete?: (design: Design) => void | Promise<void>
}

export function DesignPreviewModal({ design, isOpen, onClose, onCopyToOrder, onEdit, onDelete }: DesignPreviewModalProps) {
  const [relatedDesigns, setRelatedDesigns] = React.useState<Design[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = React.useState(false)

  React.useEffect(() => {
    if (isOpen && design) {
      // Fetch related designs
      const fetchRelated = async () => {
        setIsLoadingRelated(true)
        try {
          const res = await fetch(`/api/v1/designs?search=${design.labels?.join(' ') || design.themes?.join(' ')}&limit=5`)
          if (res.ok) {
            const data = await res.json()
            setRelatedDesigns(data.data.items.filter((d: Design) => d.id !== design.id).slice(0, 4))
          }
        } catch (error) {
          console.error(error)
        } finally {
          setIsLoadingRelated(false)
        }
      }
      fetchRelated()
    }
  }, [isOpen, design])

  if (!isOpen || !design) return null

  // Optimize main image
  const getOptimizedUrl = (url: string) => {
    if (!url.includes('cloudinary.com')) return url
    if (url.includes('/upload/v')) {
      return url.replace('/upload/', '/upload/c_fit,w_1024,h_1024,q_auto,f_auto/')
    }
    return url
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[75vh]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-background/50 hover:bg-background rounded-full z-10 transition-colors"
        >
          <CloseSquare className="w-5 h-5" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-secondary/30 flex items-center justify-center p-6 h-1/2 md:h-full border-r border-border/50">
          <img 
            src={getOptimizedUrl(design.imageUrl)} 
            alt={design.name}
            className="max-w-full max-h-full object-contain drop-shadow-xl"
          />
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full overflow-y-auto custom-scrollbar p-6 lg:p-8">
          
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-primary/10 text-primary font-mono text-xs font-bold rounded">
              {design.code}
            </span>
            {(design as any).status === 'ACTIVE' ? (
              <span className="px-2.5 py-1 bg-green-500/10 text-green-600 font-bold text-xs rounded">ACTIVE</span>
            ) : (
              <span className="px-2.5 py-1 bg-muted text-muted-foreground font-bold text-xs rounded">{(design as any).status}</span>
            )}
          </div>

          <h2 className="text-2xl font-black text-foreground mb-6 leading-tight">{design.name}</h2>
          
          {/* Metadata Simple */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <span className="text-muted-foreground text-sm font-medium">Eggless Only?</span>
              <span className="font-bold text-sm">{(design as any).isEggless ? "Yes" : "No"}</span>
            </div>
            {(design as any).recommendedWeight && (
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground text-sm font-medium">Recommended Weight</span>
                <span className="font-bold text-sm">{(design as any).recommendedWeight}</span>
              </div>
            )}
            {(design as any).recommendedTier && (
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground text-sm font-medium">Tiers</span>
                <span className="font-bold text-sm">{(design as any).recommendedTier}</span>
              </div>
            )}
            
            {(design as any).labels && (design as any).labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(design as any).labels.map((l: string) => (
                  <span key={l} className="px-3 py-1 bg-accent/50 text-accent-foreground font-bold rounded-full text-xs">
                    {l}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-6 space-y-3">
            <div className="flex gap-3">
              {onEdit && (
                <Button 
                  variant="outline"
                  size="lg" 
                  className="flex-1 font-bold border-2 border-primary text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => onEdit(design)}
                >
                  ✏️ Edit
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="outline"
                  size="lg" 
                  className="flex-1 font-bold border-2 border-destructive text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => onDelete(design)}
                >
                  🗑️ Delete
                </Button>
              )}
            </div>
            <Button 
              size="lg" 
              className="w-full text-base font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
              onClick={() => onCopyToOrder && onCopyToOrder(design)}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Copy to Order
            </Button>
          </div>

          {/* Related Designs */}
          {relatedDesigns.length > 0 && (
            <div className="border-t border-border pt-6 mt-6">
              <h3 className="font-bold text-foreground mb-4">Similar Designs</h3>
              <div className="grid grid-cols-4 gap-2">
                {relatedDesigns.map(rd => (
                  <div key={rd.id} className="aspect-square bg-secondary rounded-md overflow-hidden relative group cursor-pointer border border-border">
                    <img 
                      src={getOptimizedUrl(rd.imageUrl).replace('w_1024', 'w_200').replace('h_1024', 'h_200')} 
                      alt={rd.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
