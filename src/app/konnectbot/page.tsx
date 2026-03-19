"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// KONNECTBOT — Real AI Chat via Claude API
// ============================================================

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: number;
}

const quickQuestions = [
  "What trades are available?",
  "How does pricing work?",
  "What is KaizyScore?",
  "How to use KaizySOS?",
  "How to register as worker?",
  "Payment methods?",
];

export default function KonnectBotPage() {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "bot", text: "Hey! 👋 I'm KaizyBot, your AI assistant. Ask me anything about finding workers, pricing, emergencies, or how Kaizy works!", timestamp: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.filter(m => m.id !== "welcome").map(m => ({ role: m.role === "bot" ? "assistant" : "user", text: m.text }));
      
      const res = await fetch("/api/konnectbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });
      const json = await res.json();

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: "bot",
        text: json.success ? json.data.reply : "Something went wrong. Please try again!",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `b-${Date.now()}`, role: "bot",
        text: "Couldn't reach the server. Check your connection and try again! 🔄",
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border-1)" }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[18px]"
                 style={{ background: "var(--brand)" }}>🤖</div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>KaizyBot</p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full online-dot" style={{ background: "var(--success)" }} />
                <p className="text-[10px] font-medium" style={{ color: "var(--success)" }}>
                  {loading ? "Thinking..." : "Online · Powered by Claude AI"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"}`}
                 style={{
                   background: msg.role === "user" ? "var(--brand)" : "var(--bg-card)",
                   border: msg.role === "bot" ? "1px solid var(--border-1)" : "none",
                 }}>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap"
                 style={{ color: msg.role === "user" ? "#fff" : "var(--text-1)" }}>
                {msg.text}
              </p>
              <p className="text-[9px] mt-1 text-right"
                 style={{ color: msg.role === "user" ? "rgba(255,255,255,0.5)" : "var(--text-3)" }}>
                {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5"
                 style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--brand)", animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--brand)", animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--brand)", animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Quick questions (only show when few messages) */}
        {messages.length <= 2 && !loading && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-3)" }}>Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                        className="text-[11px] font-medium px-3 py-2 rounded-xl active:scale-95"
                        style={{ background: "var(--bg-card)", color: "var(--brand)", border: "1px solid var(--border-1)" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid var(--border-1)", background: "var(--bg-app)" }}>
        <div className="flex gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                 onKeyDown={e => { if (e.key === "Enter" && !loading) sendMessage(input); }}
                 placeholder="Ask KaizyBot anything..."
                 className="flex-1 rounded-xl px-4 py-3 text-[13px] font-medium outline-none"
                 style={{ background: isDark ? "rgba(255,255,255,0.95)" : "#fff", color: "#111", border: "1px solid var(--border-2)" }}
                 disabled={loading} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-90 disabled:opacity-40"
                  style={{ background: "var(--brand)" }}>
            <span className="text-white text-[16px]">➤</span>
          </button>
        </div>
      </div>
    </div>
  );
}
