import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: "var(--bg-app)" }}>
      <p className="text-[64px] mb-4">🔍</p>
      <h1 className="text-[28px] font-black mb-2" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)" }}>404</h1>
      <p className="text-[14px] mb-6" style={{ color: "var(--text-3)" }}>Page not found</p>
      <Link href="/" className="rounded-[14px] px-8 py-4 text-[14px] font-black text-white"
            style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>Back to Home</Link>
    </div>
  );
}
