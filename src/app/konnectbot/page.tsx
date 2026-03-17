"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Zap, Send, Mic, Globe, ArrowLeft, Phone, Bot, User,
  Briefcase, IndianRupee, MapPin, Star, CheckCircle2,
  ChevronRight, Sparkles,
} from "lucide-react";

interface Message {
  id: number;
  type: "user" | "bot";
  text: string;
  time: string;
  options?: string[];
}

const quickReplies = [
  "🔍 Find me a job",
  "💰 Check my earnings",
  "📊 My KonnectScore",
  "📚 Learn new skills",
  "💳 Payment status",
  "🆘 Need help",
];

const initialMessages: Message[] = [
  {
    id: 1,
    type: "bot",
    text: "👋 Namaste! Main KonnectBot hoon — aapka AI assistant.\n\nMain Hindi, Tamil, Telugu, Bengali + 4 aur languages mein help kar sakta hoon.\n\nAap kya jaanna chahte hain?",
    time: "Now",
    options: quickReplies,
  },
];

const botResponses: Record<string, { text: string; options?: string[] }> = {
  "find me a job": {
    text: "🔍 **Job Search Results for Coimbatore:**\n\n1️⃣ **Shop Rewiring** — Kumar Electronics, RS Puram\n   💰 ₹1,800 | ⏰ Tomorrow 9 AM\n\n2️⃣ **AC Service (3 units)** — Green Homes, Saibaba Colony\n   💰 ₹3,500 | ⏰ Today 2 PM\n\n3️⃣ **MCB Panel Install** — Apex Apartments\n   💰 ₹2,500 | ⏰ This week\n\nKaunsa job accept karna hai? Number bhejo or \"more jobs\" likhein.",
    options: ["Accept Job 1", "Accept Job 2", "More Jobs", "🏠 Main Menu"],
  },
  "check my earnings": {
    text: "💰 **Your Earnings Summary:**\n\n📅 This Week: **₹4,200**\n📅 This Month: **₹18,600**\n📅 Total (All Time): **₹4,86,000**\n\n📊 **Last 3 Payments:**\n• ₹1,800 — Shop Rewiring (Today ✅)\n• ₹2,500 — MCB Install (Yesterday ✅)\n• ₹4,500 — Solar Panel (Mar 10 ✅)\n\nAll payments same-day UPI. Zero pending! 🎉",
    options: ["Download Statement", "Payment History", "🏠 Main Menu"],
  },
  "my konnectscore": {
    text: "📊 **Your KonnectScore™: 780/900**\n\n⬆️ +45 points this month! Great going!\n\n**Score Breakdown:**\n✅ Job Completion Rate: 98% (+20 pts)\n✅ On-time Arrival: 95% (+15 pts)\n✅ Customer Ratings: 4.8★ (+10 pts)\n✅ Skill Certifications: 3 badges\n\n**Benefits Unlocked:**\n🏦 Eligible for ₹50,000 loan at 12% PA\n🛡️ Free accidental insurance\n📱 KonnectPremium features\n\nKya aap loan apply karna chahte hain?",
    options: ["Apply for Loan", "Improve Score Tips", "🏠 Main Menu"],
  },
  "learn new skills": {
    text: "📚 **KonnectLearn — Recommended for You:**\n\n🔥 **High Demand Skills Near You:**\n\n1️⃣ **Solar Panel Installation** (FREE)\n   12 video lessons • Hindi + Tamil\n   Badge: Solar Certified ⚡\n\n2️⃣ **VRF AC Systems** (FREE)\n   8 lessons • Hindi\n   Badge: Advanced AC Tech 🏆\n\n3️⃣ **Industrial 3-Phase Wiring** (FREE)\n   16 lessons • Hindi\n   Badge: Industrial Electrician ⚡\n\nBadge earn karne se 40% zyada jobs milenge!",
    options: ["Start Course 1", "Start Course 2", "All Courses", "🏠 Main Menu"],
  },
  "payment status": {
    text: "💳 **Payment Status:**\n\n✅ **₹1,800** — Kumar Electronics\n   Released to UPI today at 4:30 PM\n\n⏳ **₹2,200** — Apex Apartments\n   In escrow — job in progress\n\n📅 **₹3,500** — Green Homes\n   Scheduled for tomorrow\n\nSab payments UPI se directly aapke account mein aayenge. No middleman! 💪",
    options: ["UPI History", "Raise Dispute", "🏠 Main Menu"],
  },
  "need help": {
    text: "🆘 **Help Center**\n\nMain aapki kaise help kar sakta hoon?\n\n1️⃣ Account se related\n2️⃣ Job booking issue\n3️⃣ Payment problem\n4️⃣ KonnectPassport update\n5️⃣ Report a concern\n6️⃣ Talk to human agent\n\nNumber ya topic bhejein, main turant help karunga!",
    options: ["Talk to Human", "Account Help", "Payment Issue", "🏠 Main Menu"],
  },
  "default": {
    text: "🤔 Samajh gaya! Main is topic pe abhi aur smart ho raha hoon.\n\nFilhaal ye try karein:",
    options: quickReplies,
  },
};

export default function KonnectBotPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState("Hindi");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: messages.length + 1,
      type: "user",
      text: text.trim(),
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate bot thinking
    setTimeout(() => {
      const cleanText = text.toLowerCase().replace(/[^a-z\s]/g, "").trim();
      const matchKey = Object.keys(botResponses).find(
        (key) => key !== "default" && cleanText.includes(key)
      );
      const response = botResponses[matchKey || "default"];

      const botMsg: Message = {
        id: messages.length + 2,
        type: "bot",
        text: response.text,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        options: response.options,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1E293B] to-[#334155] text-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-lg">
        <Link href="/" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm">KonnectBot</h1>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <p className="text-white/60 text-[10px]">AI Assistant • Always Online • 8 Languages</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 border border-white/10 outline-none"
          >
            {["Hindi", "Tamil", "Telugu", "Bengali", "Kannada", "Marathi", "English", "Gujarati"].map((l) => (
              <option key={l} value={l} className="text-black">{l}</option>
            ))}
          </select>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* WhatsApp-style background */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}>
        {/* Date Header */}
        <div className="flex justify-center">
          <span className="bg-white/80 backdrop-blur-sm text-[var(--color-muted)] text-[10px] font-medium px-4 py-1 rounded-full shadow-sm">
            Today
          </span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${msg.type === "user" ? "order-last" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-3 shadow-sm ${
                  msg.type === "user"
                    ? "bg-[#FF6B2C] text-white rounded-br-md"
                    : "bg-white text-[var(--foreground)] rounded-bl-md"
                }`}
              >
                {msg.type === "bot" && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6B2C]" />
                    <span className="text-[10px] font-bold text-[#FF6B2C]">KonnectBot</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 text-right ${msg.type === "user" ? "text-white/60" : "text-[var(--color-muted)]"}`}>
                  {msg.time}
                </p>
              </div>

              {/* Quick Reply Options */}
              {msg.options && msg.type === "bot" && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => sendMessage(opt)}
                      className="bg-white text-[#FF6B2C] text-xs font-medium px-3 py-2 rounded-xl border border-[#FF6B2C]/20 hover:bg-[#FF6B2C]/5 transition-colors shadow-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white border-t border-[#E2E8F0] px-3 py-3 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button type="button" className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-[var(--color-muted)]">
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-[#F8FAFC] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 transition-all"
            placeholder="Type a message or tap a quick reply..."
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-[#FF6B2C] text-white disabled:opacity-50 transition-all hover:bg-[#E55A1B]"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
