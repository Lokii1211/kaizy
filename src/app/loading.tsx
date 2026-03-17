"use client";
export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--bg-app)" }}>
      <div className="w-12 h-12 rounded-full animate-spin mb-4" style={{ border: "3px solid var(--bg-elevated)", borderTopColor: "var(--brand)" }} />
      <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Loading...</p>
      <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Kaizy</p>
    </div>
  );
}
