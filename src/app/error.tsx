"use client";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "var(--bg-app)" }}>
      <div className="mb-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
             style={{ background: "rgba(255,107,0,0.08)" }}>
          <span className="text-[48px]">&#x26A0;&#xFE0F;</span>
        </div>
      </div>

      <h1 className="text-[22px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>
        Something went wrong
      </h1>
      <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-2)" }}>
        An unexpected error occurred.
      </p>
      <p className="text-[12px] mb-8" style={{ color: "var(--text-3)" }}>
        {error.message || "Please try again or go back to the home page."}
      </p>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-[16px] px-8 py-3.5 text-[13px] font-bold text-white"
          style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-[16px] px-6 py-3.5 text-[13px] font-bold"
          style={{ background: "var(--bg-elevated)", color: "var(--text-2)" }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
