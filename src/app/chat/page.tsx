"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { useBooking } from "@/stores/BookingStore";

// ============================================================
// Kaizy — REAL-TIME CHAT (WhatsApp/Uber style)
// Full screen chat with typing indicator, quick replies
// ============================================================

const quickReplies = [
  "Where are you?",
  "How long?",
  "Bring extra tools",
  "I'm waiting outside",
  "Call me",
  "Coming!",
];

export default function ChatPage() {
  const { isDark } = useTheme();
  const { state, sendMessage } = useBooking();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const worker = state.selectedWorker;

  // Auto-scroll on new messages
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [state.messages.length]);

  // Simulate typing indicator
  useEffect(() => {
    if (state.messages.length > 0) {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg.sender === "user") {
        setIsTyping(true);
        const t = setTimeout(() => setIsTyping(false), 2500);
        return () => clearTimeout(t);
      }
    }
  }, [state.messages.length]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    sendMessage(msg);
    setInput("");
    inputRef.current?.focus();
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-3 flex items-center gap-3 glass" style={{ borderBottom: "1px solid var(--border-1)" }}>
        <Link href="/booking" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 shrink-0"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <span className="text-[14px]">←</span>
        </Link>
        {worker ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="rounded-full flex items-center justify-center text-[14px] font-black text-white"
                   style={{ width: 38, height: 38, background: worker.color }}>{worker.initials}</div>
              <div className="absolute -bottom-0.5 -right-0.5 rounded-full online-pulse"
                   style={{ width: 10, height: 10, background: "var(--success)", border: "2px solid var(--bg-app)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold truncate" style={{ color: "var(--text-1)" }}>{worker.name}</p>
              <p className="text-[10px]" style={{ color: "var(--success)" }}>
                {isTyping ? "typing..." : "Online"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Chat</p>
        )}
        <div className="flex gap-2 shrink-0">
          <a href="tel:+919876543210" className="w-9 h-9 rounded-full flex items-center justify-center"
             style={{ background: "var(--success-tint)", border: "1px solid var(--success)" }}>
            <span className="text-[14px]">📞</span>
          </a>
          <button className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "var(--danger-tint)", border: "1px solid var(--danger)" }}>
            <span className="text-[14px]">🛡️</span>
          </button>
        </div>
      </div>

      {/* Chat messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ paddingBottom: 140 }}>
        {/* Date separator */}
        <div className="text-center py-2">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full"
                style={{ background: "var(--bg-elevated)", color: "var(--text-3)" }}>Today</span>
        </div>

        {state.messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[40px] mb-3">💬</p>
            <p className="text-[14px] font-bold" style={{ color: "var(--text-3)" }}>No messages yet</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Start a conversation with your worker</p>
          </div>
        )}

        {state.messages.map((msg, i) => (
          <div key={msg.id}
               className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
               style={{ animationDelay: `${i * 0.05}s` }}>
            {msg.sender === "system" ? (
              <div className="text-center w-full py-1">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full inline-block"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-3)" }}>
                  {msg.text}
                </span>
              </div>
            ) : (
              <div className="max-w-[78%]">
                <div className="rounded-[16px] px-3.5 py-2.5"
                     style={{
                       background: msg.sender === "user" ? "var(--brand)" : "var(--bg-card)",
                       borderBottomRightRadius: msg.sender === "user" ? "4px" : "16px",
                       borderBottomLeftRadius: msg.sender === "worker" ? "4px" : "16px",
                       border: msg.sender === "worker" ? "1px solid var(--border-1)" : "none",
                     }}>
                  <p className="text-[13px] leading-relaxed"
                     style={{ color: msg.sender === "user" ? "#fff" : "var(--text-1)" }}>{msg.text}</p>
                </div>
                <p className="text-[9px] mt-[3px] px-1"
                   style={{ color: "var(--text-3)", textAlign: msg.sender === "user" ? "right" : "left" }}>
                  {formatTime(msg.timestamp)}
                  {msg.sender === "user" && <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-[16px] px-4 py-3 flex gap-1.5"
                 style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", borderBottomLeftRadius: "4px" }}>
              <div className="w-2 h-2 rounded-full typing-dot" style={{ background: "var(--text-3)" }} />
              <div className="w-2 h-2 rounded-full typing-dot" style={{ background: "var(--text-3)" }} />
              <div className="w-2 h-2 rounded-full typing-dot" style={{ background: "var(--text-3)" }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick replies */}
      <div className="absolute left-0 right-0 overflow-hidden" style={{ bottom: 72 }}>
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
          {quickReplies.map(reply => (
            <button key={reply} onClick={() => handleSend(reply)}
                    className="shrink-0 rounded-[20px] px-3 py-[6px] text-[11px] font-bold active:scale-95 transition-all"
                    style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-2)" }}>
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-3 flex items-center gap-2 glass"
           style={{ borderTop: "1px solid var(--border-1)" }}>
        <button className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <span className="text-[16px]">📷</span>
        </button>
        <div className="flex-1 flex items-center rounded-[24px] px-4 py-2.5"
             style={{ background: "var(--bg-input)", border: "1px solid var(--border-1)" }}>
          <input ref={inputRef} value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                 placeholder="Type a message..." className="flex-1 text-[13px] font-semibold outline-none bg-transparent"
                 style={{ color: "var(--text-1)" }} />
          <button className="ml-2 text-[16px] active:scale-90">🎤</button>
        </div>
        <button onClick={() => handleSend()}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-all disabled:opacity-30"
                style={{ background: "var(--brand)", boxShadow: input.trim() ? "var(--shadow-brand)" : "none" }}>
          <span className="text-white text-[16px]">➤</span>
        </button>
      </div>
    </div>
  );
}
