"use client";
import { useState } from "react";
import Link from "next/link";

const posTags = ["✓ On Time","✓ Good Work","✓ Polite","✓ Clean","✓ Fair Price"];
const negTags = ["✗ Late","✗ Overcharged","✗ Rude","✗ Messy"];

export default function ReviewPage() {
  const [rating, setRating] = useState(4);
  const [selPos, setSelPos] = useState<number[]>([0,1]);
  const [selNeg, setSelNeg] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: "var(--bg-app)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 animate-bounce-in"
             style={{ background: "var(--success)", boxShadow: "0 8px 32px rgba(0,208,132,0.3)" }}>
          <span className="text-white text-[32px]">✓</span>
        </div>
        <h1 className="text-[24px] font-black" style={{ color: "var(--text-1)" }}>Thank You! 🌟</h1>
        <p className="text-[14px] mt-2 text-center" style={{ color: "var(--text-3)" }}>₹600 released to Suresh instantly</p>
        <Link href="/" className="mt-8 rounded-[14px] px-8 py-4 text-[15px] font-black text-white"
              style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>How was Suresh? 🌟</h1>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Your review helps other hirers</p>
      </div>
      <div className="flex items-center gap-3 rounded-[12px] p-3 mx-4 mb-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
        <div className="rounded-full flex items-center justify-center text-[18px] font-black text-white shrink-0" style={{ width: 44, height: 44, background: "#8B5CF6" }}>S</div>
        <div><p className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>Suresh Murugesan</p>
        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>🚗 Car Breakdown · ₹600</p></div>
      </div>
      <div className="flex justify-center gap-2 px-4 py-3 text-[32px]">
        {[1,2,3,4,5].map(s => (<button key={s} onClick={() => setRating(s)} className="active:scale-110">{s <= rating ? "⭐" : "☆"}</button>))}
      </div>
      <div className="px-4">
        <p className="text-[11px] font-bold mb-2" style={{ color: "var(--text-3)" }}>What went well?</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {posTags.map((t,i) => (
            <button key={t} onClick={() => setSelPos(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                    className="text-[10px] font-bold px-3 py-[5px] rounded-[20px] active:scale-95"
                    style={{ background: selPos.includes(i) ? "var(--success)" : "var(--success-tint)", color: selPos.includes(i) ? "#fff" : "var(--success)", border: "1px solid var(--success)" }}>{t}</button>
          ))}
        </div>
        <p className="text-[11px] font-bold mb-2 mt-3" style={{ color: "var(--text-3)" }}>Any issues?</p>
        <div className="flex flex-wrap gap-2">
          {negTags.map((t,i) => (
            <button key={t} onClick={() => setSelNeg(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                    className="text-[10px] font-bold px-3 py-[5px] rounded-[20px] active:scale-95"
                    style={{ background: selNeg.includes(i) ? "var(--danger)" : "var(--danger-tint)", color: selNeg.includes(i) ? "#fff" : "var(--danger)", border: "1px solid var(--danger)" }}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-[12px] p-3 mx-4 mt-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px]" style={{ background: "var(--brand)" }}>🎙️</div>
        <div><p className="text-[11px]" style={{ color: "var(--text-2)" }}>Tap to record a voice review</p><p className="text-[9px]" style={{ color: "var(--text-3)" }}>या बोलकर review दें</p></div>
      </div>
      <div className="mx-4 mt-3">
        <button onClick={() => setSubmitted(true)} className="w-full rounded-[12px] py-[14px] text-center active:scale-[0.98]"
                style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>
          <p className="text-[13px] font-black text-white">Submit Review & Release ₹600</p>
          <p className="text-[10px] mt-[3px]" style={{ color: "rgba(255,255,255,0.6)" }}>Payment sent to Suresh immediately</p>
        </button>
      </div>
    </div>
  );
}
