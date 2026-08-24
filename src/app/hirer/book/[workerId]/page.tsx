"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import UserAvatar from "@/components/UserAvatar";
import { formatPrice } from "@/lib/formatters";

// ============================================================
// HIRER BOOKING — SCREEN 3: 3-STEP LATER BOOKING FORM
// Problem Spec · Schedule Time Slot Picker · ₹49 Deposit Confirmation
// ============================================================

const SUB_PROBLEMS: Record<string, string[]> = {
  electrician: [
    "Switchboard Sparking",
    "MCB Tripping",
    "Fan Installation",
    "Wiring Short Circuit",
    "Light Fitting",
    "Inverter Repair",
  ],
  plumber: [
    "Tap Leakage",
    "Pipe Burst",
    "Blocked Drain",
    "Flush Tank Repair",
    "Motor Installation",
    "Water Tank Cleaning",
  ],
  mechanic: [
    "Battery Dead / Jumpstart",
    "Brake Failure",
    "Engine Overheating",
    "Flat Tyre / Puncture",
    "Oil Change",
    "General Checkup",
  ],
  ac_repair: [
    "AC Not Cooling",
    "Gas Leakage",
    "Water Dropping",
    "Noise & Vibration",
    "Deep Cleaning",
    "PCB Repair",
  ],
  carpenter: [
    "Door Lock Repair",
    "Furniture Assembly",
    "Cupboard Hinge Fix",
    "Wooden Door Planing",
    "Bed Repair",
  ],
  painter: [
    "Touchup & Patch Work",
    "Wall Painting (1 Room)",
    "Waterproofing",
    "Exterior Paint",
    "Wood Polishing",
  ],
  mason: [
    "Tile Replacement",
    "Concrete Crack Repair",
    "Plastering",
    "Brickwork / Partition",
  ],
  locksmith: [
    "Key Broken in Lock",
    "Main Door Lockout",
    "Digital Lock Reset",
    "Padlock Jammed",
  ],
};

const TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
];

interface WorkerBasic {
  id: string;
  name: string;
  photo?: string | null;
  trade: string;
  rating: number;
  starting_price: number;
  verified: boolean;
}

export default function HirerBookWorkerPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workerId = params?.workerId as string;

  const [worker, setWorker] = useState<WorkerBasic | null>(null);
  const [loadingWorker, setLoadingWorker] = useState(true);

  // Step 1: Problem definition
  const [selectedSubProblem, setSelectedSubProblem] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceSeconds, setVoiceSeconds] = useState<number>(0);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 2: Time selection
  const [quickSlot, setQuickSlot] = useState<string>("Today ASAP");
  const [selectedDateIdx, setSelectedDateIdx] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<string>("10:00 AM");

  // Step 3: Submitting
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Generate 7 upcoming days
  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateObj: d,
      dayName: i === 0 ? "Today" : i === 1 ? "Tmrw" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      dateNum: d.getDate(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      isBusy: i === 4, // simulation demo
    };
  });

  // Fetch worker info
  useEffect(() => {
    if (!workerId) return;

    const fetchWorker = async () => {
      try {
        const res = await fetch(`/api/workers/${workerId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const w = json.data;
          setWorker({
            id: w.id,
            name: w.name,
            photo: w.photo,
            trade: w.trade || "electrician",
            rating: Number(w.rating) || 4.8,
            starting_price: Number(w.services?.[0]?.price) || 299,
            verified: Boolean(w.verified),
          });

          // Default first sub problem
          const subList = SUB_PROBLEMS[w.trade] || SUB_PROBLEMS.electrician;
          if (subList.length > 0) setSelectedSubProblem(subList[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingWorker(false);
      }
    };

    fetchWorker();
  }, [workerId]);

  // Voice note simulator
  const toggleRecording = () => {
    if (isRecording) {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      setIsRecording(false);
      setVoiceUrl("audio_sample.m4a");
    } else {
      setIsRecording(true);
      setVoiceSeconds(0);
      voiceTimerRef.current = setInterval(() => {
        setVoiceSeconds((s) => {
          if (s >= 59) {
            if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
            setIsRecording(false);
            setVoiceUrl("audio_sample.m4a");
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    }
  };

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: string[] = [];
    for (let i = 0; i < Math.min(files.length, 4 - uploadedPhotos.length); i++) {
      newPhotos.push(URL.createObjectURL(files[i]));
    }
    setUploadedPhotos((prev) => [...prev, ...newPhotos].slice(0, 4));
  };

  // Calculate scheduled datetime string
  const computeScheduledFor = (): string => {
    const now = new Date();
    if (quickSlot === "Today ASAP") {
      return new Date(now.getTime() + 15 * 60000).toISOString();
    }
    if (quickSlot === "Today evening (5pm+)") {
      const d = new Date();
      d.setHours(17, 0, 0, 0);
      return d.toISOString();
    }
    if (quickSlot === "Tomorrow morning") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d.toISOString();
    }

    // Pick time
    const targetDate = upcomingDays[selectedDateIdx].dateObj;
    const [timeStr, modifier] = selectedSlot.split(" ");
    let [hours] = timeStr.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const scheduledDate = new Date(targetDate);
    scheduledDate.setHours(hours, 0, 0, 0);
    return scheduledDate.toISOString();
  };

  // Confirm booking & reserve
  const handleReserveBooking = async () => {
    if (!worker) return;
    setSubmitting(true);

    try {
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);

      const scheduledFor = computeScheduledFor();

      const res = await fetch("/api/dispatch/later", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: worker.id,
          trade: worker.trade,
          problemType: selectedSubProblem,
          description: customDescription,
          scheduledFor,
          photos: uploadedPhotos,
          voiceNoteUrl: voiceUrl,
          address: "Gandhipuram, Coimbatore",
          lat: 11.0168,
          lng: 76.9558,
          hirerId: user?.id,
          estimatedMin: worker.starting_price,
          estimatedMax: Math.round(worker.starting_price * 1.5),
        }),
      });

      const json = await res.json();
      if (json.success && json.bookingId) {
        router.push(`/hirer/booking/${json.bookingId}/confirmed?date=${encodeURIComponent(scheduledFor)}&workerName=${encodeURIComponent(worker.name)}&trade=${encodeURIComponent(worker.trade)}`);
      } else {
        alert("Failed to confirm booking. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const tradeKey = worker?.trade || "electrician";
  const problemChips = SUB_PROBLEMS[tradeKey] || SUB_PROBLEMS.electrician;

  return (
    <div
      className="min-h-screen pb-32 select-none"
      style={{ background: isDark ? "var(--bg-app)" : "#F9FAFB" }}
    >
      {/* ── TOP HEADER ── */}
      <div className="px-5 pt-6 pb-3 flex items-center gap-3 sticky top-0 z-20 backdrop-blur-md">
        <Link
          href={`/hirer/browse/${workerId}`}
          className="w-9 h-9 rounded-full flex items-center justify-center border font-bold"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          ←
        </Link>
        <h1
          className="text-[16px] font-black tracking-tight"
          style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
        >
          Schedule Booking
        </h1>
      </div>

      {/* ── WORKER SUMMARY CARD (COMPACT) ── */}
      {worker && (
        <div className="px-5 mt-2 mb-5">
          <div
            className="rounded-[20px] p-3.5 border flex items-center gap-3 shadow-sm"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
          >
            <UserAvatar name={worker.name} size={48} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[13px] font-black truncate" style={{ color: "var(--text-1)" }}>
                  {worker.name}
                </h2>
                {worker.verified && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-[#FF6B00] capitalize">
                {worker.trade.replace(/_/g, " ")} · ★ {worker.rating.toFixed(1)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block font-bold">Standard rate</span>
              <span className="text-[13px] font-black text-green-600 dark:text-green-400 font-mono">
                {formatPrice(worker.starting_price)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1: WHAT'S THE PROBLEM? ── */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white text-[10px] font-black flex items-center justify-center">
            1
          </span>
          <h2 className="text-[14px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            What is the issue?
          </h2>
        </div>

        {/* Sub-problem chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {problemChips.map((p) => {
            const isSelected = selectedSubProblem === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedSubProblem(p)}
                className="px-3.5 py-2 rounded-full text-[11px] font-bold active:scale-95 transition-all"
                style={{
                  background: isSelected ? "var(--brand)" : "var(--bg-card)",
                  color: isSelected ? "#FFFFFF" : "var(--text-1)",
                  border: isSelected ? "none" : "1px solid var(--border-2)",
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Describe problem text */}
        <textarea
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value)}
          placeholder="Describe additional details (e.g. 2nd floor, master bedroom, model number)..."
          rows={2}
          className="w-full p-3 rounded-[16px] text-[12px] font-medium border outline-none resize-none mb-3"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-2)",
            color: "var(--text-1)",
          }}
        />

        {/* Photo Upload & Voice note row */}
        <div className="flex items-center gap-2.5">
          <label className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-[14px] border border-dashed cursor-pointer active:scale-95 transition-all">
            <span className="text-[14px]">📷</span>
            <span className="text-[11px] font-bold" style={{ color: "var(--text-2)" }}>
              {uploadedPhotos.length > 0 ? `${uploadedPhotos.length}/4 Photos added` : "Add Photos (max 4)"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={toggleRecording}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-[14px] border active:scale-95 transition-all shrink-0"
            style={{
              background: isRecording ? "rgba(239,68,68,0.1)" : "var(--bg-card)",
              borderColor: isRecording ? "#EF4444" : "var(--border-2)",
              color: isRecording ? "#EF4444" : "var(--text-1)",
            }}
          >
            <span className="text-[14px]">{isRecording ? "⏹️" : "🎤"}</span>
            <span className="text-[11px] font-bold">
              {isRecording ? `Recording 0:${voiceSeconds < 10 ? `0${voiceSeconds}` : voiceSeconds}` : voiceUrl ? "Recorded ✓" : "Voice Note"}
            </span>
          </button>
        </div>
      </div>

      {/* ── STEP 2: WHEN DO YOU NEED IT? ── */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white text-[10px] font-black flex items-center justify-center">
            2
          </span>
          <h2 className="text-[14px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            When should the captain visit?
          </h2>
        </div>

        {/* Quick chips */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {["Today ASAP", "Today evening (5pm+)", "Tomorrow morning", "Pick time"].map((q) => {
            const isSelected = quickSlot === q;
            return (
              <button
                key={q}
                type="button"
                onClick={() => setQuickSlot(q)}
                className="py-2.5 px-3 rounded-[14px] text-[11px] font-black text-left border active:scale-95 transition-all"
                style={{
                  background: isSelected ? "rgba(255,107,0,0.12)" : "var(--bg-card)",
                  borderColor: isSelected ? "#FF6B00" : "var(--border-2)",
                  color: isSelected ? "#FF6B00" : "var(--text-1)",
                }}
              >
                {q}
              </button>
            );
          })}
        </div>

        {/* Pick Time Details */}
        {quickSlot === "Pick time" && (
          <div
            className="p-4 rounded-[20px] border mt-2 space-y-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
          >
            {/* Horizontal Date Picker */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                Select Date:
              </p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {upcomingDays.map((d, i) => {
                  const isSelected = selectedDateIdx === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedDateIdx(i)}
                      className="shrink-0 w-16 py-2.5 rounded-[16px] text-center border active:scale-95 transition-all"
                      style={{
                        background: isSelected ? "var(--brand)" : "var(--bg-surface)",
                        borderColor: isSelected ? "var(--brand)" : "var(--border-2)",
                        color: isSelected ? "#FFFFFF" : "var(--text-1)",
                      }}
                    >
                      <p className="text-[9px] font-black uppercase opacity-80">{d.dayName}</p>
                      <p className="text-[16px] font-black mt-0.5">{d.dateNum}</p>
                      <p className="text-[8px] font-semibold mt-0.5 opacity-70">
                        {d.isBusy ? "Busy" : "Avail"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Grid */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                Select Time Slot:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className="py-2 px-1 text-center rounded-[12px] text-[11px] font-black border active:scale-95 transition-all"
                      style={{
                        background: isSelected ? "var(--brand)" : "var(--bg-surface)",
                        borderColor: isSelected ? "var(--brand)" : "var(--border-2)",
                        color: isSelected ? "#FFFFFF" : "var(--text-1)",
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── STEP 3: CONFIRM & RESERVE SUMMARY ── */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white text-[10px] font-black flex items-center justify-center">
            3
          </span>
          <h2 className="text-[14px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Price & Slot Reservation
          </h2>
        </div>

        <div
          className="p-4 rounded-[20px] border space-y-2.5"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          <div className="flex justify-between items-center text-[12px]">
            <span className="text-gray-400 font-medium">Selected Issue</span>
            <span className="font-extrabold" style={{ color: "var(--text-1)" }}>
              {selectedSubProblem}
            </span>
          </div>

          <div className="flex justify-between items-center text-[12px]">
            <span className="text-gray-400 font-medium">Estimated Labor</span>
            <span className="font-extrabold font-mono" style={{ color: "var(--text-1)" }}>
              ₹{worker?.starting_price || 299}–₹{Math.round((worker?.starting_price || 299) * 1.5)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[12px] pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <span className="font-black text-[#FF6B00] block">Slot Reservation Fee</span>
              <span className="text-[9px] text-gray-400">Adjusted in final job invoice</span>
            </div>
            <span className="text-[18px] font-black text-green-600 dark:text-green-400 font-mono">
              ₹49
            </span>
          </div>

          <div className="p-2.5 rounded-[12px] bg-black/5 dark:bg-white/5 text-[10px] text-gray-400 leading-relaxed">
            🛡️ <strong>Cancellation Policy:</strong> Free cancellation up to 6 hours before slot. After that, a ₹30 cancellation fee applies.
          </div>
        </div>
      </div>

      {/* ── FIXED BOTTOM RESERVATION BUTTON ── */}
      <div
        className="fixed bottom-0 left-0 right-0 p-5 border-t z-30"
        style={{
          background: isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
        }}
      >
        <button
          type="button"
          onClick={handleReserveBooking}
          disabled={submitting || !worker}
          className="w-full py-4 rounded-[18px] text-[15px] font-black text-white active:scale-98 disabled:opacity-50 transition-all shadow-xl flex items-center justify-center gap-2"
          style={{ background: "var(--brand)" }}
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 rounded-full border-white border-t-transparent animate-spin" />
              <span>Reserving Slot...</span>
            </>
          ) : (
            <>
              <span>🗓️ Pay ₹49 to Reserve Slot →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
