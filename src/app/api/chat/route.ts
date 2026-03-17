import { NextRequest, NextResponse } from "next/server";

// ============================================================
// Kaizy — REAL-TIME MESSAGING API v2
// WhatsApp-style · Quick replies (EN/HI/TA) · Voice · Location
// ============================================================

interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderType: "hirer" | "worker" | "system";
  messageType: "text" | "voice" | "image" | "quick_reply" | "system" | "location";
  content: string;
  mediaUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// In-memory store (production: Supabase with realtime)
const chatStore = new Map<string, ChatMessage[]>();

// ── QUICK REPLY TEMPLATES ──
const WORKER_QUICK_REPLIES = [
  { en: "I'm on my way", hi: "मैं आ रहा हूँ", ta: "வருகிறேன்" },
  { en: "I've arrived", hi: "मैं पहुँच गया", ta: "வந்துவிட்டேன்" },
  { en: "Give me 5 more minutes", hi: "5 मिनट और लगेंगे", ta: "5 நிமிடம் ஆகும்" },
  { en: "I need a specific part, will take 30 min more", hi: "एक पार्ट चाहिए, 30 मिनट और", ta: "ஒரு பாகம் வேண்டும், 30 நிமிடம்" },
  { en: "Job is complete", hi: "काम हो गया", ta: "வேலை முடிந்தது" },
  { en: "I cannot find your address — call me", hi: "पता नहीं मिल रहा — फोन करो", ta: "முகவரி கிடைக்கவில்லை — அழைக்கவும்" },
  { en: "Which floor are you on?", hi: "कौन सी मंजिल?", ta: "எந்த மாடி?" },
];

const HIRER_QUICK_REPLIES = [
  { en: "I'm waiting downstairs", hi: "मैं नीचे हूँ", ta: "கீழே காத்திருக்கிறேன்" },
  { en: "Please call when you arrive", hi: "पहुँचने पर फोन करना", ta: "வந்ததும் அழைக்கவும்" },
  { en: "The gate code is:", hi: "गेट कोड है:", ta: "கேட் கோட்:" },
  { en: "Take a left after the main gate", hi: "मुख्य गेट के बाद बायें", ta: "பிரதான வாசல் வழியே இடது" },
  { en: "I'm not home, please wait 10 min", hi: "मैं घर पर नहीं, 10 मिनट रुको", ta: "வீட்டில் இல்லை, 10 நிமிடம்" },
  { en: "Can you bring tools for this?", hi: "इसके लिए सामान लाना", ta: "இதற்கான கருவிகள் கொண்டு வாருங்கள்" },
];

// Worker auto-reply pool
const WORKER_REPLIES = [
  "Okay, noted! 👍", "Sure, on my way 🏍️", "Yes, I can do that",
  "No problem at all", "I'll bring the tools", "Coming soon!",
  "5 min away", "Almost there 📍", "Haan, aa raha hoon",
  "Theek hai, pahunch raha hoon", "Okay boss!", "Will be there in 10 min",
  "Gate pe hoon, please open", "Main aa gaya hoon",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── SEND MESSAGE ──
    if (action === "send") {
      const { bookingId, text, sender = "hirer", messageType = "text", mediaUrl = null } = body;

      if (!bookingId || !text) {
        return NextResponse.json({ success: false, error: "bookingId and text required" }, { status: 400 });
      }

      const messages = chatStore.get(bookingId) || [];
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        bookingId, senderId: sender === "hirer" ? "hirer-001" : "worker-001",
        senderType: sender, messageType, content: text, mediaUrl,
        isRead: false, readAt: null, createdAt: new Date().toISOString(),
      };

      messages.push(newMsg);

      // Auto-reply from worker (simulate real-time)
      if (sender === "hirer") {
        const replyDelay = 1500 + Math.random() * 3000;
        setTimeout(() => {
          const reply: ChatMessage = {
            id: `msg-${Date.now()}-reply`,
            bookingId, senderId: "worker-001", senderType: "worker",
            messageType: "text",
            content: WORKER_REPLIES[Math.floor(Math.random() * WORKER_REPLIES.length)],
            mediaUrl: null, isRead: false, readAt: null,
            createdAt: new Date().toISOString(),
          };
          messages.push(reply);
        }, replyDelay);
      }

      chatStore.set(bookingId, messages);

      return NextResponse.json({
        success: true,
        data: newMsg,
      });
    }

    // ── GET HISTORY ──
    if (action === "history") {
      const { bookingId, since } = body;
      const messages = chatStore.get(bookingId) || [];
      const filtered = since
        ? messages.filter(m => new Date(m.createdAt) > new Date(since))
        : messages;

      return NextResponse.json({
        success: true,
        data: {
          messages: filtered,
          total: filtered.length,
          bookingId,
        },
      });
    }

    // ── MARK READ ──
    if (action === "mark_read") {
      const { bookingId, messageIds } = body;
      const messages = chatStore.get(bookingId) || [];
      const now = new Date().toISOString();

      if (messageIds) {
        messages.filter(m => messageIds.includes(m.id)).forEach(m => { m.isRead = true; m.readAt = now; });
      } else {
        messages.filter(m => !m.isRead).forEach(m => { m.isRead = true; m.readAt = now; });
      }

      chatStore.set(bookingId, messages);
      return NextResponse.json({ success: true, message: "Marked as read" });
    }

    // ── SEND SYSTEM MESSAGE ──
    if (action === "system") {
      const { bookingId, text } = body;
      const messages = chatStore.get(bookingId) || [];
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        bookingId, senderId: "system", senderType: "system",
        messageType: "system", content: text, mediaUrl: null,
        isRead: true, readAt: null, createdAt: new Date().toISOString(),
      };
      messages.push(sysMsg);
      chatStore.set(bookingId, messages);
      return NextResponse.json({ success: true, data: sysMsg });
    }

    // ── GET QUICK REPLIES ──
    if (action === "quick_replies") {
      const { userType = "hirer", language = "en" } = body;
      const replies = userType === "worker" ? WORKER_QUICK_REPLIES : HIRER_QUICK_REPLIES;
      const localized = replies.map(r => ({
        text: (r as Record<string, string>)[language] || r.en,
        en: r.en,
      }));
      return NextResponse.json({ success: true, data: localized });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// GET: Fetch chat messages
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");

  if (!bookingId) {
    return NextResponse.json({ success: true, data: { activeChats: chatStore.size } });
  }

  const messages = chatStore.get(bookingId) || [];
  return NextResponse.json({
    success: true,
    data: { messages, total: messages.length, bookingId },
  });
}
