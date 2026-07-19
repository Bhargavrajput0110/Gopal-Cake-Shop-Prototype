import { Card, Warning2, TickCircle } from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";

export default function PaymentTrackingPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <BackButton fallback="/sales" label="Back to Sales" variant="outline" size="sm" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Card className="w-6 h-6 text-primary" /> Payment Tracking
          </h2>
          <p className="text-muted-foreground text-sm">Monitor advance payments and collect pending balances.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Collected Today</p>
          <p className="text-3xl font-black text-emerald-600">₹14,250</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Pending Balances</p>
          <p className="text-3xl font-black text-amber-500">₹3,400</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Advance Payments</p>
          <p className="text-3xl font-black text-blue-500">₹6,800</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center">
          <h3 className="font-bold text-foreground">Payment Status Log</h3>
          <select className="p-2 rounded-lg border border-input bg-background text-sm font-medium">
            <option>All Transactions</option>
            <option>Pending Balance Only</option>
            <option>Fully Paid Only</option>
          </select>
        </div>
        
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-bold">Order ID</th>
              <th className="px-6 py-4 font-bold">Customer</th>
              <th className="px-6 py-4 font-bold">Total Amount</th>
              <th className="px-6 py-4 font-bold">Paid Advance</th>
              <th className="px-6 py-4 font-bold">Pending</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            
            <tr className="hover:bg-secondary/30 transition-colors">
              <td className="px-6 py-4 font-bold text-foreground">108922</td>
              <td className="px-6 py-4">Sneha Desai</td>
              <td className="px-6 py-4 font-bold">₹2,450</td>
              <td className="px-6 py-4 text-muted-foreground">₹1,000</td>
              <td className="px-6 py-4 font-bold text-amber-500">₹1,450</td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-1 rounded-full font-bold uppercase tracking-wider w-max">
                  <Warning2 className="w-3 h-3" /> Balance Due
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded font-bold hover:bg-primary/90">Collect</button>
              </td>
            </tr>

            <tr className="hover:bg-secondary/30 transition-colors">
              <td className="px-6 py-4 font-bold text-foreground">108915</td>
              <td className="px-6 py-4">Amit Shah</td>
              <td className="px-6 py-4 font-bold">₹850</td>
              <td className="px-6 py-4 text-muted-foreground">₹850</td>
              <td className="px-6 py-4 font-bold text-muted-foreground">₹0</td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-1 rounded-full font-bold uppercase tracking-wider w-max">
                  <TickCircle className="w-3 h-3" /> Fully Paid
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-xs text-muted-foreground font-bold hover:text-foreground">Receipt</button>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
}
