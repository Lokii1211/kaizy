// ============================================================
// 404 — "This page took a wrong turn 🗺️"
// Branded error page per Bible BRAND-01
// ============================================================
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
         style={{ background: "var(--bg-app)" }}>
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
             style={{ background: "var(--brand-tint)" }}>
          <span className="text-[48px]">🗺️</span>
        </div>
      </div>

      <h1 className="text-[48px] font-black tracking-tight mb-2"
          style={{ color: "var(--brand)", fontFamily: "'Epilogue', sans-serif" }}>
        404
      </h1>

      <p className="text-[16px] font-bold mb-1" style={{ color: "var(--text-1)" }}>
        This page took a wrong turn
      </p>
      <p className="text-[12px] font-medium mb-8" style={{ color: "var(--text-3)" }}>
        Let&apos;s get you back on track
      </p>

      <Link href="/"
            className="inline-block rounded-[16px] px-8 py-3.5 text-[13px] font-bold text-white active:scale-95 transition-transform"
            style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
        ← Go Home
      </Link>
    </div>
  );
}
