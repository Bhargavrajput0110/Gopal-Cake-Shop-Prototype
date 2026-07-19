"use client";

import { useEffect, useState, useCallback } from "react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Bag, Calendar2, Location, Clock, Logout, ArrowDown2, ArrowUp2, Box, Refresh, User, Call, Star1, Refresh2, CloseSquare, Notification, DocumentText } from "iconsax-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { generateInvoicePDF } from "@/lib/invoice";
import { fetchClient } from "@/lib/api/client";

interface OrderItem {
  name: string;
  qty: number;
  weight?: string;
  notes?: string;
}

interface Order {
  id: string;
  status: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  grandTotal?: number;
  totalAmount?: number;
  advancePaid?: number;
  pendingBalance?: number;
  balanceAmount?: number;
  timeTarget?: string;
  targetDate?: string;
  deliveryType?: string;
  deliveryAddress?: string;
  createdAt: string;
}

// Clean phone number helper
const cleanPhone = (p: string) => p.replace(/\D/g, "");

export default function CustomerOrdersPage() {
  const { user, loading, logout } = useCustomerAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  
  // Review Modal States
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState("");
  const [reviewProductId, setReviewProductId] = useState("");
  const [reviewProductName, setReviewProductName] = useState("");
  const [reviewItems, setReviewItems] = useState<{name: string, productId: string}[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Push Permission State
  const [pushStatus, setPushStatus] = useState<string>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus(window.Notification.permission);
    }
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setDbProducts(data);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      }
    }
    loadProducts();
  }, []);

  const openReviewModal = (order: Order) => {
    setReviewOrderId(order.id);
    setReviewComment("");
    setReviewRating(5);

    const itemsWithIds = order.items.map(item => {
      const matched = dbProducts.find(p => p.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(p.name.toLowerCase()));
      return {
        name: item.name,
        productId: matched ? matched.productId : (dbProducts[0]?.productId || "prod-generic")
      };
    });

    setReviewItems(itemsWithIds);
    if (itemsWithIds.length > 0) {
      setReviewProductId(itemsWithIds[0].productId);
      setReviewProductName(itemsWithIds[0].name);
    }
    setIsReviewOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProductId) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: reviewOrderId,
          productId: reviewProductId,
          customerId: user?.id,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      if (res.ok) {
        alert("Review submitted successfully! It will appear once approved by administrator.");
        setIsReviewOpen(false);
      } else {
        const errData = await res.json();
        alert("Failed to submit review: " + (errData.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    const invoiceItems = order.items.map(item => ({
      name: item.name,
      qty: item.qty,
      weight: item.weight || "1kg",
      flavor: (item as any).flavour || (item as any).flavor || "Chocolate",
      price: (order.grandTotal ?? order.totalAmount ?? 0) / (item.qty || 1)
    }));

    const invoiceData = {
      orderId: order.id,
      customerName: order.customerName || userName,
      customerPhone: order.customerPhone || userPhone,
      deliveryAddress: order.deliveryAddress,
      items: invoiceItems,
      subtotal: order.grandTotal ?? order.totalAmount ?? 0,
      deliveryCharge: 0,
      discount: 0,
      grandTotal: order.grandTotal ?? order.totalAmount ?? 0,
      createdAt: order.createdAt
    };

    const doc = generateInvoicePDF(invoiceData);
    doc.save(`invoice-${order.id}.pdf`);
  };

  const handleSubscribePush = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Push notifications are not supported on this device/browser.");
      return;
    }
    
    try {
      const permission = await window.Notification.requestPermission();
      setPushStatus(permission);
      if (permission !== "granted") {
        alert("Notification permission denied. Please allow notifications in your browser settings.");
        return;
      }

      if (!("serviceWorker" in navigator)) {
        alert("Service worker is not supported in this browser.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      if (!registration.pushManager) {
        alert("Push notifications not supported on this browser.");
        return;
      }

      const keyRes = await fetch("/api/notifications/vapid-public-key");
      if (!keyRes.ok) {
        throw new Error("Failed to fetch VAPID public key");
      }
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        throw new Error("VAPID public key not found");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subRes = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user?.id,
          subscription: subscription.toJSON(),
        }),
      });

      if (subRes.ok) {
        alert("Successfully enabled order updates notifications!");
      } else {
        const errData = await subRes.json();
        throw new Error(errData.error || "Failed to subscribe subscription on server.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error enabling notifications: ${err.message}`);
    }
  };

  const fetchOrders = useCallback(async (phoneNum: string, pageNumber: number = 1) => {
    if (!phoneNum) return;
    await Promise.resolve();
    setFetching(true);
    setError("");
    try {
      const res = await fetchClient<any>(`/customers/me/orders?page=${pageNumber}&limit=10`);
      setOrders(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.totalPages);
        setPage(res.meta.page);
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      const errorMessage = err.message || "Failed to load order history.";
      setError(errorMessage);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/customer/login");
      } else {
        const phone = user.user_metadata?.phone || user.phone;
        if (phone) {
          fetchOrders(phone, page);
        } else {
          setError("No phone number associated with this account. Please update your profile.");
        }
      }
    }
  }, [user, loading, router, fetchOrders]);

  const handleLogout = async () => {
    await logout();
    router.push("/customer/login");
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("DELIVERED") || s.includes("completed") || s.includes("ready")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
    if (s.includes("chef") || s.includes("kitchen") || s.includes("MAKING") || s.includes("baking") || s.includes("DECORATING")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    }
    if (s.includes("cancel") || s.includes("fail")) {
      return "bg-rose-50 text-rose-700 border-rose-100";
    }
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#2C1A14]/70">Loading Profile...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const userPhone = user.user_metadata?.phone || user.phone || "";
  const userName = user.user_metadata?.name || user.email || "Customer";

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-16 px-4 md:px-8 relative">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 border border-[#2C1A14]/5 rounded-3xl p-6 mb-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2C1A14] to-[#D4AF37] flex items-center justify-center text-white text-lg font-black font-heading">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#2C1A14]">{userName}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {user.email}</span>
                <span className="hidden sm:inline text-muted-foreground/30">•</span>
                <span className="flex items-center gap-1"><Call className="w-3.5 h-3.5" /> {userPhone}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              onClick={() => fetchOrders(userPhone)}
              disabled={fetching}
              variant="outline"
              size="sm"
              className="rounded-xl border-[#2C1A14]/10 text-xs font-bold uppercase tracking-wider h-10 w-full md:w-auto"
            >
              <Refresh className={`w-3.5 h-3.5 mr-1 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 text-xs font-bold uppercase tracking-wider h-10 w-full md:w-auto flex items-center justify-center gap-1"
            >
              <Logout className="w-3.5 h-3.5" />
              Logout
            </Button>
          </div>
        </div>

        {/* Push Notification Banner */}
        {pushStatus === "default" && (
          <div className="bg-gradient-to-r from-[#FAF6EE] to-[#F5EDD8] border border-[#D4AF37]/20 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Notification className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-black text-base text-[#2C1A14]">Enable Order Updates</h3>
                <p className="text-xs text-muted-foreground max-w-md">Get instant notification alerts on your device when the chef accepts your order or when it is out for delivery.</p>
              </div>
            </div>
            <Button
              onClick={handleSubscribePush}
              className="bg-[#2C1A14] hover:bg-[#D4AF37] text-white rounded-xl font-bold uppercase tracking-wider text-xs h-11 px-6 w-full sm:w-auto shrink-0 shadow-md"
            >
              Enable Notifications
            </Button>
          </div>
        )}

        {/* Content Panel */}
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#2C1A14]/60 mb-4 px-2">Order History ({orders.length})</h2>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-4 text-xs font-medium mb-6">
            {error}
          </div>
        )}

        {fetching && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white/40 border border-[#2C1A14]/5 rounded-3xl backdrop-blur-sm">
            <div className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Fetching Orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white/60 border border-[#2C1A14]/5 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center p-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#2C1A14]/5 to-[#D4AF37]/5 rounded-full flex items-center justify-center text-[#D4AF37] mb-4">
              <Bag className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-[#2C1A14]">No Orders Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-2 mb-6">We couldn&apos;t find any orders placed under your phone number. Start ordering now to see your history here!</p>
            <Link href="/menu">
              <Button className="bg-[#2C1A14] text-white hover:bg-[#D4AF37] rounded-xl font-bold uppercase tracking-wider text-xs px-6 h-11">
                Explore Menu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const total = order.grandTotal ?? order.totalAmount ?? 0;
              const balance = order.pendingBalance ?? order.balanceAmount ?? 0;
              const advance = order.advancePaid ?? 0;
              const dateTarget = order.timeTarget ?? order.targetDate;

              return (
                <motion.div
                  key={order.id}
                  layout
                  className="bg-white/80 border border-[#2C1A14]/5 hover:border-[#D4AF37]/20 shadow-md rounded-2xl overflow-hidden transition-all duration-300"
                >
                  {/* Card Main Row */}
                  <div
                    onClick={() => toggleExpand(order.id)}
                    className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#2C1A14]/5 flex items-center justify-center text-[#2C1A14] shrink-0">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-black text-base text-[#2C1A14]">{order.id}</span>
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black tracking-wider ${getStatusStyle(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Calendar2 className="w-3.5 h-3.5" />
                          Ordered: {new Date(order.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Grand Total</p>
                        <p className="font-heading font-black text-[#2C1A14] text-base">₹{total.toFixed(2)}</p>
                      </div>
                      <div className="text-muted-foreground hover:text-[#2C1A14] p-1.5 bg-secondary/50 rounded-lg">
                        {isExpanded ? <ArrowUp2 className="w-4 h-4" /> : <ArrowDown2 className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details Pane */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[#2C1A14]/5 bg-[#FDFBF7]/30"
                      >
                        <div className="p-5 space-y-6">
                          
                          {/* Items Grid */}
                          <div>
                            <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3">Items Ordered</h4>
                            <div className="space-y-2">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-start py-2.5 px-3 bg-white border border-[#2C1A14]/5 rounded-xl text-xs">
                                  <div>
                                    <p className="font-bold text-[#2C1A14]">{item.name} <span className="text-muted-foreground font-normal">x {item.qty}</span></p>
                                    {item.weight && <span className="text-[10px] text-muted-foreground font-medium mr-3">Weight: {item.weight}</span>}
                                    {item.notes && <p className="text-[10px] italic text-[#D4AF37] mt-0.5">Note: &quot;{item.notes}&quot;</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order metadata & totals */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#2C1A14]/5">
                            
                            {/* Delivery/Pickup Details */}
                            <div className="space-y-2 text-xs">
                              <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Order Details</h4>
                              
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4 shrink-0" />
                                <div>
                                  <span className="font-semibold text-foreground">Target Date:</span>{" "}
                                  {dateTarget ? new Date(dateTarget).toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : "N/A"}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Location className="w-4 h-4 shrink-0" />
                                <div>
                                  <span className="font-semibold text-foreground">Type:</span>{" "}
                                  {order.deliveryType ? order.deliveryType.toUpperCase() : "N/A"}
                                  {order.deliveryAddress && (
                                    <p className="mt-1 text-[11px] text-muted-foreground pl-0 bg-secondary/20 p-2 rounded-lg">{order.deliveryAddress}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Payment details */}
                            <div className="space-y-2 text-xs">
                              <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Payment Summary</h4>
                              <div className="bg-white border border-[#2C1A14]/5 rounded-xl p-3.5 space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Grand Total:</span>
                                  <span className="font-bold text-foreground">₹{total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Paid in Advance:</span>
                                  <span className="font-bold text-emerald-600">₹{advance.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t border-[#2C1A14]/5 pt-2 font-bold text-sm">
                                  <span className="text-[#2C1A14]">Pending Balance:</span>
                                  <span className={balance > 0 ? "text-amber-600" : "text-emerald-600"}>
                                    ₹{balance.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>

                          </div>

                          {/* Write Review and Download Invoice Buttons */}
                          {(() => {
                            const statusUpper = order.status.toUpperCase();
                            const isCompletedOrDelivered = statusUpper === 'DELIVERED' || statusUpper === 'COMPLETED';
                            if (isCompletedOrDelivered) {
                              return (
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-[#2C1A14]/5 justify-end">
                                  <Button
                                    onClick={() => openReviewModal(order)}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                                  >
                                    <Star1 className="w-3.5 h-3.5" />
                                    Write Review
                                  </Button>
                                  
                                  <Button
                                    onClick={() => handleDownloadInvoice(order)}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-[#2C1A14]/10 text-foreground hover:bg-[#2C1A14]/5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                                  >
                                    <DocumentText className="w-3.5 h-3.5" />
                                    Download Invoice
                                  </Button>
                                </div>
                              );
                            }
                            return null;
                          })()}

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-4">
                <Button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || fetching}
                  variant="outline"
                  className="rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Prev
                </Button>
                <span className="text-xs font-bold text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || fetching}
                  variant="outline"
                  className="rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FDFBF7] border border-[#2C1A14]/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setIsReviewOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <CloseSquare className="w-5 h-5" />
              </button>

              <h3 className="font-heading font-black text-xl text-[#2C1A14] mb-4">Write a Review</h3>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Select Item if multiple */}
                {reviewItems.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#2C1A14]/70">Select Item to Review</label>
                    <select
                      value={reviewProductId}
                      onChange={(e) => {
                        setReviewProductId(e.target.value);
                        const selectedItem = reviewItems.find(item => item.productId === e.target.value);
                        if (selectedItem) setReviewProductName(selectedItem.name);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#2C1A14]/10 bg-[#FDFBF7] text-sm text-foreground focus:ring-0 focus:outline-none focus:border-[#D4AF37]"
                    >
                      {reviewItems.map(item => (
                        <option key={item.productId} value={item.productId}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Star Rating */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#2C1A14]/70 block">Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-amber-500 hover:scale-110 transition-transform p-1"
                      >
                        <Star1 className={`w-8 h-8 ${reviewRating >= star ? "fill-amber-500 text-amber-500" : "text-gray-200"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#2C1A14]/70 block">Your Review</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us what you liked (or didn't like) about this cake..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#2C1A14]/10 bg-[#FDFBF7] text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full bg-[#2C1A14] text-white hover:bg-[#D4AF37] h-11 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                >
                  {isSubmittingReview ? <Refresh2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
