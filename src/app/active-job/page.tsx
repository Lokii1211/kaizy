"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SafetyCheckIn from "@/components/SafetyCheckIn";

// ============================================================
// WORKER ACTIVE JOB v11.0 — Job lifecycle from worker's POV
// Flow: accepted → en_route → arrived → in_progress → completed
// Reference: Rapido captain ride screen · Uber driver active trip
// ============================================================

type JobStatus = "accepted" | "en_route" | "arrived" | "in_progress" | "completed";

const statusFlow: { status: JobStatus; label: string; icon: string; action: string; color: string }[] = [
  { status: "accepted", label: "Job Accepted", icon: "✅", action: "I'm on my way", color: "var(--brand)" },
  { status: "en_route", label: "On the Way", icon: "🚗", action: "I've arrived", color: "var(--info)" },
  { status: "arrived", label: "At Location", icon: "📍", action: "Start Job", color: "var(--warning)" },
  { status: "in_progress", label: "Working...", icon: "🔧", action: "Job Complete", color: "var(--success)" },
  { status: "completed", label: "Job Done!", icon: "🎉", action: "", color: "var(--success)" },
];

const quickMessages = [
  "I'm on my way", "I've arrived", "5 more minutes",
  "Which floor?", "Need a spare part", "Can you open the gate?",
];

export default function ActiveJobPage() {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>("accepted");
  const [elapsed, setElapsed] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  // ─── DIAGNOSIS/QUOTE STATE (3-Stage Pricing) ───
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [diagnosisText, setDiagnosisText] = useState("");
  const [complexity, setComplexity] = useState<"simple" | "medium" | "complex">("simple");
  const [quotedAmount, setQuotedAmount] = useState(300);
  const [quoteSent, setQuoteSent] = useState(false);
  const [quoteApproved, setQuoteApproved] = useState(false);

  // Mock job data (from API in production)
  const job = {
    id: "J-4821",
    trade: "electrician",
    tradeIcon: "⚡",
    problem: "Fan not spinning — needs repair",
    hirerName: "Vinod Kumar",
    hirerPhone: "+91 98765 43210",
    hirerRating: 4.6,
    address: "42/3, Nehru Street, RS Puram, Coimbatore",
    distance: "1.8 km",
    eta: "8 min",
    amount: 600,
    commission: 12,
    netEarning: 588,
    isEmergency: false,
  };

  // Timer
  useEffect(() => {
    if (status !== "completed") {
      const interval = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const currentStep = statusFlow.findIndex(s => s.status === status);
  const nextAction = statusFlow[currentStep]?.action;

  const advanceStatus = async () => {
    const flow: JobStatus[] = ["accepted", "en_route", "arrived", "in_progress", "completed"];
    const idx = flow.indexOf(status);
    if (idx < flow.length - 1) {
      const next = flow[idx + 1];

      // If completing, show confirmation first
      if (next === "completed" && !showComplete) {
        setShowComplete(true);
        return;
      }

      // API call to update status
      try {
        await fetch("/api/bookings/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: job.id, status: next }),
        });
      } catch {}

      setStatus(next);
      setShowComplete(false);
    }
  };

  const handlePhotoUpload = () => {
    // In production: open camera for before/after photos
    setPhotos(prev => [...prev, `📸 Photo ${prev.length + 1}`]);
  };

  // ── COMPLETED STATE ──
  if (status === "completed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
           style={{ background: "var(--bg-app)" }}>
        <div className="anim-spring text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
               style={{ background: "var(--success-tint)" }}>
            <span className="text-[48px]">🎉</span>
          </div>
          <h1 className="text-[22px] font-black tracking-tight mb-2"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Job Complete!
          </h1>
          <p className="text-[12px] font-medium mb-6" style={{ color: "var(--text-3)" }}>
            Payment will be released after hirer confirms
          </p>

          {/* Earnings breakdown */}
          <div className="rounded-[20px] p-5 mb-6 text-left" style={{ background: "var(--bg-card)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
              Earnings Breakdown
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>Job earning</span>
                <span className="text-[12px] font-bold" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
                  +₹{job.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>Platform commission</span>
                <span className="text-[12px] font-bold" style={{ color: "var(--danger)", fontFamily: "'JetBrains Mono', monospace" }}>
                  -₹{job.commission}
                </span>
              </div>
              <div className="h-px" style={{ background: "var(--border-1)" }} />
              <div className="flex justify-between">
                <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>You receive</span>
                <span className="text-[16px] font-black" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
                  ₹{job.netEarning}
                </span>
              </div>
            </div>
            <p className="text-[9px] font-medium mt-2" style={{ color: "var(--text-3)" }}>
              ⚡ Payment via UPI within 15 minutes of confirmation
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/dashboard/worker"
                  className="flex-1 rounded-[16px] py-3.5 text-center text-[12px] font-bold text-white active:scale-95 transition-transform"
                  style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
              Back to Dashboard
            </Link>
            <Link href="/earnings"
                  className="rounded-[16px] py-3.5 px-5 text-center text-[12px] font-bold active:scale-95 transition-transform"
                  style={{ background: "var(--bg-card)", color: "var(--text-1)" }}>
              💰 Earnings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--bg-app)" }}>
      {/* Top bar */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
              Active Job
            </p>
            <p className="text-[11px] font-bold" style={{ color: statusFlow[currentStep]?.color, fontFamily: "'JetBrains Mono', monospace" }}>
              {job.id} · {formatTime(elapsed)}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowChat(!showChat)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: "var(--bg-surface)" }}>
              <span className="text-[14px]">💬</span>
            </button>
            <a href={`tel:${job.hirerPhone.replace(/\s/g, "")}`}
               className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
               style={{ background: "var(--success-tint)" }}>
              <span className="text-[14px]">📞</span>
            </a>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-1">
          {statusFlow.slice(0, 4).map((step, i) => (
            <div key={step.status} className="flex-1 flex items-center gap-1">
              <div className="flex-1 h-[3px] rounded-full transition-all"
                   style={{
                     background: i <= currentStep ? step.color : "var(--bg-elevated)",
                   }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {statusFlow.slice(0, 4).map((step, i) => (
            <span key={step.status} className="text-[7px] font-bold uppercase"
                  style={{ color: i <= currentStep ? step.color : "var(--text-3)" }}>
              {step.icon} {step.label.split(" ")[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Current status banner */}
      <div className="mx-5 mb-4 rounded-[18px] p-4 flex items-center gap-3"
           style={{ background: `${statusFlow[currentStep]?.color}15` }}>
        <span className="text-[28px]">{statusFlow[currentStep]?.icon}</span>
        <div className="flex-1">
          <p className="text-[14px] font-black" style={{ color: statusFlow[currentStep]?.color }}>
            {statusFlow[currentStep]?.label}
          </p>
          <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>
            {status === "accepted" && "Tap below when you start heading to the customer"}
            {status === "en_route" && `${job.distance} · ETA ${job.eta}`}
            {status === "arrived" && "Customer has been notified of your arrival"}
            {status === "in_progress" && "Mark job complete when finished"}
          </p>
        </div>
      </div>

      {/* Job details card */}
      <div className="mx-5 mb-4 rounded-[20px] p-4" style={{ background: "var(--bg-card)" }}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] shrink-0"
               style={{ background: "var(--brand-tint)" }}>
            {job.tradeIcon}
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{job.problem}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>
              {job.tradeIcon} {job.trade} · {job.isEmergency ? "🆘 Emergency" : "Regular"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[18px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{job.amount}
            </p>
          </div>
        </div>

        {/* Hirer info */}
        <div className="flex items-center gap-3 rounded-[14px] p-3" style={{ background: "var(--bg-surface)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black text-white shrink-0"
               style={{ background: "var(--gradient-cta)" }}>
            {job.hirerName.split(" ").map(w => w[0]).join("")}
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{job.hirerName}</p>
            <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
              ⭐ {job.hirerRating} rating
            </p>
          </div>
          <div className="flex gap-1.5">
            <a href={`tel:${job.hirerPhone.replace(/\s/g, "")}`}
               className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
               style={{ background: "var(--success-tint)" }}>
              <span className="text-[12px]">📞</span>
            </a>
            <button onClick={() => setShowChat(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: "var(--brand-tint)" }}>
              <span className="text-[12px]">💬</span>
            </button>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 mt-3 rounded-[14px] p-3" style={{ background: "var(--bg-surface)" }}>
          <span className="text-[14px] mt-0.5">📍</span>
          <div className="flex-1">
            <p className="text-[11px] font-medium leading-relaxed" style={{ color: "var(--text-2)" }}>
              {job.address}
            </p>
            <p className="text-[9px] font-bold mt-1" style={{ color: "var(--brand)" }}>{job.distance} away</p>
          </div>
          <a href={`https://maps.google.com/maps?daddr=${encodeURIComponent(job.address)}`}
             target="_blank" rel="noopener noreferrer"
             className="px-3 py-1.5 rounded-lg text-[9px] font-bold active:scale-95 transition-transform"
             style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
            Navigate ↗
          </a>
        </div>
      </div>

      {/* Quick messages (if chat toggle) */}
      {showChat && (
        <div className="mx-5 mb-4 anim-up">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
            Quick Message
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickMessages.map(msg => (
              <button key={msg}
                      className="px-3 py-2 rounded-full text-[10px] font-bold active:scale-95 transition-all"
                      style={{ background: "var(--bg-card)", color: "var(--text-2)" }}>
                {msg}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SAFETY CHECK-IN (Uber RideCheck inspired) ═══ */}
      <SafetyCheckIn
        bookingId={job.id}
        workerId="current-worker"
        isWorkerArrived={status === "arrived" || status === "in_progress"}
        isNightJob={new Date().getHours() >= 21 || new Date().getHours() < 6}
        onSOS={() => router.push("/emergency")}
      />

      {/* ═══ DIAGNOSIS / QUOTE FORM (3-Stage Pricing) ═══ */}
      {status === "arrived" && !quoteSent && (
        <div className="mx-5 mb-4">
          <button
            onClick={() => setShowDiagnosis(!showDiagnosis)}
            className="w-full rounded-[16px] py-3.5 text-[13px] font-bold active:scale-[0.97] transition-all"
            style={{ background: "var(--bg-card)", color: "var(--brand)", border: "1px solid var(--brand)" }}
          >
            🔍 Diagnose & Send Quote
          </button>

          {showDiagnosis && (
            <div className="mt-3 rounded-[20px] p-4 anim-up" style={{ background: "var(--bg-card)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
                What did you find?
              </p>

              {/* Diagnosis text */}
              <textarea
                value={diagnosisText}
                onChange={e => setDiagnosisText(e.target.value)}
                placeholder="e.g. Faulty wiring behind switchboard, capacitor needs replacement"
                className="w-full rounded-[12px] p-3 text-[12px] resize-none"
                style={{ background: "var(--bg-surface)", color: "var(--text-1)", border: "1px solid var(--border)", minHeight: 60 }}
                rows={2}
              />

              {/* Complexity */}
              <p className="text-[9px] font-bold uppercase tracking-widest mt-3 mb-2" style={{ color: "var(--text-3)" }}>
                Complexity
              </p>
              <div className="flex gap-2">
                {(["simple", "medium", "complex"] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      setComplexity(c);
                      setQuotedAmount(c === "simple" ? 300 : c === "medium" ? 600 : 1200);
                    }}
                    className="flex-1 rounded-[12px] py-2.5 text-[11px] font-bold transition-all"
                    style={{
                      background: complexity === c ? "var(--brand)" : "var(--bg-surface)",
                      color: complexity === c ? "#fff" : "var(--text-2)",
                    }}
                  >
                    {c === "simple" ? "⚡ Simple" : c === "medium" ? "🔧 Medium" : "⚠️ Complex"}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <p className="text-[9px] font-bold uppercase tracking-widest mt-3 mb-1" style={{ color: "var(--text-3)" }}>
                Your Quote: ₹{quotedAmount}
              </p>
              <input
                type="range"
                min={100}
                max={3000}
                step={50}
                value={quotedAmount}
                onChange={e => setQuotedAmount(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "var(--brand)" }}
              />
              <div className="flex justify-between text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
                <span>₹100</span>
                <span>₹3,000</span>
              </div>

              {/* Send Quote */}
              <button
                onClick={async () => {
                  if (!diagnosisText.trim()) return;
                  try {
                    await fetch("/api/bookings/quote", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        bookingId: job.id,
                        workerId: "current-worker",
                        diagnosis: diagnosisText,
                        complexityLevel: complexity,
                        suggestedAmount: quotedAmount,
                        estimatedDuration: complexity === "simple" ? "30 min" : complexity === "medium" ? "1-2 hours" : "2-3 hours",
                      }),
                    });
                  } catch {}
                  setQuoteSent(true);
                  setShowDiagnosis(false);
                }}
                disabled={!diagnosisText.trim()}
                className="w-full mt-3 rounded-[14px] py-3.5 text-[13px] font-bold text-white active:scale-[0.97] transition-all"
                style={{
                  background: diagnosisText.trim() ? "var(--gradient-cta)" : "var(--bg-elevated)",
                  color: diagnosisText.trim() ? "#fff" : "var(--text-3)",
                }}
              >
                📩 Send Quote ₹{quotedAmount} to Customer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quote sent — waiting for approval */}
      {quoteSent && !quoteApproved && status === "arrived" && (
        <div className="mx-5 mb-4 rounded-[16px] p-4 text-center" style={{ background: "var(--warning-tint, rgba(255,184,0,0.1))", border: "1px solid rgba(255,184,0,0.2)" }}>
          <p className="text-[14px] font-bold" style={{ color: "var(--warning, #FFB800)" }}>⏳ Quote Sent — ₹{quotedAmount}</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Waiting for customer approval...</p>
          <p className="text-[9px] mt-2" style={{ color: "var(--text-3)" }}>Diagnosis: {diagnosisText}</p>
        </div>
      )}

      {/* Job photos (in_progress) */}
      {status === "in_progress" && (
        <div className="mx-5 mb-4">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
            Job Photos (Before / After)
          </p>
          <div className="flex gap-2 flex-wrap">
            {photos.map((p, i) => (
              <div key={i} className="w-16 h-16 rounded-xl flex items-center justify-center text-[10px] font-bold"
                   style={{ background: "var(--bg-card)", color: "var(--text-3)" }}>
                {p}
              </div>
            ))}
            <button onClick={handlePhotoUpload}
                    className="w-16 h-16 rounded-xl flex flex-col items-center justify-center active:scale-95 transition-transform"
                    style={{ background: "var(--brand-tint)", border: "1px dashed var(--brand)" }}>
              <span className="text-[16px]">📷</span>
              <span className="text-[7px] font-bold" style={{ color: "var(--brand)" }}>Add</span>
            </button>
          </div>
        </div>
      )}

      {/* Earnings preview */}
      <div className="mx-5 mb-4 rounded-[16px] p-4" style={{ background: "var(--brand-tint)" }}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>
              You'll Earn
            </p>
            <p className="text-[24px] font-black mt-0.5"
               style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{job.netEarning}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
              Job: ₹{job.amount}
            </p>
            <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
              Commission: -₹{job.commission}
            </p>
          </div>
        </div>
      </div>

      {/* Job completion confirmation modal */}
      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-t-[28px] p-6 anim-up"
               style={{ background: "var(--bg-card)" }}>
            <div className="text-center mb-5">
              <span className="text-[36px] block mb-2">✅</span>
              <h2 className="text-[18px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                Mark Job as Complete?
              </h2>
              <p className="text-[11px] font-medium mt-1" style={{ color: "var(--text-3)" }}>
                {job.hirerName} will be notified and payment will be released
              </p>
            </div>

            <div className="rounded-[16px] p-4 mb-4" style={{ background: "var(--bg-surface)" }}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>Earning</span>
                <span className="text-[11px] font-bold" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
                  ₹{job.netEarning}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>Duration</span>
                <span className="text-[11px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatTime(elapsed)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowComplete(false)}
                      className="flex-1 rounded-[14px] py-3.5 text-[12px] font-bold active:scale-95 transition-transform"
                      style={{ background: "var(--bg-surface)", color: "var(--text-2)" }}>
                Not Yet
              </button>
              <button onClick={advanceStatus}
                      className="flex-1 rounded-[14px] py-3.5 text-[12px] font-bold text-white active:scale-95 transition-transform"
                      style={{ background: "var(--success)" }}>
                ✅ Yes, Job Done!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 z-40"
           style={{ background: "var(--bg-app)" }}>
        <button onClick={advanceStatus}
                className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                style={{
                  background: statusFlow[currentStep]?.color === "var(--success)" ? "var(--success)" : "var(--gradient-cta)",
                  color: "#fff",
                  boxShadow: "var(--shadow-brand)",
                }}>
          {statusFlow[currentStep]?.icon} {nextAction}
        </button>
      </div>
    </div>
  );
}
