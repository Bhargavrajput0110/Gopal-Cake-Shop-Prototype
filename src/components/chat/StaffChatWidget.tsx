"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Message, CloseSquare, Danger } from "iconsax-react";
import { motion, AnimatePresence } from "framer-motion";
import { toBranchShortName } from "@/lib/branches";

export type StaffMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'manager' | 'sales' | 'chef' | 'driver';
  branch: string;
  /** The DB column is `content`, but we also map `text` for legacy compat */
  content?: string;
  text?: string;
  channel: 'all' | 'kitchen' | 'sales' | 'delivery';
  createdAt: string;
};

interface StaffChatWidgetProps {
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'manager' | 'sales' | 'chef' | 'driver';
  branch: string;
  channel: 'all' | 'kitchen' | 'sales' | 'delivery';
}

export function StaffChatWidget({ senderId, senderName, senderRole, branch, channel }: StaffChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [text, setText] = useState("");
  const [activeChannel, setActiveChannel] = useState<'all' | 'kitchen' | 'sales' | 'delivery'>(channel || 'all');
  const [fetchError, setFetchError] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchMessages = async () => {
    // Abort previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(
        `/api/messages?branch=${encodeURIComponent(branch)}&channel=${activeChannel}`,
        { signal: ctrl.signal }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setFetchError(false);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // Request was cancelled, not a real error
      // Silently fail — don't crash the page, just show empty state
      setFetchError(true);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000);
    return () => {
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();
    };
     
  }, [branch, activeChannel]);

  useEffect(() => {
    if (chatEndRef.current && isOpen) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const payload = {
      senderId,
      senderName,
      senderRole,
      branch,
      text,
      channel: activeChannel
    };

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setText("");
        fetchMessages();
      }
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "text-purple-600 bg-purple-50 border-purple-200";
      case "chef": return "text-orange-600 bg-orange-50 border-orange-200";
      case "sales": return "text-blue-600 bg-blue-50 border-blue-200";
      case "driver": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const branchLabel = toBranchShortName(branch);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            layoutId="chat-box"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-[#3E2723] to-[#1E120C] text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all border border-[#D4AF37]/35 cursor-pointer font-bold text-sm tracking-wider"
          >
            <Message className="w-5 h-5 text-[#D4AF37]" />
            Staff Chat ({branchLabel})
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            layoutId="chat-box"
            className="w-80 md:w-96 h-[480px] bg-white/95 backdrop-blur-md rounded-3xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#3E2723] to-[#1E120C] text-white flex justify-between items-center shrink-0 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2">
                <Message className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <h3 className="text-xs font-black tracking-widest uppercase text-white">Internal Staff Chat</h3>
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{branchLabel}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <CloseSquare className="w-5 h-5" />
              </button>
            </div>

            {/* Channels tab bar */}
            <div className="flex bg-gray-50 border-b border-gray-100 p-1.5 shrink-0 gap-1">
              {(['all', 'kitchen', 'sales', 'delivery'] as const).map((chan) => (
                <button
                  key={chan}
                  onClick={() => setActiveChannel(chan)}
                  className={`flex-1 text-[10px] py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all ${
                    activeChannel === chan
                      ? "bg-[#3E2723] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-800"
                  }`}
                >
                  {chan}
                </button>
              ))}
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[#FDFCF7]">
              {fetchError ? (
                <div className="text-center py-16 opacity-60 flex flex-col items-center gap-2">
                  <Danger className="w-6 h-6 text-amber-400" />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Chat Unavailable</p>
                  <p className="text-[10px] text-gray-400">Could not connect to chat server.</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 opacity-50 flex flex-col items-center gap-1.5">
                  <Danger className="w-6 h-6 text-gray-400" />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">No Messages Yet</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-gray-900">{msg.senderName}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${getRoleColor(msg.senderRole)}`}>
                        {msg.senderRole}
                      </span>
                      <span className="text-[8px] text-gray-400 ml-auto">
                        {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200/60 rounded-2xl rounded-tl-none p-3 shadow-sm max-w-[90%]">
                      <p className="text-xs text-gray-800 font-medium leading-relaxed break-words">
                        {msg.content || msg.text || ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Message in #${activeChannel}...`}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-gray-50/50"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="p-2.5 bg-[#3E2723] text-white rounded-xl hover:bg-[#2B1B18] transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
