import { useState } from "react";
import { Order, useOrders } from "@/context/OrderContext";
import { CloseSquare, Save2 } from "iconsax-react";
import { motion } from "framer-motion";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";
import { ALL_FLAVOURS } from "@/lib/flavours";

interface OrderEditModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderEditModal({ order, onClose, onSuccess }: OrderEditModalProps) {
  const { updateOrderFields } = useOrders();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Customer info ──────────────────────────────────────────────────────────
  const [customerName, setCustomerName] = useState(order.customerName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone);

  // ── Timing ────────────────────────────────────────────────────────────────
  const formatForInput = (isoString?: string | null) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const [timeTarget, setTimeTarget] = useState(formatForInput(order.timeTarget));
  const [customerInstructions, setCustomerInstructions] = useState(order.customerInstructions || "");

  // ── Pricing ───────────────────────────────────────────────────────────────
  const [grandTotal, setGrandTotal] = useState(order.grandTotal || 0);

  // ── Per-item edits (weight, flavor, message on cake) ──────────────────────
  const [itemEdits, setItemEdits] = useState(
    (order.items || []).map(item => ({
      weight: (item as any).weight || "",
      flavor: (item as any).flavor || "",
      messageOnCake: (item as any).messageOnCake || "",
    }))
  );

  // ── Images ────────────────────────────────────────────────────────────────
  const [itemImages, setItemImages] = useState(
    (order.items || []).map(item => ({
      referenceImages: item.referenceImages || [],
      printImages: item.printImages || [],
    }))
  );

  const handleSave = async () => {
    setIsSubmitting(true);

    const updates: Partial<Order> = {};

    if (customerName !== order.customerName) updates.customerName = customerName;
    if (customerPhone !== order.customerPhone) updates.customerPhone = customerPhone;
    if (customerInstructions !== (order.customerInstructions || "")) updates.customerInstructions = customerInstructions;

    if (timeTarget) {
      const newTime = new Date(timeTarget).toISOString();
      if (newTime !== order.timeTarget) updates.timeTarget = newTime;
    } else if (order.timeTarget) {
      updates.timeTarget = null as any;
    }

    // Price update — recalculate pending balance
    if (grandTotal !== (order.grandTotal || 0)) {
      updates.grandTotal = grandTotal;
      updates.subtotal = grandTotal;
      updates.pendingBalance = Math.max(0, grandTotal - (order.advancePaid || 0));
    }

    // Per-item changes (weight, flavor, messageOnCake, images)
    const itemsChanged = order.items?.some((item, idx) => {
      const edit = itemEdits[idx];
      const img = itemImages[idx];
      return (
        (item as any).weight !== edit.weight ||
        (item as any).flavor !== edit.flavor ||
        (item as any).messageOnCake !== edit.messageOnCake ||
        JSON.stringify(item.referenceImages || []) !== JSON.stringify(img?.referenceImages || []) ||
        JSON.stringify(item.printImages || []) !== JSON.stringify(img?.printImages || [])
      );
    });

    if (itemsChanged && order.items) {
      updates.items = order.items.map((item, idx) => ({
        ...item,
        weight: itemEdits[idx]?.weight || (item as any).weight,
        flavor: itemEdits[idx]?.flavor || (item as any).flavor,
        messageOnCake: itemEdits[idx]?.messageOnCake,
        referenceImages: itemImages[idx]?.referenceImages || [],
        printImages: itemImages[idx]?.printImages || [],
      })) as any;
    }

    if (Object.keys(updates).length > 0) {
      await updateOrderFields(order.id, updates);
      onSuccess();
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
      >
        {/* Header */}
        <div className="bg-[#3E2723] p-5 flex items-center justify-between text-white shrink-0">
          <div>
            <h3 className="font-black text-lg">Edit Order Details</h3>
            <p className="text-white/70 text-xs mt-0.5">{order.orderNumber || order.id} • {order.status.replace(/_/g, " ")}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
            <CloseSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">

          {/* ── CUSTOMER INFO ── */}
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#C5A059]">Customer Info</p>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-gray-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-gray-50/50"
              />
            </div>
          </div>

          {/* ── PRICING ── */}
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#C5A059]">Pricing</p>
            <div className="flex gap-3 items-center bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex-1">
                <label className="block text-xs font-black uppercase tracking-widest text-amber-900 mb-1">Order Total (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={grandTotal || ''}
                  onChange={(e) => setGrandTotal(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-lg font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
              </div>
              <div className="text-right text-xs text-amber-800">
                <p className="font-bold">Advance: ₹{order.advancePaid || 0}</p>
                <p className="font-black text-rose-600">Due: ₹{Math.max(0, grandTotal - (order.advancePaid || 0))}</p>
              </div>
            </div>
          </div>

          {/* ── PER ITEM ── */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#C5A059]">Cake Details</p>
            {order.items?.map((item, idx) => (
              <div key={idx} className="space-y-3 p-4 border rounded-xl bg-gray-50">
                <p className="text-sm font-black text-gray-900">📦 {item.name}</p>

                {/* Weight + Flavor side by side */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Weight (kg)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1, 1.5, 2"
                      value={itemEdits[idx]?.weight || ""}
                      onChange={(e) => {
                        const next = [...itemEdits];
                        next[idx] = { ...next[idx], weight: e.target.value };
                        setItemEdits(next);
                      }}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Flavor</label>
                    <select
                      value={itemEdits[idx]?.flavor || ""}
                      onChange={(e) => {
                        const next = [...itemEdits];
                        next[idx] = { ...next[idx], flavor: e.target.value };
                        setItemEdits(next);
                      }}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-white"
                    >
                      <option value="">Standard Flavor</option>
                      {ALL_FLAVOURS.map((f, i) => (
                        <option key={`${f.id}-${i}`} value={f.name}>
                          {f.name} {f.surchargePerHalfKg ? `(+₹${f.surchargePerHalfKg}/500g)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message on Cake */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Message on Cake</label>
                  <input
                    type="text"
                    placeholder="e.g. Happy Birthday Aarav"
                    value={itemEdits[idx]?.messageOnCake || ""}
                    onChange={(e) => {
                      const next = [...itemEdits];
                      next[idx] = { ...next[idx], messageOnCake: e.target.value };
                      setItemEdits(next);
                    }}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-white"
                  />
                </div>

                {/* Reference Images */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Reference Images (Design)</label>
                  <CloudinaryUploader
                    onUploadSuccess={(urls) => {
                      const next = [...itemImages];
                      next[idx] = { ...next[idx], referenceImages: urls };
                      setItemImages(next);
                    }}
                    existingImages={itemImages[idx]?.referenceImages || []}
                    label="Add Reference"
                    folder={`gopal-cakes/orders/${order.id}/references`}
                  />
                </div>

                {/* Print Images */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-purple-600 mb-2">Printable Photos (Private)</label>
                  <CloudinaryUploader
                    onUploadSuccess={(urls) => {
                      const next = [...itemImages];
                      next[idx] = { ...next[idx], printImages: urls };
                      setItemImages(next);
                    }}
                    existingImages={itemImages[idx]?.printImages || []}
                    label="Add Print Photo"
                    folder={`gopal-cakes/orders/${order.id}/prints`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ── TIMING ── */}
          <div className="space-y-4 border-t pt-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#C5A059]">Timing & Notes</p>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Target Delivery / Pickup Time</label>
              <input
                type="datetime-local"
                value={timeTarget}
                onChange={(e) => setTimeTarget(e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-gray-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Customer Instructions / Notes</label>
              <textarea
                value={customerInstructions}
                onChange={(e) => setCustomerInstructions(e.target.value)}
                rows={3}
                placeholder="Any special instructions for the chef..."
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-gray-50/50 resize-none"
              />
            </div>
          </div>

          {/* Audit warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800 text-xs font-bold flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>Any changes saved here will generate an immutable audit log entry and will be visible on the order timeline.</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border bg-gray-50 flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#C5A059] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#b08c48] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : <><Save2 className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
