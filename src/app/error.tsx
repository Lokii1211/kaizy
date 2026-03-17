"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: "var(--bg-app)" }}>
      <p className="text-[64px] mb-4">⚠️</p>
      <h1 className="text-[22px] font-black mb-2" style={{ color: "var(--text-1)" }}>Something went wrong</h1>
      <p className="text-[12px] mb-6 text-center" style={{ color: "var(--text-3)" }}>{error.message}</p>
      <button onClick={reset} className="rounded-[14px] px-8 py-4 text-[14px] font-black text-white"
              style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>Try Again</button>
    </div>
  );
}
