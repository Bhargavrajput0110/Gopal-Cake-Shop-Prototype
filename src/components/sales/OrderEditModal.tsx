import { useState } from "react";
import { Order, useOrders } from "@/context/OrderContext";
import { CloseSquare, TickSquare, Save2 } from "iconsax-react";
import { motion } from "framer-motion";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";

interface OrderEditModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderEditModal({ order, onClose, onSuccess }: OrderEditModalProps) {
  const { updateOrderFields } = useOrders();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState(order.customerName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone);
  
  // Convert ISO string to datetime-local format for input (respecting local timezone)
  const formatForInput = (isoString?: string | null) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const [timeTarget, setTimeTarget] = useState(formatForInput(order.timeTarget));
  const [customerInstructions, setCustomerInstructions] = useState(order.customerInstructions || "");
  
  const [itemImages, setItemImages] = useState(
    (order.items || []).map(item => ({
      referenceImages: item.referenceImages || [],
      printImages: item.printImages || []
    }))
  );

  const handleSave = async () => {
    setIsSubmitting(true);
    
    // Build update payload
    const updates: Partial<Order> = {};
    if (customerName !== order.customerName) updates.customerName = customerName;
    if (customerPhone !== order.customerPhone) updates.customerPhone = customerPhone;
    if (customerInstructions !== (order.customerInstructions || "")) updates.customerInstructions = customerInstructions;
    
    if (timeTarget) {
      const newTime = new Date(timeTarget).toISOString();
      if (newTime !== order.timeTarget) {
        updates.timeTarget = newTime;
      }
    } else if (order.timeTarget) {
      updates.timeTarget = null as any; // clear the timeTarget if empty
    }

    const imagesChanged = order.items?.some((item, idx) => 
      JSON.stringify(item.referenceImages || []) !== JSON.stringify(itemImages[idx]?.referenceImages || []) ||
      JSON.stringify(item.printImages || []) !== JSON.stringify(itemImages[idx]?.printImages || [])
    );

    if (imagesChanged && order.items) {
      updates.items = order.items.map((item, idx) => ({
        ...item,
        referenceImages: itemImages[idx]?.referenceImages || [],
        printImages: itemImages[idx]?.printImages || []
      }));
    }

    if (Object.keys(updates).length > 0) {
      await updateOrderFields(order.id, updates);
      onSuccess(); // Trigger WhatsApp toast
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
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="bg-[#3E2723] p-5 flex items-center justify-between text-white shrink-0">
          <div>
            <h3 className="font-black text-lg">Edit Order Details</h3>
            <p className="text-white/70 text-xs mt-0.5">{order.id} &bull; {order.status.replace(/_/g, " ")}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
            <CloseSquare className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          
          <div className="space-y-4">
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

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Target Delivery Time</label>
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

            {order.items?.map((item, idx) => (
              <div key={idx} className="space-y-4 p-4 border rounded-xl bg-background">
                <p className="text-sm font-bold">{item.name}</p>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Reference Images (Design)</label>
                  <CloudinaryUploader 
                    onUploadSuccess={(urls) => {
                      const newImages = [...itemImages];
                      newImages[idx].referenceImages = urls;
                      setItemImages(newImages);
                    }}
                    existingImages={itemImages[idx]?.referenceImages || []}
                    label="Add Reference"
                    folder={`gopal-cakes/orders/${order.id}/references`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-purple-600 mb-2 flex items-center gap-2">
                    Printable Photos (Private)
                  </label>
                  <CloudinaryUploader 
                    onUploadSuccess={(urls) => {
                      const newImages = [...itemImages];
                      newImages[idx].printImages = urls;
                      setItemImages(newImages);
                    }}
                    existingImages={itemImages[idx]?.printImages || []}
                    label="Add Print Photo"
                    folder={`gopal-cakes/orders/${order.id}/prints`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800 text-xs font-bold flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span> 
              <span>Any changes saved here will generate an immutable audit log entry and will be visible on the order timeline.</span>
            </p>
          </div>
        </div>

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
