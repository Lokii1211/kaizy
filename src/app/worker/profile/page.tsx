"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface UserProfile {
  name: string; phone: string; user_type: string;
  trade?: string; experience_years?: number;
  avg_rating?: number; total_jobs?: number; kaizy_score?: number;
  aadhaar_verified?: boolean; bio?: string;
}

export default function KaizyPassPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => {
      if (j.success && j.data) setUser(j.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const name = user?.name || user?.phone?.replace("+91", "") || "User";
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const trade = user?.trade || "Worker";
  const exp = user?.experience_years || 0;
  const rating = user?.avg_rating || 0;
  const jobs = user?.total_jobs || 0;
  const ks = user?.kaizy_score || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <span className="text-[14px]">←</span>
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center px-4 pt-2 pb-5" style={{ background: "linear-gradient(180deg, rgba(255,107,0,0.08) 0%, var(--bg-app) 100%)" }}>
        <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-[32px] font-black text-white mx-auto mb-3"
             style={{ background: "var(--brand)", boxShadow: "0 0 0 4px rgba(255,107,0,0.15), var(--shadow-brand)" }}>{initials}</div>
        <h1 className="text-[20px] font-black" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)" }}>{name}</h1>
        <p className="text-[12px] font-bold" style={{ color: "var(--brand)" }}>{trade} · {exp} yrs</p>
        <div className="flex justify-center gap-2 mt-2">
          {user?.aadhaar_verified && (
            <span className="text-[9px] font-bold px-2.5 py-1 rounded-[20px]" style={{ border: "1px solid var(--success)", color: "var(--success)" }}>✓ Aadhaar</span>
          )}
          {rating >= 4.5 && (
            <span className="text-[9px] font-bold px-2.5 py-1 rounded-[20px]" style={{ border: "1px solid var(--warning)", color: "var(--warning)" }}>⭐ Top Rated</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mx-4 mb-4">
        {[
          { v: rating > 0 ? `${rating.toFixed(1)} ⭐` : "—", l: "Rating", c: "var(--brand)" },
          { v: String(jobs), l: "Jobs Done", c: "var(--text-1)" },
          { v: jobs > 0 ? `${Math.round((jobs / Math.max(jobs + 2, 1)) * 100)}%` : "—", l: "Completion", c: "var(--success)" },
        ].map(s => (
          <div key={s.l} className="rounded-[14px] py-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[18px] font-black" style={{ color: s.c }}>{s.v}</p>
            <p className="text-[9px] font-semibold" style={{ color: "var(--text-3)" }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* KaizyScore */}
      <div className="mx-4 rounded-[14px] p-4 mb-4" style={{ background: "var(--bg-card)", border: "2px solid var(--brand)" }}>
        <div className="flex items-center gap-3">
          <p className="text-[36px] font-black" style={{ color: "var(--brand)", fontFamily: "var(--font-syne)" }}>{ks}</p>
          <div className="flex-1">
            <p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>
              {ks >= 700 ? "Credit Ready" : ks >= 500 ? "Building Score" : "Getting Started"}
            </p>
            <div className="rounded-full overflow-hidden mt-1" style={{ height: 6, background: "var(--bg-elevated)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (ks / 900) * 100)}%`, background: "linear-gradient(90deg, var(--brand), var(--warning))" }} />
            </div>
            {ks >= 600 && <p className="text-[10px] mt-1" style={{ color: "var(--brand)" }}>Loan eligible →</p>}
          </div>
        </div>
      </div>

      {/* Bio */}
      {user?.bio && (
        <div className="px-4 mb-4">
          <p className="text-[12px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>About</p>
          <p className="text-[11px] rounded-[14px] p-3" style={{ color: "var(--text-2)", background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>{user.bio}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4">
        <Link href="/settings" className="block w-full py-3.5 rounded-[14px] text-center text-[13px] font-bold text-white active:scale-95"
              style={{ background: "var(--brand)" }}>Edit Profile</Link>
      </div>
    </div>
  );
}
