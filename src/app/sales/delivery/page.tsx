import { Bike, CheckCircle2, MapPin, Package } from "lucide-react";

export default function DeliveryCoordinationPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bike className="w-6 h-6 text-primary" /> Delivery Assignment
          </h2>
          <p className="text-muted-foreground text-sm">Assign ready cakes to riders and monitor their status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cakes Ready for Pickup */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="font-bold border-b border-border pb-2 text-foreground">Ready for Dispatch (Needs Rider)</h3>
          
          <div className="border border-border rounded-xl p-4 bg-secondary/10">
            <div className="flex justify-between items-start mb-2">
              <span className="font-black text-lg">108919</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest">Waiting Assignment</span>
            </div>
            <p className="font-medium text-foreground">Chocolate Truffle (1kg)</p>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Deliver to: Gotri Road</p>
            
            <div className="mt-4 pt-4 border-t border-border flex gap-2">
              <select className="flex-1 p-2 rounded-lg border border-input bg-background text-sm font-medium">
                <option value="">Select Rider for Assignment...</option>
                <option value="r1">Rajesh Kumar &bull; Available (0 Active, 5 Completed Today)</option>
                <option value="r2">Mahesh Bhai &bull; Available (1 Active, 3 Completed Today)</option>
                <option value="r3" disabled className="text-muted-foreground">Suresh Patel &bull; Busy (2 Active Deliveries)</option>
              </select>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">
                Assign
              </button>
            </div>
          </div>
        </div>

        {/* Active Deliveries */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="font-bold border-b border-border pb-2 text-foreground">Active Deliveries</h3>
          
          <div className="border border-blue-500/20 rounded-xl p-4 bg-blue-500/5">
            <div className="flex justify-between items-start mb-2">
              <span className="font-black text-lg">108915</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest flex items-center gap-1">
                <Package className="w-3 h-3" /> Picked Up
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="font-medium text-foreground">Custom Photo Cake</p>
                <p className="text-sm text-muted-foreground mt-1">Assigned to: Rajesh Kumar</p>
              </div>
            </div>
          </div>
          
          <div className="border border-emerald-500/20 rounded-xl p-4 bg-emerald-500/5 opacity-70">
            <div className="flex justify-between items-start mb-2">
              <span className="font-black text-lg">108912</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Delivered
              </span>
            </div>
            <p className="font-medium text-foreground">Red Velvet Jar x4</p>
            <p className="text-sm text-muted-foreground mt-1">Assigned to: Mahesh Bhai</p>
          </div>
        </div>

      </div>
    </div>
  );
}
