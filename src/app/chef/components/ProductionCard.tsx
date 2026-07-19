import * as React from "react"
import { ChefProductionItemDTO } from "@/dtos/OrderSchemas"
import { Button } from "@/components/ui/button"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"
import { QcChecklistModal } from "./QcChecklistModal"
import { PauseModal, IngredientRequestModal, ImageModal } from "./ActionModals"
import { PackingChecklistModal } from "./PackingChecklistModal"
import { Camera, ArrowDown2, ArrowUp2, Clock, Gallery, Pause, Warning2, Message } from "iconsax-react"

interface ProductionCardProps {
  item: ChefProductionItemDTO
  queueNumber?: number
}

export function ProductionCard({ item, queueNumber }: ProductionCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const queryClient = useQueryClient()
  const [minsUntilDue, setMinsUntilDue] = React.useState(0)
  const [elapsedMins, setElapsedMins] = React.useState(0)
  
  // Modals state
  const [showQcModal, setShowQcModal] = React.useState(false)
  const [showPackingModal, setShowPackingModal] = React.useState(false)
  const [showPauseModal, setShowPauseModal] = React.useState(false)
  const [showHelpModal, setShowHelpModal] = React.useState(false)
  const [fullscreenImage, setFullscreenImage] = React.useState<string | null>(null)
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Timer Updates
  React.useEffect(() => {
    const calcTimers = () => {
      const now = new Date()
      if (item.startedAt) {
        setElapsedMins(Math.floor((now.getTime() - new Date(item.startedAt).getTime()) / 60000))
      }
      setMinsUntilDue(Math.floor((new Date(item.targetDate).getTime() - now.getTime()) / 60000))
    }
    calcTimers()
    const interval = setInterval(calcTimers, 60000)
    return () => clearInterval(interval)
  }, [item.startedAt, item.targetDate])

  const statusMutation = useMutation({
    mutationFn: (args: { action: string, pauseReason?: string, status?: string }) => fetchClient(`/chef/production/${item.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(args)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chef-production'] })
    },
    onError: (err: any) => {
      alert(err.message || "An error occurred");
    }
  })

  const isLate = minsUntilDue < 0
  const isUrgent = minsUntilDue >= 0 && minsUntilDue <= 60
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Stub for uploading a photo.
    // In reality, this would upload to Cloudinary and attach to `OrderItemMedia`
    alert("Photo uploaded successfully!")
  }

  return (
    <div className={`relative bg-white/90 backdrop-blur-sm rounded-[1.5rem] border overflow-hidden transition-all duration-300 ${!!item.pauseReason ? 'opacity-80' : ''} ${isLate ? 'border-rose-300 shadow-[0_8px_32px_0_rgba(225,29,72,0.12)]' : 'border-white shadow-sm hover:shadow-md'}`}>
      
      {/* Pause Overlay */}
      {!!item.pauseReason && (
        <div className={`p-4 transition-colors ${item.pauseReason ? 'bg-rose-50 border-b-rose-100 border-b' : ''}`}>
          {item.pauseReason && (
            <>
              <div className="bg-rose-100 text-rose-700 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
                <Pause className="w-3 h-3" /> Blocked
              </div>
              <p className="font-serif italic text-sm text-rose-900">{item.pauseReason}</p>
            </>
          )}
          <Button 
            size="sm" 
            className="mt-4 font-bold rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] uppercase tracking-widest px-4"
            onClick={() => statusMutation.mutate({ action: 'RESUME_PRODUCTION' })}
            disabled={statusMutation.isPending}
          >
            Resume Production
          </Button>
        </div>
      )}

      {/* Top Banner (Priority/Due) */}
      <div className={`px-4 py-2 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold ${isLate ? 'bg-rose-600 text-white' : isUrgent ? 'bg-amber-500 text-white' : 'bg-primary/5 text-primary border-b border-primary/10'}`}>
        <span>{queueNumber ? `#${queueNumber} • ` : ''}{item.orderNumber} • Seq #{item.sequenceNumber}</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {isLate ? `LATE BY ${Math.abs(minsUntilDue)}M` : `DUE IN ${minsUntilDue}M`}
        </div>
      </div>

      <div className="p-3">
        {/* Core Info (Always visible) */}
        <div className="flex gap-3">
          <div className="w-16 h-16 bg-muted rounded overflow-hidden flex items-center justify-center shrink-0">
            {item.designImageUrl ? (
              <img src={item.designImageUrl} className="w-full h-full object-cover" />
            ) : (
              <Gallery className="w-6 h-6 text-muted-foreground/50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground text-sm leading-tight mb-1">{item.productName}</h4>
            <div className="flex flex-wrap gap-1">
              <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-bold">{item.weight}kg</span>
              {item.boxCount > 1 && (
                <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-bold">{item.boxCount} Boxes</span>
              )}
            </div>
            {item.childItems && item.childItems.filter((c: any) => c.assignedVendorId && c.status !== 'READY_FOR_PICKUP' && c.status !== 'COMPLETED').length > 0 && (
              <div className="mt-2 text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">
                ⏳ Waiting for: {item.childItems.filter((c: any) => c.assignedVendorId && c.status !== 'READY_FOR_PICKUP' && c.status !== 'COMPLETED').map((c: any) => c.productName).join(', ')}
              </div>
            )}
            {item.startedAt && (
              <div className="text-[10px] text-muted-foreground mt-1">
                Elapsed: <span className={elapsedMins > item.estimatedPrepMinutes ? 'text-destructive font-bold' : ''}>{elapsedMins}m</span> / {item.estimatedPrepMinutes}m
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm animate-in slide-in-from-top-2 duration-200">
            {item.flavor && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flavor</span>
                <span className="font-bold">{item.flavor}</span>
              </div>
            )}
            {item.shape && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shape</span>
                <span className="font-bold">{item.shape}</span>
              </div>
            )}
            {item.messageOnCake && (
              <div className="bg-primary/5 border border-primary/20 p-2 rounded">
                <span className="text-xs text-muted-foreground block mb-0.5">Message</span>
                <span className="font-mono font-bold text-primary">"{item.messageOnCake}"</span>
              </div>
            )}
            {item.notes && (
              <div className="bg-warning/10 border border-warning/20 p-2 rounded">
                <span className="text-xs text-muted-foreground block mb-0.5">Notes</span>
                <span className="font-bold">{item.notes}</span>
              </div>
            )}
            
            {item.designId && (
              <div className="pt-2">
                <span className="text-xs text-muted-foreground block mb-1">Bakery Design</span>
                <div className="flex gap-2 items-center bg-muted/50 p-2 rounded">
                   {item.designImageUrl ? (
                      <img src={item.designImageUrl} className="w-12 h-12 rounded object-cover cursor-pointer hover:opacity-80 border border-border" onClick={() => setFullscreenImage(item.designImageUrl!)} />
                   ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center border border-border"><Gallery className="w-4 h-4 opacity-50" /></div>
                   )}
                   <div>
                     <p className="text-sm font-bold">{item.designName}</p>
                     <p className="text-xs text-muted-foreground font-mono">{item.designCode}</p>
                   </div>
                </div>
              </div>
            )}
            
            {item.referenceImages && item.referenceImages.length > 0 && (
              <div className="pt-2">
                <span className="text-xs text-muted-foreground block mb-1">Customer References</span>
                <div className="flex gap-2 overflow-x-auto pb-2 p-2 bg-muted/20 rounded border border-border/50">
                  {item.referenceImages.map((img, i) => (
                    <img key={i} src={img} className="w-16 h-16 rounded object-cover cursor-pointer hover:opacity-80 border border-border" onClick={() => setFullscreenImage(img)} />
                  ))}
                </div>
              </div>
            )}
            
            {item.notes && item.notes.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-xs text-muted-foreground block mb-1">Kitchen Notes</span>
                <p className="text-foreground text-sm p-2 bg-muted rounded">{item.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-muted rounded text-muted-foreground transition-colors shrink-0"
          >
            {expanded ? <ArrowUp2 className="w-4 h-4" /> : <ArrowDown2 className="w-4 h-4" />}
          </button>
          
          <div className="flex-1 flex gap-2">
            {item.status === 'WAITING_FOR_CHEF' && (
              <Button onClick={() => statusMutation.mutate({ action: 'ACCEPT_ASSIGNMENT' })} className="w-full h-8 text-xs font-bold" disabled={statusMutation.isPending}>Accept</Button>
            )}
            {item.status === 'CHEF_ACCEPTED' && (
              <Button onClick={() => statusMutation.mutate({ action: 'STATUS_UPDATE', status: 'MAKING' })} className="w-full h-8 text-xs font-bold" disabled={statusMutation.isPending}>Start Making</Button>
            )}
            {item.status === 'MAKING' && (
              <Button onClick={() => statusMutation.mutate({ action: 'STATUS_UPDATE', status: 'DECORATING' })} className="w-full h-8 text-xs font-bold" disabled={statusMutation.isPending}>To Decorating</Button>
            )}
            {item.status === 'DECORATING' && (
              <Button onClick={() => statusMutation.mutate({ action: 'STATUS_UPDATE', status: 'QC_PENDING' })} className="w-full h-8 text-xs font-bold" disabled={statusMutation.isPending}>Send to QC</Button>
            )}
            {item.status === 'QC_PENDING' && (
              <Button onClick={() => setShowQcModal(true)} className="w-full h-8 text-xs font-bold" disabled={statusMutation.isPending}>Perform QC</Button>
            )}
            {item.status === 'QC_PASSED' && (
              <Button onClick={() => setShowPackingModal(true)} className="w-full h-8 text-xs font-bold" disabled={statusMutation.isPending}>Verify & Pack</Button>
            )}
            {item.status === 'PACKED' && (
              <Button onClick={() => statusMutation.mutate({ action: 'STATUS_UPDATE', status: 'READY_FOR_PICKUP' })} className="w-full h-8 text-xs font-bold" disabled={statusMutation.isPending}>Ready for Pickup</Button>
            )}
          </div>
        </div>
        
        {/* Helper Actions */}
        {expanded && !item.pauseReason && item.status !== 'WAITING_FOR_CHEF' && (
          <div className="flex justify-between border-t border-border mt-3 pt-3">
            <button className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={() => fileInputRef.current?.click()}>
              <Camera className="w-3 h-3" /> Add Photo
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
            
            <button className="text-xs font-bold text-muted-foreground hover:text-warning flex items-center gap-1" onClick={() => setShowPauseModal(true)}>
              <Pause className="w-3 h-3" /> Block
            </button>
            <button className="text-xs font-bold text-muted-foreground hover:text-destructive flex items-center gap-1" onClick={() => setShowHelpModal(true)}>
              <Warning2 className="w-3 h-3" /> Need Help
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showQcModal && (
        <QcChecklistModal 
          item={item} 
          onClose={() => setShowQcModal(false)} 
          onComplete={() => {
            setShowQcModal(false)
            statusMutation.mutate({ action: 'STATUS_UPDATE', status: 'QC_PASSED' })
          }} 
        />
      )}
      {showPackingModal && (
        <PackingChecklistModal 
          item={item} 
          onClose={() => setShowPackingModal(false)} 
          onComplete={() => {
            setShowPackingModal(false)
            statusMutation.mutate({ action: 'STATUS_UPDATE', status: 'PACKED' })
          }} 
        />
      )}
      {showPauseModal && (
        <PauseModal
          item={item}
          onClose={() => setShowPauseModal(false)}
          onConfirm={(reason) => {
            setShowPauseModal(false)
            statusMutation.mutate({ action: 'PAUSE_PRODUCTION', pauseReason: reason })
          }}
        />
      )}
      {showHelpModal && (
        <IngredientRequestModal
          item={item}
          onClose={() => setShowHelpModal(false)}
          onConfirm={async (reason, note) => {
            setShowHelpModal(false)
            try {
              await fetchClient(`/orders/${item.orderId}/ingredient-request`, {
                method: 'POST',
                body: JSON.stringify({ item: reason, note, requestedBy: "Chef" })
              })
              alert(`Ingredient Request Sent: ${reason}`)
            } catch (err) {
              console.error(err)
            }
          }}
        />
      )}
      {fullscreenImage && (
        <ImageModal imageUrl={fullscreenImage} onClose={() => setFullscreenImage(null)} />
      )}
    </div>
  )
}
