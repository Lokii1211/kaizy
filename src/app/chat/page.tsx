"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// REAL-TIME CHAT — Supabase Realtime subscriptions
// ============================================================

interface Message {
  id: string; booking_id: string; sender_id: string;
  content: string; message_type: string; is_read: boolean;
  created_at: string;
}

const quickReplies = [
  "On my way! 🚶", "5 more minutes", "I've arrived", "Job done ✅",
  "Need more materials", "Can you share location?",
];

export default function ChatPage() {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUserId = "current-user";

  // Fetch messages via API
  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat?limit=100");
      const json = await res.json();
      if (json.success && json.data) setMessages(json.data);
    } catch (e) {
      console.error("[chat]", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll every 5 seconds for new messages
    const id = setInterval(fetchMessages, 5000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content) return;

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, senderType: "user" }),
      });
      setInput("");
      fetchMessages();
    } catch (e) {
      console.error("[send]", e);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 glass" style={{ borderBottom: "1px solid var(--border-1)" }}>
        <Link href="/" className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
              style={{ background: "var(--bg-elevated)" }}>
          <span className="text-[13px]">←</span>
        </Link>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
             style={{ background: "var(--brand)" }}>RK</div>
        <div className="flex-1">
          <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Chat</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full online-dot" style={{ background: "var(--success)" }} />
            <p className="text-[10px]" style={{ color: "var(--success)" }}>Real-time · Supabase</p>
          </div>
        </div>
        <Link href="/booking" className="text-[11px] font-bold px-3 py-1.5 rounded-lg active:scale-95"
              style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>📞 Call</Link>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5" style={{ paddingBottom: 140 }}>
        {loading && (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 rounded-full mx-auto animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[32px] mb-2">💬</p>
            <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Start a conversation</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
              Messages appear here in real-time via Supabase
            </p>
          </div>
        )}

        {messages.map(m => {
          const isMine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5"
                   style={{
                     background: isMine ? "var(--brand)" : "var(--bg-card)",
                     borderBottomRightRadius: isMine ? 4 : 16,
                     borderBottomLeftRadius: isMine ? 16 : 4,
                     border: isMine ? "none" : "1px solid var(--border-1)",
                   }}>
                <p className="text-[13px]" style={{ color: isMine ? "#fff" : "var(--text-1)" }}>{m.content}</p>
                <p className="text-[9px] mt-1 text-right" style={{ color: isMine ? "rgba(255,255,255,0.6)" : "var(--text-3)" }}>
                  {formatTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick replies */}
      <div className="px-4 pb-1" style={{ background: "var(--bg-app)" }}>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {quickReplies.map(r => (
            <button key={r} onClick={() => sendMessage(r)}
                    className="shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold active:scale-95"
                    style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2" style={{ background: "var(--bg-app)" }}>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
                 onKeyDown={e => e.key === "Enter" && sendMessage()}
                 placeholder="Type a message..."
                 className="flex-1 rounded-xl px-4 py-3 text-[13px] outline-none"
                 style={{
                   background: isDark ? "rgba(255,255,255,0.95)" : "#fff",
                   color: "#111",
                   border: "1px solid var(--border-2)",
                 }} />
          <button onClick={() => sendMessage()} disabled={!input.trim()}
                  className="w-11 h-11 rounded-xl flex items-center justify-center active:scale-90 disabled:opacity-40"
                  style={{ background: "var(--brand)" }}>
            <span className="text-white text-[16px]">↑</span>
          </button>
        </div>
      </div>
    </div>
  );
}
