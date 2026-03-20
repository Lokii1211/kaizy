"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, Phone, MessageSquare, Mail, ChevronDown,
  ChevronRight, HelpCircle, IndianRupee, Shield, Star, Briefcase,
  CreditCard, AlertTriangle,
} from "lucide-react";

const categories = [
  { id: "bookings", icon: Briefcase, label: "Bookings", color: "#3B82F6",
    faqs: [
      { q: "How do I book a worker?", a: "Search for a service → Pick a worker → Select date/time → Confirm & Pay. The worker gets notified via WhatsApp." },
      { q: "Can I cancel a booking?", a: "Yes, free cancellation up to 2 hours before. After that, ₹50 cancellation fee applies." },
      { q: "What if the worker doesn't show up?", a: "We auto-assign another worker within 15 min. Full refund if no replacement found." },
      { q: "How does SOS/Emergency booking work?", a: "Tap SOS → Select service (Puncture/Mechanic/Tow) → We auto-dispatch the nearest worker. Average arrival: 10-15 min." },
    ]},
  { id: "payments", icon: IndianRupee, label: "Payments", color: "#22C55E",
    faqs: [
      { q: "How does payment work?", a: "Pay the worker directly in cash after job completion. UPI payment is also available. No platform fee during launch!" },
      { q: "Which payment methods are supported?", a: "Cash on Hand (default) and UPI (GPay/PhonePe/Paytm). Online payment coming soon." },
      { q: "When does the worker get paid?", a: "Instantly via UPI after you confirm job completion. Same-day payment, always." },
    ]},
  { id: "trust", icon: Shield, label: "Trust", color: "#00C9A7",
    faqs: [
      { q: "How are workers verified?", a: "Aadhaar e-KYC + Phone verification + NSDC certification check + Background screening." },
      { q: "What is KaizyScore?", a: "A 300-900 score measuring work quality, reliability, skills, and customer ratings. Higher score = better jobs." },
      { q: "What is KaizyPass?", a: "Your verified digital work identity with QR code. Scan to see ratings, certs, and work history." },
    ]},
  { id: "ratings", icon: Star, label: "Ratings", color: "#F59E0B",
    faqs: [
      { q: "How does the rating system work?", a: "Both workers and hirers rate each other after every job (1-5 stars). Ratings are public and can't be edited." },
      { q: "Can I dispute a bad rating?", a: "Yes. Go to Help → File Dispute. Our team reviews within 48 hours." },
    ]},
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategory, setOpenCategory] = useState("bookings");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const allFaqs = categories.flatMap(c => c.faqs.map(f => ({ ...f, category: c.id })));
  const filteredFaqs = searchQuery
    ? allFaqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 pt-3 pb-6 px-5 rounded-b-[28px]">
        <div className="flex items-center justify-between mb-4">
          <Link href="/settings" className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <span className="text-white font-bold text-sm">Help Center</span>
          <div className="w-9" />
        </div>
        <h1 className="text-xl font-extrabold text-white mb-1">How can we help?</h1>
        <p className="text-xs text-white/50 mb-4">हम कैसे मदद कर सकते हैं?</p>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            className="w-full pl-10 pr-4 py-3.5 bg-white rounded-2xl text-sm outline-none shadow-lg"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4 space-y-4 mt-5">
        {/* Quick Contact */}
        <div className="flex gap-2">
          {[
            { icon: Phone, label: "Call", color: "bg-green-50 text-green-600", border: "border-green-100" },
            { icon: MessageSquare, label: "WhatsApp", color: "bg-green-50 text-green-600", border: "border-green-100" },
            { icon: Mail, label: "Email", color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
          ].map(c => (
            <button key={c.label} className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl ${c.color} border ${c.border} active:scale-95 transition-transform`}>
              <c.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{c.label}</span>
            </button>
          ))}
        </div>

        {/* Search Results */}
        {filteredFaqs && (
          <div>
            <p className="text-xs font-bold text-gray-400 mb-2">{filteredFaqs.length} results found</p>
            <div className="space-y-2">
              {filteredFaqs.map((f, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-sm font-bold mb-1">{f.q}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category FAQs */}
        {!filteredFaqs && (
          <>
            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setOpenCategory(c.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                    openCategory === c.id ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <c.icon className="w-3.5 h-3.5" /> {c.label}
                </button>
              ))}
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-2">
              {categories.find(c => c.id === openCategory)?.faqs.map((faq, i) => {
                const key = `${openCategory}-${i}`;
                const isOpen = openFaq === key;
                return (
                  <button
                    key={key}
                    onClick={() => setOpenFaq(isOpen ? null : key)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold flex-1 pr-2">{faq.q}</p>
                      <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                    {isOpen && (
                      <p className="text-xs text-gray-500 leading-relaxed mt-3 pt-3 border-t border-gray-100">{faq.a}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Still need help */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 text-center border border-blue-100">
          <HelpCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="font-extrabold text-sm mb-1">Still need help?</p>
          <p className="text-xs text-gray-400 mb-3">Our team responds within 5 minutes</p>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/konnectbot" className="py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform">
              <MessageSquare className="w-4 h-4" /> Live Chat
            </Link>
            <Link href="/dispute" className="py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 flex items-center justify-center gap-1 active:scale-95 transition-transform">
              <AlertTriangle className="w-4 h-4" /> Dispute
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
