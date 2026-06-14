import { ShoppingBag, ChefHat, Bike, AlertTriangle } from "lucide-react";

export default function ManagerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Khanderao Market Branch</h2>
          <p className="text-muted-foreground text-sm">Local branch operations overview.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Download Daily Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-muted-foreground">Kitchen Queue</h3>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><ChefHat className="w-5 h-5" /></div>
          </div>
          <p className="text-3xl font-bold text-foreground">5</p>
          <p className="text-xs text-muted-foreground mt-1">Cakes currently baking</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-muted-foreground">Ready for Pickup</h3>
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><ShoppingBag className="w-5 h-5" /></div>
          </div>
          <p className="text-3xl font-bold text-foreground">3</p>
          <p className="text-xs text-muted-foreground mt-1">Waiting for delivery boys</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-muted-foreground">Active Riders</h3>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Bike className="w-5 h-5" /></div>
          </div>
          <p className="text-3xl font-bold text-foreground">4 / 6</p>
          <p className="text-xs text-muted-foreground mt-1">Available for new orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Kitchen Queue */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-foreground mb-4">Urgent Kitchen Queue</h3>
          <div className="space-y-3">
            {[
              { id: "108921", item: "Pineapple Cake (1kg)", time: "10 mins ago", type: "Delivery" },
              { id: "108922", item: "Chocolate Truffle (500g)", time: "15 mins ago", type: "Store Pickup" },
              { id: "108923", item: "Custom Photo Cake", time: "1 hr ago", type: "Delivery" },
            ].map((order, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{order.id}</span>
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground font-medium">{order.type}</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mt-0.5">{order.item}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-destructive font-semibold flex items-center justify-end gap-1"><AlertTriangle className="w-3 h-3" /> {order.time}</p>
                  <button className="text-xs mt-1 bg-primary text-primary-foreground px-3 py-1 rounded font-medium hover:bg-primary/90">Mark Ready</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Local Inventory Warnings */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-foreground mb-4">Local Inventory Alerts</h3>
          <div className="space-y-3">
            {[
              { item: "Fresh Strawberries", stock: "Low (2 kg left)", status: "critical" },
              { item: "Chocolate Base (1kg)", stock: "Moderate (5 left)", status: "warning" },
              { item: "Delivery Boxes (Medium)", stock: "Low (15 left)", status: "critical" },
            ].map((inv, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <p className="text-sm font-medium text-foreground">{inv.item}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${inv.status === "critical" ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-500"}`}>
                  {inv.stock}
                </span>
              </div>
            ))}
            <button className="w-full mt-2 py-2 border-2 border-dashed border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              Request Stock from Warehouse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
