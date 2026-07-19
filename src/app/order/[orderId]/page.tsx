"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, TickCircle, ArrowRight2, Card, Refresh2, Bag, Call, Location, Danger, ArrowLeft, DocumentText } from "iconsax-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { generateInvoicePDF } from "@/lib/invoice";
import { BackButton } from "@/components/ui/BackButton";

interface Order {
  id: string;
  orderType: "delivery" | "pickup" | "walk_in" | "phone";
  status: string;
  customerName: string;
  customerPhone: string;
  customerInstructions?: string;
  branch: string;
  delivery?: {
    address: string;
    landmark?: string;
  };
  items: { name: string; qty: number; weight?: string; flavour?: string; cakeText?: string }[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCharge: number;
  grandTotal: number;
  advancePaid: number;
  pendingBalance: number;
  priorityLevel: string;
  isSurprise: boolean;
  timeTarget: string;
  createdAt: string;
  timeline: { event: string; actor: string; timestamp: string }[];
}

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const handleDownloadInvoice = () => {
    if (!order) return;
    
    const invoiceItems = order.items.map(item => ({
      name: item.name,
      qty: item.qty,
      weight: item.weight || "1kg",
      flavor: item.flavour || "Chocolate",
      price: order.grandTotal / (item.qty || 1)
    }));

    const invoiceData = {
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.delivery?.address,
      items: invoiceItems,
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      discount: order.discount,
      grandTotal: order.grandTotal,
      createdAt: order.createdAt
    };

    const doc = generateInvoicePDF(invoiceData);
    doc.save(`invoice-${order.id}.pdf`);
  };

  useEffect(() => {
    let socketInstance: Socket | null = null;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    socketInstance = io(window.location.origin);
    
    socketInstance.emit("join_branch", "Khanderao Branch");

    socketInstance.on("order_updated", (updatedOrder: Order) => {
      if (updatedOrder.id === orderId) {
        setOrder(updatedOrder);
      }
    });

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, [orderId]);

  const handlePayAdvance = async () => {
    if (!order) return;
    setPaying(true);

    const updatedAdvance = Math.ceil(order.grandTotal * 0.5);

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "WAITING_FOR_CHEF", 
          actorName: "Customer (Online Payment)",
          advancePaid: updatedAdvance,
          pendingBalance: order.grandTotal - updatedAdvance
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        alert("Payment failed: " + (data.error?.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error processing payment.");
    } finally {
      setPaying(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "QUOTE_DRAFT":
        return {
          title: "Bargain Review in Progress",
          desc: "Our salesperson is reviewing your discount request. We will update the price here shortly.",
          color: "text-amber-700 bg-amber-50 border-amber-200",
          step: 1
        };
      case "QUOTE_SENT":
        return {
          title: "New Negotiated Quote Ready!",
          desc: "Our salesperson approved a discount. Review the final price below and pay to confirm your order.",
          color: "text-primary bg-primary/10 border-primary/20",
          step: 2
        };
      case "WAITING_FOR_CHEF":
        return {
          title: "Order Confirmed!",
          desc: "Your payment was received. The order is sent to the kitchen queue.",
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          step: 3
        };
      case "CHEF_ACCEPTED":
      case "baking":
      case "DECORATING":
        return {
          title: "In Kitchen & Baking",
          desc: "The Chef is preparing and decorating your cake now.",
          color: "text-sky-700 bg-sky-50 border-sky-200",
          step: 4
        };
      case "READY_FOR_PICKUP":
        return {
          title: "Ready for Dispatch!",
          desc: order?.orderType === "pickup" ? "Your cake is ready at the shop! Please come for pickup." : "Your cake is packed and waiting for delivery driver.",
          color: "text-purple-700 bg-purple-50 border-purple-200",
          step: 5
        };
      case "ON_THE_WAY":
        return {
          title: "Out for Delivery!",
          desc: "Our driver is on the way to your address with your cake.",
          color: "text-indigo-700 bg-indigo-50 border-indigo-200",
          step: 6
        };
      case "DELIVERED":
        return {
          title: "Cake Delivered! 🎉",
          desc: "Enjoy your cake! Thank you for ordering from Gopal Cake Shop.",
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          step: 7
        };
      case "CANCELLED":
        return {
          title: "Order Cancelled",
          desc: "This order has been cancelled by the shop or customer.",
          color: "text-rose-700 bg-rose-50 border-rose-200",
          step: 0
        };
      default:
        return {
          title: "Processing Order",
          desc: "Please wait while we fetch the latest state.",
          color: "text-foreground/70 bg-secondary/50 border-border",
          step: 1
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Refresh2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-serif italic text-foreground/70">Fetching your bespoke order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <Danger className="w-12 h-12 text-rose-300 mb-6" />
        <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Order Not Found</h1>
        <p className="font-serif italic text-foreground/70 mb-8">Double check the order ID or contact our artisan support.</p>
        <Link href="/menu" className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105">
          Return to Catalogue
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const discountAdvance = Math.ceil(order.grandTotal * 0.5);

  return (
    <div className="min-h-screen bg-background pb-32 pt-24 md:pt-32">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        
        {/* Editorial Back Link */}
        <BackButton fallback="/menu" label="Return to Catalogue" variant="link" className="px-0 mb-8 text-foreground/50 hover:text-foreground uppercase tracking-widest text-[10px] font-bold" />

        {/* Minimal Order Header */}
        <div className="border-b border-border/40 pb-8 mb-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-sans font-bold text-secondary tracking-[0.3em] uppercase block mb-3">Receipt</span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground break-all">{order.id}</h1>
          </div>
          <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto">
            <span className="bg-secondary/10 px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold text-secondary">
              {order.orderType === "delivery" ? "Home Delivery" : "Store Pickup"}
            </span>
            <button
              onClick={handleDownloadInvoice}
              className="border border-border/40 text-foreground/70 hover:text-foreground hover:border-foreground/30 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ml-auto md:ml-0"
            >
              <DocumentText className="w-3 h-3" />
              Invoice
            </button>
          </div>
        </div>

        {/* Live Status Banner */}
        <div className={`p-6 md:p-8 rounded-2xl border ${statusConfig.color} mb-10 shadow-sm`}>
          <h3 className="font-serif text-2xl font-bold mb-2">{statusConfig.title}</h3>
          <p className="font-serif italic text-lg opacity-90 leading-relaxed">{statusConfig.desc}</p>
        </div>

        {/* Negotiation Action Card (Shows only on quote_sent) */}
        {order.status === "QUOTE_SENT" && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="p-8 rounded-2xl border border-primary bg-primary/5 shadow-sm mb-10 space-y-6"
          >
            <div className="flex flex-col md:flex-row items-start justify-between gap-4 border-b border-primary/10 pb-6">
              <div>
                <span className="text-[10px] font-sans font-bold text-primary uppercase tracking-[0.2em] block mb-2">Special Discount Applied</span>
                <p className="font-serif text-foreground/70 text-lg">Original Total: <span className="line-through text-foreground/40">₹{order.grandTotal + order.discount}</span></p>
                <p className="font-serif font-bold text-3xl text-foreground mt-1">New Total: ₹{order.grandTotal}</p>
              </div>
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">
                ₹{order.discount} SAVED
              </div>
            </div>
            
            <div className="pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-sans font-bold text-foreground/50 block uppercase tracking-widest mb-1">Advance to Confirm (50%)</span>
                <p className="font-serif font-bold text-4xl text-primary">₹{discountAdvance}</p>
              </div>
              <button 
                disabled={paying}
                onClick={handlePayAdvance}
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] uppercase tracking-widest py-4 px-10 rounded-full shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {paying ? <Refresh2 className="w-4 h-4 animate-spin" /> : <Card className="w-4 h-4" />}
                Pay ₹{discountAdvance} Now
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          <div className="space-y-10">
            {/* Order Details List */}
            <div>
              <h3 className="font-serif text-2xl font-bold border-b border-border/40 pb-4 mb-6 text-foreground">Customization</h3>
              <div className="space-y-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-serif font-bold text-lg text-foreground">{item.name} <span className="text-foreground/50 text-base font-normal">({item.weight})</span></p>
                      <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 mt-1">Flavour: <span className="text-secondary">{item.flavour || "Not Specified"}</span></p>
                      {item.cakeText && (
                        <p className="text-sm font-serif italic text-foreground/80 border-l-2 border-primary/30 pl-3 mt-3 py-0.5">
                          "{item.cakeText}"
                        </p>
                      )}
                    </div>
                    <p className="font-serif font-bold text-lg text-foreground bg-secondary/5 px-3 py-1 rounded-full">x{item.qty}</p>
                  </div>
                ))}

                {order.customerInstructions && (
                  <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 mt-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2">Special Instructions</p>
                    <p className="font-serif italic text-foreground/80 leading-relaxed">{order.customerInstructions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery / Branch Details */}
            <div>
              <h3 className="font-serif text-2xl font-bold border-b border-border/40 pb-4 mb-6 text-foreground">Logistics</h3>
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 block mb-1">Fulfillment Branch</span>
                  <p className="font-serif font-bold text-lg text-foreground">{order.branch}</p>
                </div>
                <div>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 block mb-1">Target Time</span>
                  <p className="font-serif font-bold text-lg text-foreground">
                    {new Date(order.timeTarget).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                {order.orderType === "delivery" && order.delivery && (
                  <div className="pt-4 border-t border-border/20">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50 block mb-1">Recipient Address</span>
                    <p className="font-serif text-foreground/80 leading-relaxed">{order.delivery.address}</p>
                    {order.delivery.landmark && <p className="font-serif italic text-foreground/60 mt-1">Landmark: {order.delivery.landmark}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {/* Pricing Summary */}
            <div className="bg-secondary/5 rounded-2xl border border-border/40 p-6 md:p-8">
              <h3 className="font-serif text-2xl font-bold border-b border-border/40 pb-4 mb-6 text-foreground">Investment</h3>
              <div className="space-y-4">
                <div className="flex justify-between font-serif text-foreground/70">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                {order.deliveryCharge > 0 && (
                  <div className="flex justify-between font-serif text-foreground/70">
                    <span>Delivery</span>
                    <span>₹{order.deliveryCharge}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between font-serif font-bold text-secondary">
                    <span>Discount</span>
                    <span>-₹{order.discount}</span>
                  </div>
                )}
                <div className="border-t border-border/40 pt-4 mt-2">
                  <div className="flex justify-between font-serif text-xl font-bold text-foreground">
                    <span>Grand Total</span>
                    <span>₹{order.grandTotal}</span>
                  </div>
                </div>
                
                <div className="pt-6 space-y-3">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-emerald-700 bg-emerald-500/10 px-4 py-3 rounded-xl">
                    <span>Advance Paid</span>
                    <span>₹{order.advancePaid}</span>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-secondary bg-secondary/10 px-4 py-3 rounded-xl">
                    <span>Pending Balance</span>
                    <span>₹{order.pendingBalance}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div>
              <h3 className="font-serif text-2xl font-bold border-b border-border/40 pb-4 mb-8 text-foreground">Milestones</h3>
              <div className="relative pl-6 border-l border-primary/20 space-y-8">
                {order.timeline?.map((evt, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full border border-primary bg-background flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-foreground">{evt.event}</p>
                      <p className="font-serif italic text-foreground/50 text-sm mt-1">
                        {evt.actor} • {new Date(evt.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
