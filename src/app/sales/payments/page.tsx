"use client";
import React, { useState, useMemo } from "react";
import { Card, Warning2, TickCircle } from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";
import { useOrders } from "@/context/OrderContext";
import { ReceiptStub } from "@/app/sales/pos/components/ReceiptStub";

export default function PaymentTrackingPage() {
  const { orders } = useOrders();
  const [filter, setFilter] = useState("ALL");
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  const { totalCollectedToday, pendingBalances, advancePayments } = useMemo(() => {
    let collectedToday = 0;
    let pending = 0;
    let advances = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    orders.forEach(o => {
      if (o.payments) {
        o.payments.forEach(p => {
          if (p.timestamp && p.timestamp.startsWith(todayStr)) {
            collectedToday += p.amount;
          }
        });
      }
      
      if (o.advancePaid) advances += o.advancePaid;
      if (o.pendingBalance > 0) pending += o.pendingBalance;
    });

    return { totalCollectedToday: collectedToday, pendingBalances: pending, advancePayments: advances };
  }, [orders]);

  const displayOrders = useMemo(() => {
    return orders
      .filter(o => {
        if (filter === "PENDING") return o.pendingBalance > 0;
        if (filter === "PAID") return o.pendingBalance <= 0;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, filter]);

  const handleCollect = async (orderId: string, amount: number) => {
    if (!amount || amount <= 0) return;
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: "CASH" }) 
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to record payment");
      alert("Payment collected successfully!");
      setCollectingId(null);
      setPaymentAmount("");
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    }
  };

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
          <p className="text-3xl font-black text-emerald-600">₹{totalCollectedToday.toFixed(0)}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Pending Balances</p>
          <p className="text-3xl font-black text-amber-500">₹{pendingBalances.toFixed(0)}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">All-Time Advance Payments</p>
          <p className="text-3xl font-black text-blue-500">₹{advancePayments.toFixed(0)}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center">
          <h3 className="font-bold text-foreground">Payment Status Log</h3>
          <select 
            className="p-2 rounded-lg border border-input bg-background text-sm font-medium"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Transactions</option>
            <option value="PENDING">Pending Balance Only</option>
            <option value="PAID">Fully Paid Only</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
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
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No orders found matching the filter.
                  </td>
                </tr>
              ) : (
                displayOrders.map(order => {
                  const isFullyPaid = order.pendingBalance <= 0;
                  return (
                    <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{order.orderNumber || order.id}</td>
                      <td className="px-6 py-4">{order.customerName}</td>
                      <td className="px-6 py-4 font-bold">₹{(order.grandTotal || 0).toFixed(0)}</td>
                      <td className="px-6 py-4 text-muted-foreground">₹{(order.advancePaid || 0).toFixed(0)}</td>
                      <td className={`px-6 py-4 font-bold ${isFullyPaid ? 'text-muted-foreground' : 'text-amber-500'}`}>
                        ₹{(order.pendingBalance || 0).toFixed(0)}
                      </td>
                      <td className="px-6 py-4">
                        {isFullyPaid ? (
                          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-1 rounded-full font-bold uppercase tracking-wider w-max">
                            <TickCircle className="w-3 h-3" /> Fully Paid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-1 rounded-full font-bold uppercase tracking-wider w-max">
                            <Warning2 className="w-3 h-3" /> Balance Due
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        {!isFullyPaid && (
                          collectingId === order.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                className="w-20 p-1 text-xs border rounded bg-background"
                                placeholder="Amount"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                              />
                              <button 
                                onClick={() => handleCollect(order.id, parseFloat(paymentAmount))}
                                className="text-xs bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setCollectingId(null)}
                                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-bold hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setCollectingId(order.id);
                                setPaymentAmount(order.pendingBalance.toString());
                              }}
                              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded font-bold hover:bg-primary/90"
                            >
                              Collect
                            </button>
                          )
                        )}
                        <button 
                          onClick={() => setReceiptId(order.id)}
                          className="text-xs text-muted-foreground font-bold hover:text-foreground border border-transparent hover:border-border px-2 py-1 rounded"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Hidden render for ReceiptStub when requested */}
      {receiptId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center print:bg-white print:static print:z-auto">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full relative print:shadow-none print:p-0">
            <button 
              onClick={() => setReceiptId(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 print:hidden font-bold text-xl"
            >
              &times;
            </button>
            <h3 className="text-center font-bold mb-4 print:hidden">Order Receipt</h3>
            <ReceiptStub orderId={receiptId} />
          </div>
        </div>
      )}
    </div>
  );
}
