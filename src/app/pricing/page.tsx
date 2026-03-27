"use client";

import Link from "next/link";

// ============================================================
// PRICING TRANSPARENCY v10.0 — Stitch "Digital Artisan" Design
// JetBrains Mono pricing · Epilogue headlines · No borders
// ============================================================

const pricingCategories = [
  {
    trade: "Electrician",
    icon: "⚡",
    services: [
      { name: "Fan Installation", base: 200, labor: 150, platform: 0, total: 350 },
      { name: "Full House Wiring", base: 800, labor: 1200, platform: 0, total: 2000 },
      { name: "MCB/Fuse Box Repair", base: 300, labor: 400, platform: 0, total: 700 },
      { name: "Switch & Socket Replacement", base: 100, labor: 150, platform: 0, total: 250 },
    ],
  },
  {
    trade: "Plumber",
    icon: "🔧",
    services: [
      { name: "Tap Leak Repair", base: 150, labor: 200, platform: 0, total: 350 },
      { name: "Toilet Repair", base: 300, labor: 400, platform: 0, total: 700 },
      { name: "Full Bathroom Fitting", base: 2000, labor: 3000, platform: 0, total: 5000 },
      { name: "Water Tank Installation", base: 800, labor: 600, platform: 0, total: 1400 },
    ],
  },
  {
    trade: "Carpenter",
    icon: "🪚",
    services: [
      { name: "Door Hinge Repair", base: 100, labor: 200, platform: 0, total: 300 },
      { name: "Furniture Assembly", base: 0, labor: 500, platform: 0, total: 500 },
      { name: "Modular Kitchen Install", base: 5000, labor: 3000, platform: 0, total: 8000 },
      { name: "Shelf/Rack Installation", base: 200, labor: 300, platform: 0, total: 500 },
    ],
  },
  {
    trade: "Mechanic",
    icon: "🏍️",
    services: [
      { name: "Puncture Repair", base: 50, labor: 100, platform: 0, total: 150 },
      { name: "Oil Change", base: 300, labor: 200, platform: 0, total: 500 },
      { name: "Brake Pad Replacement", base: 400, labor: 300, platform: 0, total: 700 },
      { name: "Full Service", base: 800, labor: 700, platform: 0, total: 1500 },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <div>
            <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              Pricing Transparency
            </h1>
            <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>Zero hidden fees, zero platform charges</p>
          </div>
        </div>

        {/* Zero fee banner */}
        <div className="rounded-[18px] p-5 text-center" style={{ background: "var(--gradient-cta)" }}>
          <p className="text-[32px] font-black text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>₹0</p>
          <p className="text-[12px] font-bold text-white/80">Platform Fee</p>
          <p className="text-[9px] font-medium text-white/50 mt-1">
            During launch: no commission, no booking fee. Workers earn 100% of labor charges.
          </p>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Breakdown legend */}
        <div className="flex gap-2">
          {[
            { label: "Material", color: "var(--info)" },
            { label: "Labor", color: "var(--brand)" },
            { label: "Platform", color: "var(--success)" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                 style={{ background: "var(--bg-surface)" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span className="text-[9px] font-bold" style={{ color: "var(--text-2)" }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Category accordion */}
        {pricingCategories.map(cat => (
          <div key={cat.trade}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[18px]">{cat.icon}</span>
              <p className="text-[13px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                {cat.trade}
              </p>
            </div>

            <div className="space-y-2">
              {cat.services.map(svc => (
                <div key={svc.name} className="rounded-[16px] p-4" style={{ background: "var(--bg-card)" }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{svc.name}</p>
                    <p className="text-[14px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                      ₹{svc.total.toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Cost breakdown bar */}
                  <div className="flex rounded-full overflow-hidden mb-2" style={{ height: 6 }}>
                    {svc.base > 0 && (
                      <div style={{ width: `${(svc.base / svc.total) * 100}%`, background: "var(--info)" }} />
                    )}
                    <div style={{ width: `${(svc.labor / svc.total) * 100}%`, background: "var(--brand)" }} />
                    <div style={{ width: `${(svc.platform / svc.total) * 100}%`, background: "var(--success)" }} />
                  </div>

                  <div className="flex gap-3">
                    {svc.base > 0 && (
                      <span className="text-[8px] font-bold" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                        Material: ₹{svc.base}
                      </span>
                    )}
                    <span className="text-[8px] font-bold" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                      Labor: ₹{svc.labor}
                    </span>
                    <span className="text-[8px] font-bold" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
                      Fee: ₹0
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Fair pricing guarantee */}
        <div className="rounded-[20px] p-5 text-center" style={{ background: "var(--brand-tint)" }}>
          <span className="text-[32px] block mb-2">🤝</span>
          <p className="text-[14px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Fair Pricing Guarantee
          </p>
          <p className="text-[10px] mt-1.5 font-medium leading-relaxed" style={{ color: "var(--text-3)" }}>
            All prices shown are estimates. Final price is agreed between you and the worker before the job starts.
            No surprise charges, ever.
          </p>
          <Link href="/booking"
                className="inline-block mt-4 rounded-[14px] px-6 py-3 text-[12px] font-bold text-white active:scale-95 transition-transform"
                style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
            Book a Worker →
          </Link>
        </div>
      </div>
    </div>
  );
}
