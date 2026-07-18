"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SafetyCheckIn from "@/components/SafetyCheckIn";
import { useAuth } from "@/stores/AuthStore";

// ============================================================
// WORKER ACTIVE JOB v12.0 — Real Data Integration
// Reads from sessionStorage + API polling
// Status updates POST to /api/bookings/status
// Quote uses /api/bookings/quote
// ============================================================

type JobStatus = "accepted" | "en_route" | "arrived" | "in_progress" | "completed";

interface JobData {
  id: string;
  bookingId: string;
  trade: string;
  tradeIcon: string;
  problem: string;
  hirerName: string;
  hirerPhone: string;
  hirerRating: number;
  address: string;
  distance: string;
  eta: string;
  amount: number;
  commission: number;
  netEarning: number;
  isEmergency: boolean;
  otp?: string;
}

const statusFlow: { status: JobStatus; label: string; icon: string; action: string; color: string }[] = [
  { status: "accepted", label: "Job Accepted", icon: "✅", action: "I'm on my way", color: "var(--brand)" },
  { status: "en_route", label: "On the Way", icon: "🚗", action: "I've arrived", color: "var(--info)" },
  { status: "arrived", label: "At Location", icon: "📍", action: "Start Job", color: "var(--warning)" },
  { status: "in_progress", label: "Working...", icon: "🔧", action: "Job Complete", color: "var(--success)" },
  { status: "completed", label: "Job Done!", icon: "🎉", action: "", color: "var(--success)" },
];

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", carpenter: "🪚", painter: "🎨",
  mechanic: "🚗", cleaner: "🧹", ac: "❄️", appliance: "🔌",
};

const quickMessages = [
  "I'm on my way", "I've arrived", "5 more minutes",
  "Which floor?", "Need a spare part", "Can you open the gate?",
];

export default function ActiveJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<JobStatus>("accepted");
  const [elapsed, setElapsed] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  // Data loading states
  const [job, setJob] = useState<JobData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // GPS tracking refs
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);

  // GPS loop — sends worker position to tracking API every 15s when en_route
  useEffect(() => {
    if (status !== "en_route" || !job?.bookingId) {
      clearInterval(gpsIntervalRef.current);
      return;
    }
    const sendGPS = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        fetch("/api/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            bookingId: job.bookingId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed || 0,
          }),
        }).catch(() => {});
      }, () => {}, { enableHighAccuracy: true, timeout: 8000 });
    };
    sendGPS();
    gpsIntervalRef.current = setInterval(sendGPS, 15000);
    return () => clearInterval(gpsIntervalRef.current);
  }, [status, job?.bookingId]);

  // Diagnosis/quote state
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [diagnosisText, setDiagnosisText] = useState("");
  const [complexity, setComplexity] = useState<"simple" | "medium" | "complex">("simple");
  const [quotedAmount, setQuotedAmount] = useState(300);
  const [quoteSent, setQuoteSent] = useState(false);
  const [quoteApproved] = useState(false);

  // Guard: workers only
  useEffect(() => {
    if (user !== null && user.user_type !== "worker") {
      router.replace("/dashboard/hirer");
    }
  }, [user, router]);

  // Load job data from sessionStorage + API
  useEffect(() => {
    const loadJobData = async () => {
      setDataLoading(true);

      let activeJob: { jobId?: string; bookingId?: string; trade?: string; problem?: string; pricing?: { total?: number; finalPrice?: number } } | null = null;
      let bookedWorker: { name?: string; trade?: string; rating?: number; phone?: string } | null = null;
      let bookingLocation: { address?: string; lat?: number; lng?: number } | null = null;

      // 1. Read from sessionStorage
      try {
        const storedJob = sessionStorage.getItem("kaizy_active_job");
        if (storedJob) activeJob = JSON.parse(storedJob);
      } catch {}

      try {
        const storedWorker = sessionStorage.getItem("kaizy_booked_worker");
        if (storedWorker) bookedWorker = JSON.parse(storedWorker);
      } catch {}

      try {
        const storedLocation = sessionStorage.getItem("kaizy_booking_location");
        if (storedLocation) bookingLocation = JSON.parse(storedLocation);
      } catch {}

      // 2. Fetch booking status from API
      let apiData: { id?: string; status?: string; otp?: string; hirer_id?: string; total_amount?: number; worker_id?: string } | null = null;

      try {
        const bookingId = activeJob?.bookingId || activeJob?.jobId;
        const endpoint = bookingId
          ? `/api/bookings/status?id=${bookingId}`
          : "/api/bookings/status?id=latest";

        const res = await fetch(endpoint);
        const json = await res.json();
        if (json.success && json.data) {
          apiData = json.data;
          // Sync status from API if it's a valid job status
          const validStatuses: JobStatus[] = ["accepted", "en_route", "arrived", "in_progress", "completed"];
          if (apiData?.status && validStatuses.includes(apiData.status as JobStatus)) {
            setStatus(apiData.status as JobStatus);
          }
        }
      } catch (err) {
        console.error("[active-job] API fetch error:", err);
      }

      // 3. No data at all — leave job as null for empty state
      if (!activeJob && !apiData?.id) {
        setDataLoading(false);
        return;
      }

      // 4. Build job object from combined data
      const jobId = activeJob?.bookingId || activeJob?.jobId || apiData?.id || "";
      const trade = activeJob?.trade || bookedWorker?.trade || "general";
      const amount = apiData?.total_amount || activeJob?.pricing?.total || activeJob?.pricing?.finalPrice || 0;
      const commissionRate = 0.02;
      const commission = amount >= 250 ? Math.max(5, Math.round(amount * commissionRate)) : 0;

      setJob({
        id: jobId,
        bookingId: activeJob?.bookingId || apiData?.id || jobId,
        trade,
        tradeIcon: tradeIcons[trade.toLowerCase()] || "🔧",
        problem: activeJob?.problem || "Service requested",
        hirerName: "Customer",
        hirerPhone: "",
        hirerRating: 4.5,
        address: bookingLocation?.address || "Customer location",
        distance: "Nearby",
        eta: "~10 min",
        amount,
        commission,
        netEarning: amount - commission,
        isEmergency: false,
        otp: apiData?.otp || undefined,
      });

      setDataLoading(false);
    };

    loadJobData();
  }, []);

  // Timer
  useEffect(() => {
    if (status !== "completed" && job) {
      const interval = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [status, job]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const currentStep = statusFlow.findIndex(s => s.status === status);
  const nextAction = statusFlow[currentStep]?.action;

  const advanceStatus = async () => {
    if (!job) return;
    const flow: JobStatus[] = ["accepted", "en_route", "arrived", "in_progress", "completed"];
    const idx = flow.indexOf(status);
    if (idx < flow.length - 1) {
      const next = flow[idx + 1];

      if (next === "completed" && !showComplete) { setShowComplete(true); return; }

      // OTP verification: arrived → in_progress requires hirer's OTP
      if (next === "in_progress" && job.bookingId) {
        if (!otpInput.trim()) { setOtpError("Enter the OTP from the customer"); return; }
        setOtpVerifying(true);
        try {
          const res = await fetch("/api/tracking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "verify_otp", bookingId: job.bookingId, otp: otpInput.trim() }),
          });
          const json = await res.json();
          if (!json.success) { setOtpError("Incorrect OTP. Ask customer to check theirs."); setOtpVerifying(false); return; }
          setOtpError(""); setOtpInput("");
        } catch { setOtpError("Could not verify. Try again."); setOtpVerifying(false); return; }
        setOtpVerifying(false);
      }

      setStatusUpdating(true);

      try {
        // Start tracking session when going en_route
        if (next === "en_route" && job.bookingId) {
          navigator.geolocation?.getCurrentPosition(pos => {
            fetch("/api/tracking", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "start",
                bookingId: job.bookingId,
                workerLat: pos.coords.latitude,
                workerLng: pos.coords.longitude,
              }),
            }).catch(() => {});
          }, () => {}, { enableHighAccuracy: true, timeout: 8000 });
        }

        // Mark complete in tracking API
        if (next === "completed" && job.bookingId) {
          await fetch("/api/tracking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "complete", bookingId: job.bookingId }),
          });
        }

        await fetch("/api/bookings/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_id: job.bookingId, job_id: job.id, status: next }),
        });
      } catch (err) {
        console.error("[active-job] Status update error:", err);
      }

      setStatus(next);
      setShowComplete(false);
      setStatusUpdating(false);
    }
  };

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = () => {
    photoInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotos(prev => [...prev, url]);
    // Upload to booking
    if (job?.bookingId) {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("bookingId", job.bookingId);
      formData.append("phase", status === "in_progress" ? "before" : "after");
      fetch("/api/bookings/photos", { method: "POST", body: formData }).catch(() => {});
    }
    e.target.value = "";
  };

  // Loading skeleton
  if (dataLoading) {
    return (
      <div className="min-h-screen pb-32" style={{ background: "var(--bg-app)" }}>
        <div className="px-5 pt-5 pb-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-2 w-16 rounded-full mb-1.5" style={{ background: "var(--bg-elevated)" }} />
              <div className="h-3 w-24 rounded-full" style={{ background: "var(--bg-elevated)" }} />
            </div>
            <div className="flex gap-2">
              <div className="w-9 h-9 rounded-xl" style={{ background: "var(--bg-surface)" }} />
              <div className="w-9 h-9 rounded-xl" style={{ background: "var(--bg-surface)" }} />
            </div>
          </div>
        </div>
        {/* Progress skeleton */}
        <div className="px-5 mb-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 h-[3px] rounded-full" style={{ background: "var(--bg-elevated)" }} />
            ))}
          </div>
        </div>
        {/* Status banner skeleton */}
        <div className="mx-5 mb-4 rounded-[18px] p-4" style={{ background: "var(--bg-surface)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full" style={{ background: "var(--bg-elevated)" }} />
            <div className="flex-1">
              <div className="h-3.5 w-28 rounded-full mb-1.5" style={{ background: "var(--bg-elevated)" }} />
              <div className="h-2.5 w-40 rounded-full" style={{ background: "var(--bg-elevated)" }} />
            </div>
          </div>
        </div>
        {/* Job card skeleton */}
        <div className="mx-5 mb-4 rounded-[20px] p-4" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
            <div className="flex-1">
              <div className="h-3.5 w-40 rounded-full mb-1.5" style={{ background: "var(--bg-elevated)" }} />
              <div className="h-2.5 w-28 rounded-full" style={{ background: "var(--bg-elevated)" }} />
            </div>
            <div className="h-5 w-14 rounded-full" style={{ background: "var(--bg-elevated)" }} />
          </div>
          <div className="rounded-[14px] p-3" style={{ background: "var(--bg-surface)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full" style={{ background: "var(--bg-elevated)" }} />
              <div className="flex-1">
                <div className="h-3 w-24 rounded-full mb-1" style={{ background: "var(--bg-elevated)" }} />
                <div className="h-2 w-16 rounded-full" style={{ background: "var(--bg-elevated)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state — no active job
  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
           style={{ background: "var(--bg-app)" }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
             style={{ background: "var(--bg-surface)" }}>
          <span className="text-[48px]">🔍</span>
        </div>
        <h1 className="text-[20px] font-black tracking-tight mb-2"
            style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          No Active Job
        </h1>
        <p className="text-[12px] font-medium text-center mb-6" style={{ color: "var(--text-3)" }}>
          You don't have any active jobs right now. Head back to the dashboard to find new jobs.
        </p>
        <Link href="/dashboard/worker"
              className="rounded-[16px] px-8 py-3.5 text-[13px] font-black text-white active:scale-95 transition-transform"
              style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Completed state
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
              Payment via UPI within 15 minutes of confirmation
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
              Earnings
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
              #{job.bookingId.substring(0, 8)} · {formatTime(elapsed)}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowChat(!showChat)}
                    aria-label="Open chat"
                    className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: "var(--bg-surface)" }}>
              <span className="text-[14px]">💬</span>
            </button>
            {job.hirerPhone && (
              <a href={`tel:${job.hirerPhone.replace(/\s/g, "")}`}
                 aria-label="Call customer"
                 className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                 style={{ background: "var(--success-tint)" }}>
                <span className="text-[14px]">📞</span>
              </a>
            )}
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

      {/* OTP input — worker enters OTP received verbally from hirer */}
      {status === "arrived" && (
        <div className="mx-5 mb-4 rounded-[16px] p-4" style={{ background: "var(--brand-tint)", border: "1px solid rgba(255,107,0,0.25)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
            Enter OTP from Customer to Start
          </p>
          <div className="flex gap-2">
            <input
              type="tel"
              inputMode="numeric"
              maxLength={4}
              value={otpInput}
              onChange={e => { setOtpInput(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
              placeholder="_ _ _ _"
              className="flex-1 rounded-[12px] px-4 py-3 text-[20px] font-black text-center tracking-[0.4em] outline-none"
              style={{ background: "var(--bg-card)", color: "var(--brand)", fontFamily: "'JetBrains Mono',monospace", border: otpError ? "1px solid var(--danger)" : "none" }}
            />
          </div>
          {otpError && <p className="text-[10px] font-bold mt-1.5" style={{ color: "var(--danger)" }}>{otpError}</p>}
          <p className="text-[9px] mt-2" style={{ color: "var(--text-3)" }}>Ask the customer for the 4-digit OTP shown on their screen</p>
        </div>
      )}

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
              {job.tradeIcon} {job.trade} · {job.isEmergency ? "Emergency" : "Regular"}
            </p>
          </div>
          {job.amount > 0 && (
            <div className="text-right shrink-0">
              <p className="text-[18px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
                ₹{job.amount}
              </p>
            </div>
          )}
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
              {job.hirerRating > 0 ? `Rating: ${job.hirerRating}` : "Customer"}
            </p>
          </div>
          <div className="flex gap-1.5">
            {job.hirerPhone && (
              <a href={`tel:${job.hirerPhone.replace(/\s/g, "")}`}
                 aria-label="Call customer"
                 className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                 style={{ background: "var(--success-tint)" }}>
                <span className="text-[12px]">📞</span>
              </a>
            )}
            <button onClick={() => setShowChat(true)}
                    aria-label="Open chat"
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
            {job.distance && (
              <p className="text-[9px] font-bold mt-1" style={{ color: "var(--brand)" }}>{job.distance} away</p>
            )}
          </div>
          <a href={`https://maps.google.com/maps?daddr=${encodeURIComponent(job.address)}&travelmode=driving`}
             target="_blank" rel="noopener noreferrer"
             className="px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-95 transition-transform flex items-center gap-1"
             style={{ background: "var(--brand)", color: "white" }}>
            🗺️ Go
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

      {/* Safety Check-In */}
      <SafetyCheckIn
        bookingId={job.bookingId}
        workerId={user?.id || ""}
        isWorkerArrived={status === "arrived" || status === "in_progress"}
        isNightJob={new Date().getHours() >= 21 || new Date().getHours() < 6}
        onSOS={() => router.push("/emergency")}
      />

      {/* Diagnosis / Quote Form */}
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
                    {c === "simple" ? "Simple" : c === "medium" ? "Medium" : "Complex"}
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

              {/* Send Quote — POST to /api/bookings/quote */}
              <button
                onClick={async () => {
                  if (!diagnosisText.trim()) return;
                  try {
                    await fetch("/api/bookings/quote", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        bookingId: job.bookingId,
                        workerId: user?.id || "",
                        diagnosis: diagnosisText,
                        complexityLevel: complexity,
                        suggestedAmount: quotedAmount,
                        estimatedDuration: complexity === "simple" ? "30 min" : complexity === "medium" ? "1-2 hours" : "2-3 hours",
                      }),
                    });
                  } catch (err) {
                    console.error("[quote] Error:", err);
                  }
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
                Send Quote ₹{quotedAmount} to Customer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quote sent — waiting for approval */}
      {quoteSent && !quoteApproved && status === "arrived" && (
        <div className="mx-5 mb-4 rounded-[16px] p-4 text-center" style={{ background: "var(--warning-tint, rgba(255,184,0,0.1))", border: "1px solid rgba(255,184,0,0.2)" }}>
          <p className="text-[14px] font-bold" style={{ color: "var(--warning, #FFB800)" }}>Quote Sent — ₹{quotedAmount}</p>
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
              <div key={i} className="w-16 h-16 rounded-xl overflow-hidden"
                   style={{ background: "var(--bg-card)" }}>
                <img src={p} alt={`Job photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            <button onClick={handlePhotoUpload}
                    className="w-16 h-16 rounded-xl flex flex-col items-center justify-center active:scale-95 transition-transform"
                    style={{ background: "var(--brand-tint)", border: "1px dashed var(--brand)" }}>
              <span className="text-[16px]">📷</span>
              <span className="text-[7px] font-bold" style={{ color: "var(--brand)" }}>Add</span>
            </button>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelected}
            style={{ display: "none" }}
          />
        </div>
      )}

      {/* Earnings preview */}
      {job.amount > 0 && (
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
      )}

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
                      disabled={statusUpdating}
                      className="flex-1 rounded-[14px] py-3.5 text-[12px] font-bold text-white active:scale-95 transition-transform disabled:opacity-70"
                      style={{ background: "var(--success)" }}>
                {statusUpdating ? "Updating..." : "Yes, Job Done!"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 z-40"
           style={{ background: "var(--bg-app)" }}>
        <button onClick={advanceStatus}
                disabled={statusUpdating || otpVerifying || (status === "arrived" && !otpInput.trim())}
                className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: statusFlow[currentStep]?.color === "var(--success)" ? "var(--success)" : "var(--gradient-cta)",
                  color: "#fff",
                  boxShadow: "var(--shadow-brand)",
                }}>
          {(statusUpdating || otpVerifying) ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              {otpVerifying ? "Verifying OTP…" : "Updating…"}
            </span>
          ) : status === "arrived" ? (
            <>🔓 Verify OTP &amp; Start Job</>
          ) : (
            <>{statusFlow[currentStep]?.icon} {nextAction}</>
          )}
        </button>
      </div>
    </div>
  );
}
