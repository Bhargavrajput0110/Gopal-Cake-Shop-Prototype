"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CloseSquare, Warning2 } from "iconsax-react";
import { fetchClient } from "@/lib/api/client";
import { TimelineRenderer } from "@/components/ui/timeline/Timeline";
import type { TimelineEvent } from "@/components/ui/timeline/Timeline.types";

interface OrderTimelineModalProps {
  orderId: string;
  onClose: () => void;
}

export function OrderTimelineModal({ orderId, onClose }: OrderTimelineModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    async function loadTimeline() {
      setLoading(true);
      setError("");
      try {
        const res = await fetchClient<any>(`/v1/orders/${orderId}/timeline`);
        if (!res.success) throw new Error(res.error?.message || "Failed to load timeline");
        
        // Map backend Timeline model to UI TimelineEvent model
        const mappedEvents: TimelineEvent[] = (res.data || []).map((ev: any) => {
          let color: any = "default";
          let icon;
          let title = ev.action || ev.eventType;

          // Add some business logic for colors/icons based on eventType/action
          if (ev.eventType === "STATE_TRANSITION") {
            color = "info";
            title = `Status updated to ${ev.nextState.replace(/_/g, ' ')}`;
            if (ev.nextState === "DELIVERED") color = "success";
            if (ev.nextState === "WAITING_FOR_CHEF") color = "warning";
          } else if (ev.eventType === "CANCELLATION" || ev.eventType === "FAILED_DELIVERY") {
            color = "destructive";
            title = ev.eventType === "CANCELLATION" ? "Order Cancelled" : "Delivery Failed";
          } else if (ev.eventType === "SYSTEM_ACTION") {
            color = "muted";
            title = "System Action: " + ev.action;
          }

          return {
            id: ev.id,
            title: title,
            description: ev.note,
            timestamp: ev.createdAt,
            color: color,
            actor: ev.actor ? { name: ev.actor.name, role: ev.actor.role } : { name: "System", role: "SYSTEM" },
            // optionally add metadata if there's raw json
          };
        });

        setEvents(mappedEvents);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTimeline();
  }, [orderId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{opacity:0,y:60}} 
        animate={{opacity:1,y:0}} 
        exit={{opacity:0,y:60}}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#3E2723] p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest">Order Timeline</h3>
              <p className="text-white/60 text-[10px]">{orderId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><CloseSquare className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
             <div className="flex justify-center py-10">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A059]"></div>
             </div>
          ) : error ? (
             <div className="text-center py-10 text-rose-500 font-bold">
               <Warning2 className="w-8 h-8 mx-auto mb-2" />
               <p>{error}</p>
             </div>
          ) : events.length === 0 ? (
             <p className="text-center text-gray-400 text-sm py-8">No events yet.</p>
          ) : (
             <TimelineRenderer events={events} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
