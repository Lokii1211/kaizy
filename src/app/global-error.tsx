"use client";
import Link from "next/link";

// ============================================================
// 500 — "Something broke on our end 🔧"
// Branded error page per Bible BRAND-01
// ============================================================

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
             style={{ background: "#131313", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          <div className="mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                 style={{ background: "rgba(255,107,0,0.08)" }}>
              <span className="text-[48px]">🔧</span>
            </div>
          </div>

          <h1 className="text-[48px] font-black tracking-tight mb-2"
              style={{ color: "#FF6B00", fontFamily: "'Epilogue', sans-serif" }}>
            500
          </h1>

          <p className="text-[16px] font-bold mb-1" style={{ color: "#E5E2E1" }}>
            Something broke on our end
          </p>
          <p className="text-[12px] font-medium mb-8" style={{ color: "#5A4136" }}>
            Our team is fixing it. Try in a moment.
          </p>

          <div className="flex gap-3">
            <button onClick={reset}
                    className="rounded-[16px] px-8 py-3.5 text-[13px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #FF6B00, #A04100)", boxShadow: "0 8px 32px -4px rgba(255,107,0,0.3)" }}>
              Try Again
            </button>
            <a href="/"
               className="rounded-[16px] px-6 py-3.5 text-[13px] font-bold"
               style={{ background: "#1C1B1B", color: "#E5E2E1" }}>
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
