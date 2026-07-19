import { motion, AnimatePresence } from "framer-motion";
import { Message, TickSquare, TickCircle } from "iconsax-react";
import { useEffect } from "react";

interface WhatsAppToastProps {
  show: boolean;
  message: string;
  recipient: string;
  onClose: () => void;
}

export function WhatsAppToast({ show, message, recipient, onClose }: WhatsAppToastProps) {
  useEffect(() => {
    if (show) {
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-[#25D366] text-white px-5 py-3 rounded-2xl shadow-[0_10px_40px_rgba(37,211,102,0.4)] flex items-center gap-4 min-w-[320px] max-w-md pointer-events-none"
        >
          <div className="bg-white/20 p-2 rounded-full shrink-0">
            <Message className="w-6 h-6 text-white fill-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">WhatsApp Notification Sent</p>
              <TickCircle className="w-4 h-4 text-white/80" />
            </div>
            <p className="text-white/90 text-xs mt-0.5 line-clamp-1">To: {recipient}</p>
            <p className="text-white/80 text-[10px] mt-1 font-mono bg-black/10 px-2 py-0.5 rounded inline-block">"{message}"</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
