"use client";

import { useState } from "react";
import Link from "next/link";

// ============================================================
// HELP & FAQ v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · Tonal surfaces · No borders · Gradient CTAs
// ============================================================

const categories = [
  { id: "payments", icon: "💳", label: "Payment Issues", color: "#22C55E",
    desc: "Refunds, billing cycles, and secure transactions",
    faqs: [
      { q: "How does payment work?", a: "Pay the worker directly in cash after job completion. UPI payment is also available. No platform fee during launch!" },
      { q: "Which payment methods are supported?", a: "Cash on Hand (default) and UPI (GPay/PhonePe/Paytm). Online payment coming soon." },
      { q: "When does the worker get paid?", a: "Instantly via UPI after you confirm job completion. Same-day payment, always." },
    ]},
  { id: "bookings", icon: "📋", label: "Booking Help", color: "#3B82F6",
    desc: "Rescheduling, cancellations, and booking status",
    faqs: [
      { q: "How do I book a worker?", a: "Search for a service → Pick a worker → Select date/time → Confirm & Pay. The worker gets notified via WhatsApp." },
      { q: "Can I cancel a booking?", a: "Yes, free cancellation up to 2 hours before. After that, ₹50 cancellation fee applies." },
      { q: "What if the worker doesn't show up?", a: "We auto-assign another worker within 15 min. Full refund if no replacement found." },
      { q: "How does SOS/Emergency booking work?", a: "Tap SOS → Select service (Puncture/Mechanic/Tow) → We auto-dispatch the nearest worker. Average arrival: 10-15 min." },
    ]},
  { id: "safety", icon: "🛡️", label: "Safety & SOS", color: "#EF4444",
    desc: "Emergency protocols and onsite safety guidelines",
    faqs: [
      { q: "How are workers verified?", a: "Aadhaar e-KYC + Phone verification + NSDC certification check + Background screening." },
      { q: "What is KaizyScore?", a: "A 300-900 score measuring work quality, reliability, skills, and customer ratings. Higher score = better jobs." },
      { q: "What is KaizyPass?", a: "Your verified digital work identity with QR code. Scan to see ratings, certs, and work history." },
    ]},
  { id: "profile", icon: "👤", label: "Profile & Documents", color: "#F59E0B",
    desc: "KYC verification, certifications, and account settings",
    faqs: [
      { q: "How does the rating system work?", a: "Both workers and hirers rate each other after every job (1-5 stars). Ratings are public and can't be edited." },
      { q: "Can I dispute a bad rating?", a: "Yes. Go to Help → File Dispute. Our team reviews within 48 hours." },
    ]},
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategory, setOpenCategory] = useState("payments");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const allFaqs = categories.flatMap(c => c.faqs.map(f => ({ ...f, category: c.id, categoryLabel: c.label })));
  const filteredFaqs = searchQuery
    ? allFaqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Hero header — Stitch gradient */}
      <div className="px-5 pt-5 pb-7 rounded-b-[28px]" style={{ background: "var(--gradient-cta)" }}>
        <div className="flex items-center justify-between mb-5">
          <Link href="/settings" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "rgba(255,255,255,0.15)" }}>
            <span className="text-[14px] text-white">←</span>
          </Link>
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Support</span>
          <div className="w-9" />
        </div>
        <h1 className="text-[22px] font-black tracking-tight text-white" style={{ fontFamily: "'Epilogue', sans-serif" }}>
          How can we support you?
        </h1>
        <p className="text-[11px] mt-1 font-medium text-white/50">
          Explore our knowledge base or get in touch with our specialist team
        </p>

        {/* Search */}
        <div className="relative mt-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px]">🔍</span>
          <input
            className="w-full pl-10 pr-4 py-3.5 rounded-[16px] text-[12px] font-semibold outline-none"
            style={{ background: "rgba(255,255,255,0.95)", color: "#111" }}
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-5 space-y-4 mt-5">
        {/* Quick Contact — Stitch tonal cards */}
        <div className="flex gap-2.5">
          {[
            { icon: "📞", label: "Call", bg: "var(--bg-surface)", href: "tel:+919876543210" },
            { icon: "💬", label: "WhatsApp", bg: "var(--bg-surface)", href: "https://wa.me/919876543210?text=Hi%20Kaizy%20Support" },
            { icon: "📧", label: "Email", bg: "var(--bg-surface)", href: "mailto:support@kaizy.com" },
          ].map(c => (
            <a key={c.label} href={c.href}
               className="flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-[16px] active:scale-95 transition-transform"
               style={{ background: c.bg }}>
              <span className="text-[20px]">{c.icon}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>{c.label}</span>
            </a>
          ))}
        </div>

        {/* Status bar — Stitch system uptime */}
        <div className="flex items-center gap-3 rounded-[14px] p-3.5" style={{ background: "var(--success-tint, rgba(34,197,94,0.08))" }}>
          <div className="w-2.5 h-2.5 rounded-full online-dot" style={{ background: "var(--success)" }} />
          <div className="flex-1">
            <p className="text-[10px] font-bold" style={{ color: "var(--text-1)" }}>All Systems Operational</p>
            <p className="text-[8px] font-medium" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
              Avg response: 2 min
            </p>
          </div>
          <span className="text-[8px] font-bold px-2 py-1 rounded-full" style={{ background: "var(--success)", color: "#fff" }}>LIVE</span>
        </div>

        {/* Search Results */}
        {filteredFaqs && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
              {filteredFaqs.length} results found
            </p>
            <div className="space-y-2">
              {filteredFaqs.map((f, i) => (
                <div key={i} className="rounded-[16px] p-4" style={{ background: "var(--bg-card)" }}>
                  <p className="text-[12px] font-bold mb-1" style={{ color: "var(--text-1)" }}>{f.q}</p>
                  <p className="text-[10px] font-medium leading-relaxed" style={{ color: "var(--text-3)" }}>{f.a}</p>
                  <span className="text-[8px] font-bold mt-2 inline-block px-2 py-0.5 rounded-full"
                        style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>{f.categoryLabel}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Grid — Stitch design */}
        {!filteredFaqs && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {categories.map(c => (
                <button key={c.id} onClick={() => setOpenCategory(c.id)}
                        className="rounded-[18px] p-4 text-left active:scale-[0.96] transition-all"
                        style={{
                          background: openCategory === c.id ? `${c.color}12` : "var(--bg-card)",
                          boxShadow: openCategory === c.id ? `0 0 0 2px ${c.color}` : "var(--shadow-sm)",
                        }}>
                  <span className="text-[24px] mb-2 block">{c.icon}</span>
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{c.label}</p>
                  <p className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>{c.desc}</p>
                </button>
              ))}
            </div>

            {/* FAQ Accordion — Stitch tonal cards */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                {categories.find(c => c.id === openCategory)?.label} FAQ
              </p>
              {categories.find(c => c.id === openCategory)?.faqs.map((faq, i) => {
                const key = `${openCategory}-${i}`;
                const isOpen = openFaq === key;
                return (
                  <button key={key} onClick={() => setOpenFaq(isOpen ? null : key)}
                          className="w-full rounded-[16px] p-4 text-left active:scale-[0.98] transition-all"
                          style={{ background: "var(--bg-surface)" }}>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-bold flex-1 pr-2" style={{ color: "var(--text-1)" }}>{faq.q}</p>
                      <span className="text-[12px] shrink-0 transition-transform" style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: "var(--text-3)",
                      }}>▼</span>
                    </div>
                    {isOpen && (
                      <p className="text-[10px] font-medium leading-relaxed mt-3 pt-3"
                         style={{ color: "var(--text-3)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>{faq.a}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Still need help — Stitch CTA block */}
        <div className="rounded-[20px] p-6 text-center" style={{ background: "var(--brand-tint)" }}>
          <span className="text-[32px] block mb-2">💬</span>
          <p className="text-[14px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Still need help?
          </p>
          <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--text-3)" }}>Our team responds within 2 minutes</p>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <Link href="/konnectbot"
                  className="py-3.5 rounded-[14px] font-bold text-[12px] text-white flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
              💬 Live Chat
            </Link>
            <Link href="/dispute"
                  className="py-3.5 rounded-[14px] font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  style={{ background: "var(--bg-card)", color: "var(--text-1)" }}>
              ⚠️ Dispute
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
