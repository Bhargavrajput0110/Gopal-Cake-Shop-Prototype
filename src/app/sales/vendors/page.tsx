import { Store, Camera, Flower2, Wand2, Plus, Clock } from "lucide-react";

export default function VendorManagementPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" /> Vendor Coordination
          </h2>
          <p className="text-muted-foreground text-sm">Assign and track external vendors for specialized cakes.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Register New Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vendor Columns */}
        
        {/* Photographers */}
        <div className="bg-secondary/20 border border-border rounded-xl flex flex-col h-[70vh]">
          <div className="p-4 border-b border-border/50 bg-card rounded-t-xl shrink-0 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Camera className="w-5 h-5" /> Photographers
            </h3>
            <span className="text-xs bg-secondary px-2 py-1 rounded-full font-bold">1 Active</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Task Card */}
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm">108902</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">Pending Auth</span>
              </div>
              <p className="text-sm font-medium">3-Tier Wedding Cake Shoot</p>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: Tomorrow, 2 PM</span>
                <button className="text-primary font-bold hover:underline">Re-assign</button>
              </div>
            </div>
          </div>
        </div>

        {/* Florists */}
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl flex flex-col h-[70vh]">
          <div className="p-4 border-b border-rose-500/20 bg-rose-500/10 rounded-t-xl shrink-0 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Flower2 className="w-5 h-5" /> Florists
            </h3>
            <span className="text-xs bg-rose-500 text-white px-2 py-1 rounded-full font-bold">2 Active</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {/* Task Card */}
             <div className="bg-card p-4 rounded-xl shadow-sm border border-rose-500/30">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm">108922</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">Dispatched</span>
              </div>
              <p className="text-sm font-medium">1x Red Rose Bouquet</p>
              <p className="text-xs text-muted-foreground mt-1">Assigned to: Patel Florists</p>
            </div>
             <div className="bg-card p-4 rounded-xl shadow-sm border border-rose-500/30">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm">108915</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded">Completed</span>
              </div>
              <p className="text-sm font-medium">White Lilies Decoration</p>
              <p className="text-xs text-muted-foreground mt-1">Assigned to: Royal Floral</p>
            </div>
          </div>
        </div>

        {/* Acrylic Artists */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl flex flex-col h-[70vh]">
          <div className="p-4 border-b border-blue-500/20 bg-blue-500/10 rounded-t-xl shrink-0 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Wand2 className="w-5 h-5" /> Acrylic Toppers
            </h3>
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-bold">0 Active</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center text-muted-foreground">
            <p className="text-sm font-medium">No active tasks</p>
          </div>
        </div>

      </div>
    </div>
  );
}
