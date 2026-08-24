"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import { getSupabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/formatters";

// ============================================================
// KONNECTBOT AI ASSISTANT — /kaizybot
// Claude Opus Backend · Multilingual Switcher (ta, hi, te, en)
// Context-Aware Dynamic Quick Replies · Escrow Guidance · Live Scroll
// ============================================================

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  actionButton?: {
    label: string;
    url: string;
  };
}

const LANGUAGES = [
  { code: "ta", label: "தமிழ் (Tamil)", greeting: "வணக்கம்! நான் கொன்னெக்ட்பாட். இன்று உங்களுக்கு என்ன உதவி வேண்டும்?" },
  { code: "hi", label: "हिन्दी (Hindi)", greeting: "नमस्ते! मैं कोनेक्टबॉट हूँ। आज आपकी किस प्रकार सहायता कर सकता हूँ?" },
  { code: "te", label: "తెలుగు (Telugu)", greeting: "నమస్కారం! నేను కనెక్ట్‌బాట్. మీకు ఏ సహాయం కావాలి?" },
  { code: "en", label: "English", greeting: "Hello! I'm KonnectBot. How can I help with your bookings or services today?" },
];

export default function KonnectBotPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const userType = user?.user_type || "hirer";

  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initial greeting or language switch
  const initChat = useCallback((langCode: string) => {
    const langObj = LANGUAGES.find((l) => l.code === langCode) || LANGUAGES[3];
    const initialGreeting: ChatMessage = {
      id: `init-${Date.now()}`,
      sender: "bot",
      text: langObj.greeting,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([initialGreeting]);
  }, []);

  useEffect(() => {
    // Load from sessionStorage if available
    try {
      const saved = sessionStorage.getItem("konnectbot_history");
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        initChat(selectedLang);
      }
    } catch {
      initChat(selectedLang);
    }
  }, [initChat, selectedLang]);

  // Save history on change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem("konnectbot_history", JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  // Language switch handler
  const handleSwitchLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    initChat(langCode);
  };

  // ── SEND MESSAGE TO CLAUDE API BACKEND ──
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          language: selectedLang,
        }),
      });

      const json = await res.json();
      const botReply = json.reply || "I'm right here to assist you with all Kaizy services!";

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: botReply,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `b-err-${Date.now()}`,
        sender: "bot",
        text: "I'm having trouble connecting to the network right now, but you can always reach our 24/7 WhatsApp support!",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── ROLE-SPECIFIC QUICK ACTIONS ──
  const handleQuickAction = async (actionType: string) => {
    if (actionType === "emergency") {
      router.push("/hirer/sos");
      return;
    }

    if (actionType === "support") {
      window.open("https://wa.me/919876500000?text=Hello%20Kaizy%20Support", "_blank");
      return;
    }

    if (actionType === "hirer_active_booking") {
      setIsTyping(true);
      try {
        const supabase = getSupabase();
        const { data: latest } = await supabase
          .from("bookings")
          .select("*, jobs(trade, problem_type), worker:worker_id(name)")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest && latest.status !== "completed" && latest.status !== "cancelled") {
          const msg: ChatMessage = {
            id: `b-act-${Date.now()}`,
            sender: "bot",
            text: `You have an active booking with ${latest.worker?.name || "your captain"} for ${latest.jobs?.trade || "service"}. Current Status: '${latest.status.replace(/_/g, " ")}'.`,
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            actionButton: {
              label: "Track Live Location 🧭",
              url: `/hirer/tracking/${latest.id}`,
            },
          };
          setMessages((prev) => [...prev, msg]);
        } else {
          handleSendMessage("Where is my worker / what is my active booking status?");
        }
      } catch {
        handleSendMessage("What is my active booking status?");
      } finally {
        setIsTyping(false);
      }
      return;
    }

    if (actionType === "worker_find_job") {
      handleSendMessage("Find me a nearby emergency job alert in my trade right now");
      return;
    }

    if (actionType === "worker_earnings_today") {
      handleSendMessage("How much have I earned today on Kaizy?");
      return;
    }

    if (actionType === "worker_kaizyscore") {
      handleSendMessage("What is my KaazyScore and what tier benefits do I unlock?");
      return;
    }

    if (actionType === "hirer_payment_explainer") {
      handleSendMessage("How does the 3-stage escrow payment work on Kaizy?");
      return;
    }
  };

  return (
    <div
      className="h-screen w-full flex flex-col justify-between select-none relative overflow-hidden"
      style={{ background: isDark ? "var(--bg-app)" : "#F9FAFB" }}
    >
      {/* ── TOP HEADER ── */}
      <div
        className="px-5 pt-6 pb-3 border-b flex items-center justify-between sticky top-0 z-30 backdrop-blur-md"
        style={{
          background: isDark ? "rgba(10,10,10,0.92)" : "rgba(255,255,255,0.95)",
          borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center border font-bold"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          ←
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <h1
              className="text-[17px] font-black"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
            >
              KonnectBot AI
            </h1>
          </div>
          <span className="text-[10px] font-bold text-gray-400">
            Powered by Claude · Always Active
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem("konnectbot_history");
            initChat(selectedLang);
          }}
          className="text-[11px] font-bold text-gray-400 active:scale-95"
        >
          Clear
        </button>
      </div>

      {/* ── LANGUAGE SWITCHER CHIPS ── */}
      <div
        className="px-5 py-2 border-b flex gap-1.5 overflow-x-auto"
        style={{
          background: isDark ? "var(--bg-card)" : "#FFFFFF",
          borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
        }}
      >
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLang === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSwitchLanguage(lang.code)}
              className="px-3 py-1.5 rounded-full text-[11px] font-black border transition-all whitespace-nowrap active:scale-95"
              style={{
                background: isSelected ? "rgba(255,107,0,0.15)" : "transparent",
                borderColor: isSelected ? "#FF6B00" : "transparent",
                color: isSelected ? "#FF6B00" : "var(--text-2)",
              }}
            >
              {lang.label.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* ── CHAT MESSAGES CONTAINER ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} anim-up`}
            >
              <div
                className="max-w-[82%] px-4 py-3 rounded-[20px] shadow-sm leading-relaxed text-[13px]"
                style={{
                  background: isUser
                    ? "#FF6B00"
                    : isDark
                    ? "#1A1A1C"
                    : "#F3F4F6",
                  color: isUser ? "#FFFFFF" : "var(--text-1)",
                  borderBottomRightRadius: isUser ? 4 : 20,
                  borderBottomLeftRadius: isUser ? 20 : 4,
                }}
              >
                <p className="font-medium whitespace-pre-wrap">{msg.text}</p>

                {/* Optional interactive button in bot reply */}
                {msg.actionButton && (
                  <Link
                    href={msg.actionButton.url}
                    className="block mt-2.5 px-3.5 py-2 rounded-[12px] bg-[#FF6B00] text-white text-[11px] font-black text-center shadow-md active:scale-95 transition-all"
                  >
                    {msg.actionButton.label}
                  </Link>
                )}
              </div>

              <span className="text-[9px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 p-3 rounded-[18px] bg-black/5 dark:bg-white/5 w-16 anim-fade">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── DYNAMIC QUICK REPLIES BAR ── */}
      <div className="px-5 pt-2 pb-1 flex gap-2 overflow-x-auto">
        {userType === "worker" ? (
          <>
            <button
              type="button"
              onClick={() => handleQuickAction("worker_find_job")}
              className="px-3 py-1.5 rounded-full text-[11px] font-black border whitespace-nowrap active:scale-95"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)", color: "var(--text-1)" }}
            >
              🔍 Find me a job
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("worker_earnings_today")}
              className="px-3 py-1.5 rounded-full text-[11px] font-black border whitespace-nowrap active:scale-95"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)", color: "var(--text-1)" }}
            >
              💰 My earnings today
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("worker_kaizyscore")}
              className="px-3 py-1.5 rounded-full text-[11px] font-black border whitespace-nowrap active:scale-95"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)", color: "var(--text-1)" }}
            >
              📊 My KaazyScore
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("support")}
              className="px-3 py-1.5 rounded-full text-[11px] font-black border whitespace-nowrap text-green-500 bg-green-500/10 border-green-500/20 active:scale-95"
            >
              📞 Talk to support
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleQuickAction("hirer_active_booking")}
              className="px-3 py-1.5 rounded-full text-[11px] font-black border whitespace-nowrap active:scale-95"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)", color: "var(--text-1)" }}
            >
              📋 My active booking
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("emergency")}
              className="px-3 py-1.5 rounded-full text-[11px] font-black border whitespace-nowrap text-red-500 bg-red-500/10 border-red-500/20 active:scale-95"
            >
              🆘 Emergency help
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("hirer_payment_explainer")}
              className="px-3 py-1.5 rounded-full text-[11px] font-black border whitespace-nowrap active:scale-95"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)", color: "var(--text-1)" }}
            >
              💰 How does payment work?
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("support")}
              className="px-3 py-1.5 rounded-full text-[11px] font-black border whitespace-nowrap text-green-500 bg-green-500/10 border-green-500/20 active:scale-95"
            >
              📞 Talk to support
            </button>
          </>
        )}
      </div>

      {/* ── INPUT BOX BAR ── */}
      <div
        className="p-4 border-t flex items-center gap-2"
        style={{
          background: isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.98)",
          borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          placeholder="Ask KonnectBot anything..."
          className="flex-1 px-4 py-3 rounded-[18px] text-[13px] font-medium border outline-none shadow-sm"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-2)",
            color: "var(--text-1)",
          }}
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isTyping}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold active:scale-95 disabled:opacity-40 transition-all shadow-md shrink-0"
          style={{ background: "var(--brand)" }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
