import * as React from "react"
import { MoreSquare, Edit2, Archive, Copy, Gallery } from "iconsax-react"

export interface Design {
  id: string
  code: string
  name: string
  imageUrl: string
  categories?: any[]
  occasions?: string[]
  themes?: string[]
  labels?: string[]
  status?: string
}

interface DesignCardProps {
  design: Design
  onEdit: (design: Design) => void
  onClone: (design: Design) => void
  onStatusChange: (design: Design, newStatus: string) => void
  onDeleteForever: (design: Design) => void
}

export function DesignCard({ design, onEdit, onClone, onStatusChange, onDeleteForever }: DesignCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)

  // Use Cloudinary optimization for the URL
  // e.g. transform /v12345/ to /c_fill,w_400,h_400,q_auto,f_auto/v12345/
  const getOptimizedUrl = (url: string) => {
    if (!url.includes('cloudinary.com')) return url
    if (url.includes('/upload/v')) {
      return url.replace('/upload/', '/upload/c_fill,w_400,h_400,q_auto,f_auto/')
    }
    return url
  }

  return (
    <div className="group relative bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Image container */}
      <div className="relative aspect-square w-full bg-secondary overflow-hidden">
        {design.imageUrl ? (
          <img 
            src={getOptimizedUrl(design.imageUrl)} 
            alt={design.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Gallery className="w-8 h-8" />
          </div>
        )}
        
        {/* Code Badge */}
        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold font-mono shadow-sm">
          {design.code}
        </div>

        {/* Action Menu */}
        <div className="absolute top-2 right-2">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 bg-background/80 backdrop-blur-sm rounded-md hover:bg-background transition-colors shadow-sm"
          >
            <MoreSquare className="w-4 h-4" />
          </button>
          
          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-md shadow-lg z-50 py-1 overflow-hidden">
                <button 
                  onClick={() => { setMenuOpen(false); onEdit(design); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button 
                  onClick={() => { setMenuOpen(false); onClone(design); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" /> Clone
                </button>
                {design.status !== 'TRASHED' && (
                  <button 
                    onClick={() => { setMenuOpen(false); onStatusChange(design, 'TRASHED'); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
                  >
                    <Archive className="w-3.5 h-3.5" /> Trash
                  </button>
                )}
                {design.status === 'TRASHED' && (
                  <>
                    <button 
                      onClick={() => { setMenuOpen(false); onStatusChange(design, 'ACTIVE'); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-green-500/10 text-green-600 flex items-center gap-2"
                    >
                      <Archive className="w-3.5 h-3.5" /> Restore
                    </button>
                    <button 
                      onClick={() => { setMenuOpen(false); onDeleteForever(design); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
                    >
                      <Archive className="w-3.5 h-3.5" /> Delete Forever
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3 className="font-bold text-foreground text-sm line-clamp-1" title={design.name}>
          {design.name}
        </h3>
        
        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {design.labels?.slice(0, 2).map(l => (
            <span key={l} className="px-1.5 py-0.5 bg-accent text-accent-foreground rounded text-[10px] font-bold whitespace-nowrap">
              {l}
            </span>
          ))}
          {design.themes?.slice(0, 2).map(t => (
            <span key={t} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium whitespace-nowrap">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
