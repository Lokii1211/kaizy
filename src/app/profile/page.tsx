"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// HIRER PROFILE — Edit name, phone, saved addresses
// ============================================================

interface UserData {
  id: string; name: string; phone: string; user_type: string;
  email?: string; company_name?: string;
}

export default function HirerProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => {
      if (j.success && j.data) {
        setUser(j.data);
        setName(j.data.name || "");
        setEmail(j.data.email || "");
        setCompany(j.data.company_name || "");
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update user profile
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company_name: company }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditing(false);
    } catch {} finally { setSaving(false); }
  };

  const displayName = user?.name || user?.phone?.replace("+91", "") || "User";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

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
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>My Profile</h1>
          <div className="flex-1" />
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-[12px] font-bold" style={{ color: "var(--brand)" }}>
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Success toast */}
      {saved && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-xl p-3 text-center text-[12px] font-bold text-white animate-slide-down"
             style={{ background: "var(--success)" }}>
          ✅ Profile updated successfully!
        </div>
      )}

      {/* Avatar */}
      <div className="text-center px-4 pb-5">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-[28px] font-black text-white mx-auto mb-3"
             style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>{initials}</div>
        <h2 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>{displayName}</h2>
        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{user?.phone || ""}</p>
        <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>Hirer</span>
      </div>

      {/* Profile Fields */}
      <div className="px-4 space-y-3">
        {/* Name */}
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Full Name</label>
          {editing ? (
            <input type="text" value={name} onChange={e => setName(e.target.value)}
                   className="w-full text-[14px] font-bold py-1 px-0 bg-transparent outline-none"
                   style={{ color: "var(--text-1)", borderBottom: "2px solid var(--brand)" }}
                   placeholder="Your name" />
          ) : (
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{name || "Not set"}</p>
          )}
        </div>

        {/* Phone */}
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Phone Number</label>
          <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{user?.phone || "—"}</p>
          <p className="text-[9px] mt-1" style={{ color: "var(--text-3)" }}>Phone cannot be changed</p>
        </div>

        {/* Email */}
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Email (Optional)</label>
          {editing ? (
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                   className="w-full text-[14px] font-bold py-1 px-0 bg-transparent outline-none"
                   style={{ color: "var(--text-1)", borderBottom: "2px solid var(--brand)" }}
                   placeholder="your@email.com" />
          ) : (
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{email || "Not set"}</p>
          )}
        </div>

        {/* Company */}
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Company / Business (Optional)</label>
          {editing ? (
            <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                   className="w-full text-[14px] font-bold py-1 px-0 bg-transparent outline-none"
                   style={{ color: "var(--text-1)", borderBottom: "2px solid var(--brand)" }}
                   placeholder="Your company name" />
          ) : (
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{company || "Not set"}</p>
          )}
        </div>
      </div>

      {/* Save / Cancel buttons */}
      {editing && (
        <div className="px-4 mt-5 flex gap-2">
          <button onClick={() => setEditing(false)}
                  className="flex-1 rounded-xl py-3 text-[12px] font-bold active:scale-95"
                  style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
                  className="flex-[2] rounded-xl py-3 text-[13px] font-bold text-white active:scale-95"
                  style={{ background: "var(--brand)", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "💾 Save Changes"}
          </button>
        </div>
      )}

      {/* Quick links */}
      <div className="px-4 mt-6">
        <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--text-3)", letterSpacing: 2 }}>Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: "📋", label: "My Bookings", href: "/my-bookings" },
            { icon: "❤️", label: "Saved Workers", href: "/saved-workers" },
            { icon: "🎁", label: "Refer & Earn", href: "/referral" },
            { icon: "💬", label: "KaizyBot", href: "/konnectbot" },
          ].map(a => (
            <Link key={a.label} href={a.href}
                  className="rounded-xl p-3 flex items-center gap-2 active:scale-95"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <span className="text-[16px]">{a.icon}</span>
              <span className="text-[11px] font-bold" style={{ color: "var(--text-2)" }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
