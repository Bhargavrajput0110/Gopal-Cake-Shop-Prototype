import { ArrowRight, ArrowLeftRight, CheckCircle2, Clock, MapPin, XCircle } from "lucide-react";

export default function BranchTransferPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary" /> Branch Transfers
        </h2>
        <p className="text-muted-foreground text-xs">Manage incoming and outgoing cross-branch orders.</p>
      </div>

      {/* Handshake: Incoming Requests */}
      <div>
        <h3 className="text-sm font-bold border-b border-border pb-1.5 text-foreground mb-3">
          Incoming Requests (Awaiting Your Approval)
        </h3>
        <div className="space-y-3">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-bl-lg">
              Action Required
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-base font-black text-foreground">108940</h4>
                  <p className="text-xs font-bold text-muted-foreground">From: <span className="text-foreground">Uma Char Rasta</span></p>
                </div>
                <p className="font-bold text-sm text-foreground">Black Forest Cake (1.5 Kg)</p>
                <div className="mt-2 p-1.5 bg-rose-500/10 border border-rose-500/20 rounded text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                  Reason: Kitchen Overloaded - Need Help!
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <button className="flex-1 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Accept
                </button>
                <button className="flex-1 bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-destructive/20 transition-colors flex items-center justify-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Handshake: Outgoing Requests */}
      <div className="pt-2">
        <h3 className="text-sm font-bold border-b border-border pb-1.5 text-foreground mb-3">
          Outgoing Requests
        </h3>
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm opacity-80">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-sm text-foreground">108925</h4>
                <p className="font-bold text-xs text-muted-foreground">Pineapple Cake (1 Kg)</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                    <MapPin className="w-3 h-3" /> Khanderao
                  </div>
                  <ArrowRight className="w-3 h-3 text-primary" />
                  <div className="flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                    <MapPin className="w-3 h-3" /> Ellora Park
                  </div>
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end">
                <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Pending Handshake
                </span>
                <p className="text-[9px] text-muted-foreground mt-1">Waiting for Ellora Park to accept.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Initiate New Transfer */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-4 mt-6">
        <h3 className="text-sm font-bold text-foreground mb-3 border-b border-border pb-1.5">Initiate New Transfer</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Select Rejected Order</label>
              <select className="w-full p-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-xs font-medium">
                <option value="">Select an order...</option>
                <option value="8922">108922 - Custom Engagement Cake (2Kg)</option>
                <option value="8910">108910 - Vanilla Cupcakes x6</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Select Target Branch</label>
              <select className="w-full p-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-xs font-medium">
                <option value="">Select branch...</option>
                <option value="ellora">Ellora Park (3 km)</option>
                <option value="uma">Uma Char Rasta (4.2 km)</option>
                <option value="factory">Factory Warashiya (6.1 km)</option>
              </select>
            </div>
          </div>
          <div className="space-y-3 flex flex-col justify-end">
             <div>
              <label className="text-xs font-bold text-foreground block mb-1">Reason for Transfer</label>
              <textarea 
                placeholder="Briefly explain why you are sending this order to them..."
                className="w-full p-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-xs resize-none h-14"
              />
            </div>
            <button className="w-full bg-primary text-primary-foreground py-2 rounded-md text-xs font-bold shadow-sm hover:bg-primary/90 transition-transform active:scale-95 flex items-center justify-center gap-1.5">
               Request Handshake
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
