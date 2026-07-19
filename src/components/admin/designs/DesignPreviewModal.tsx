import * as React from "react"
import { CloseSquare, Copy, ShoppingCart, Tag } from "iconsax-react"
import { Button } from "@/components/ui/button"
import { Design } from "./DesignCard"

interface DesignPreviewModalProps {
  design: Design | null
  isOpen: boolean
  onClose: () => void
  onCopyToOrder?: (design: Design) => void
}

export function DesignPreviewModal({ design, isOpen, onClose, onCopyToOrder }: DesignPreviewModalProps) {
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
      // Wait, we have getRelatedDesigns in the backend. 
      // But we can just use the search API with tags for now.
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
      
      <div className="relative w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-background/50 hover:bg-background rounded-full z-10 transition-colors"
        >
          <CloseSquare className="w-5 h-5" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-secondary/50 flex items-center justify-center p-6 h-1/2 md:h-full">
          <img 
            src={getOptimizedUrl(design.imageUrl)} 
            alt={design.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
          />
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full overflow-y-auto custom-scrollbar p-6 lg:p-8">
          
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-primary/10 text-primary font-mono text-xs font-bold rounded">
              {design.code}
            </span>
            {(design as any).status === 'ACTIVE' ? (
              <span className="px-2 py-1 bg-green-500/10 text-green-600 font-bold text-xs rounded">ACTIVE</span>
            ) : (
              <span className="px-2 py-1 bg-muted text-muted-foreground font-bold text-xs rounded">{(design as any).status}</span>
            )}
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-4">{design.name}</h2>
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            {design.themes && design.themes.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 font-medium">Themes</p>
                <div className="flex flex-wrap gap-1">
                  {design.themes.map(t => <span key={t} className="px-2 py-1 bg-muted rounded text-xs">{t}</span>)}
                </div>
              </div>
            )}
            {(design as any).occasions && (design as any).occasions.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 font-medium">Occasions</p>
                <div className="flex flex-wrap gap-1">
                  {(design as any).occasions.map((o: string) => <span key={o} className="px-2 py-1 bg-muted rounded text-xs">{o}</span>)}
                </div>
              </div>
            )}
            {(design as any).recommendedWeight && (
              <div>
                <p className="text-muted-foreground mb-1 font-medium">Recommended Weight</p>
                <p className="font-semibold">{(design as any).recommendedWeight}</p>
              </div>
            )}
            {(design as any).recommendedTier && (
              <div>
                <p className="text-muted-foreground mb-1 font-medium">Tiers</p>
                <p className="font-semibold">{(design as any).recommendedTier}</p>
              </div>
            )}
            {(design as any).difficulty && (
              <div>
                <p className="text-muted-foreground mb-1 font-medium">Difficulty</p>
                <p className="font-semibold">{(design as any).difficulty}</p>
              </div>
            )}
            {(design as any).age && (
              <div>
                <p className="text-muted-foreground mb-1 font-medium">Age Group</p>
                <p className="font-semibold">{(design as any).age}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground mb-1 font-medium">Eggless Only?</p>
              <p className="font-semibold">{(design as any).isEggless ? "Yes" : "No"}</p>
            </div>
          </div>

          {/* Labels */}
          {(design as any).labels && (design as any).labels.length > 0 && (
            <div className="mb-6">
              <p className="text-muted-foreground mb-2 font-medium flex items-center gap-1"><Tag className="w-4 h-4"/> Labels</p>
              <div className="flex flex-wrap gap-2">
                {(design as any).labels.map((l: string) => (
                  <span key={l} className="px-2.5 py-1 bg-accent text-accent-foreground font-bold rounded-full text-xs">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-auto pt-6 mb-8">
            <Button 
              size="lg" 
              className="w-full text-base"
              onClick={() => onCopyToOrder && onCopyToOrder(design)}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Copy Design to Order
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
