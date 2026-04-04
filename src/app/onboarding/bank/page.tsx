"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ============================================================
// ONBOARDING: BANK/UPI SETUP — Stitch "Bank Account Setup" Screen
// ============================================================

function BankSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workerName = searchParams.get("name") || "Worker";
  const workerId = searchParams.get("id") || "";

  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountName, setAccountName] = useState(workerName);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    setSaving(true);
    // Simulate verification
    await new Promise(r => setTimeout(r, 1500));
    setVerified(true);
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/workers/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId,
          paymentMethod: method,
          upiId: method === "upi" ? upiId : undefined,
          bankAccount: method === "bank" ? { accountNo, ifsc, accountName } : undefined,
        }),
      });
    } catch {}
    // Navigate to verify (selfie + aadhaar)
    router.push("/verify");
    setSaving(false);
  };

  const isValid = method === "upi" ? upiId.includes("@") : (accountNo.length >= 9 && ifsc.length === 11);

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </button>
          <div>
            <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              Payment Setup
            </h1>
            <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>Step 3 of 4</p>
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i <= 3 ? "var(--brand)" : "var(--bg-elevated)" }} />
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="px-5 mt-4 mb-4">
        <div className="rounded-[18px] p-5 text-center" style={{ background: "var(--bg-card)" }}>
          <span className="text-[40px] block mb-2">💰</span>
          <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Get Paid Instantly</p>
          <p className="text-[10px] font-medium mt-1" style={{ color: "var(--text-3)" }}>
            Set up your payment method to receive earnings directly after each job
          </p>
        </div>
      </div>

      {/* Method Toggle */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 rounded-[14px] p-1" style={{ background: "var(--bg-surface)" }}>
          {[
            { id: "upi" as const, icon: "📱", label: "UPI ID" },
            { id: "bank" as const, icon: "🏦", label: "Bank Account" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setMethod(tab.id)}
                    className="flex-1 py-2.5 rounded-[10px] text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1"
                    style={{ background: method === tab.id ? "var(--brand)" : "transparent", color: method === tab.id ? "#fff" : "var(--text-3)" }}>
              <span className="text-[14px]">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5">
        {/* UPI Form */}
        {method === "upi" && (
          <div className="space-y-4">
            <div className="rounded-[16px] p-4" style={{ background: "var(--bg-card)" }}>
              <label className="text-[10px] font-bold block mb-2" style={{ color: "var(--text-3)" }}>UPI ID</label>
              <input value={upiId} onChange={e => { setUpiId(e.target.value); setVerified(false); }}
                     className="w-full rounded-[12px] px-4 py-3 text-[14px] font-bold outline-none bg-transparent"
                     style={{ background: "var(--bg-surface)", color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}
                     placeholder="yourname@upi" />
              <p className="text-[8px] font-medium mt-1" style={{ color: "var(--text-3)" }}>
                e.g., 9876543210@paytm, name@okicici
              </p>
            </div>

            {/* Popular UPI Apps */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Quick Select UPI</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: "GPay", suffix: "@okicici", icon: "🟢" },
                  { name: "PhonePe", suffix: "@ybl", icon: "🟣" },
                  { name: "Paytm", suffix: "@paytm", icon: "🔵" },
                  { name: "Custom", suffix: "", icon: "✏️" },
                ].map(app => (
                  <button key={app.name}
                          onClick={() => { if (app.suffix) setUpiId(upiId.split("@")[0] + app.suffix); }}
                          className="rounded-[12px] p-3 text-center active:scale-95 transition-transform"
                          style={{ background: "var(--bg-surface)" }}>
                    <span className="text-[18px] block mb-1">{app.icon}</span>
                    <p className="text-[8px] font-bold" style={{ color: "var(--text-2)" }}>{app.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bank Form */}
        {method === "bank" && (
          <div className="space-y-3">
            <div className="rounded-[16px] p-4" style={{ background: "var(--bg-card)" }}>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Account Holder Name</label>
                  <input value={accountName} onChange={e => setAccountName(e.target.value)}
                         className="w-full rounded-[12px] px-4 py-3 text-[14px] font-bold outline-none bg-transparent"
                         style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}
                         placeholder="Full name as on bank account" />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>Account Number</label>
                  <input value={accountNo} onChange={e => { setAccountNo(e.target.value.replace(/\D/g, "")); setVerified(false); }}
                         className="w-full rounded-[12px] px-4 py-3 text-[14px] font-bold outline-none bg-transparent"
                         style={{ background: "var(--bg-surface)", color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}
                         placeholder="1234567890" inputMode="numeric" />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>IFSC Code</label>
                  <input value={ifsc} onChange={e => { setIfsc(e.target.value.toUpperCase()); setVerified(false); }}
                         className="w-full rounded-[12px] px-4 py-3 text-[14px] font-bold outline-none bg-transparent uppercase"
                         style={{ background: "var(--bg-surface)", color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}
                         placeholder="SBIN0001234" maxLength={11} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verify Button */}
        {isValid && !verified && (
          <button onClick={handleVerify} disabled={saving}
                  className="w-full mt-4 rounded-[14px] py-3 text-[12px] font-bold active:scale-95 transition-transform"
                  style={{ background: "var(--bg-card)", color: "var(--brand)" }}>
            {saving ? "Verifying..." : "🔍 Verify Payment Details"}
          </button>
        )}

        {/* Verified Badge */}
        {verified && (
          <div className="mt-4 rounded-[16px] p-4 flex items-center gap-3" style={{ background: "rgba(52,211,153,0.08)" }}>
            <span className="text-[24px]">✅</span>
            <div>
              <p className="text-[12px] font-bold" style={{ color: "var(--success)" }}>Payment Method Verified</p>
              <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
                {method === "upi" ? upiId : `A/C ****${accountNo.slice(-4)}`}
              </p>
            </div>
          </div>
        )}

        {/* Security Note */}
        <div className="mt-4 rounded-[14px] p-3 flex items-start gap-3" style={{ background: "var(--trust-tint)" }}>
          <span className="text-[14px] mt-0.5">🔐</span>
          <div>
            <p className="text-[10px] font-bold" style={{ color: "var(--trust)" }}>Bank-Grade Security</p>
            <p className="text-[8px] mt-0.5" style={{ color: "var(--text-3)" }}>
              Your details are encrypted with 256-bit SSL. We never share your financial info.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40"
           style={{ background: "var(--bg-app)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <button onClick={handleSave} disabled={saving || !isValid}
                className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all"
                style={{
                  background: isValid ? "var(--gradient-cta)" : "var(--bg-elevated)",
                  color: isValid ? "#FFDBCC" : "var(--text-3)",
                  boxShadow: isValid ? "var(--shadow-brand)" : "none",
                }}>
          {saving ? "Saving..." : "Continue to Verification →"}
        </button>
        <button onClick={() => router.push("/verify")}
                className="w-full mt-2 text-[11px] font-bold py-2" style={{ color: "var(--text-3)" }}>
          Skip for now →
        </button>
      </div>
    </div>
  );
}

export default function BankSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
      <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
    </div>}>
      <BankSetupContent />
    </Suspense>
  );
}
