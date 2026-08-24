"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { getSupabase } from "@/lib/supabase";
import UserAvatar from "@/components/UserAvatar";
import LoadingShell from "@/components/LoadingShell";
import { formatPrice } from "@/lib/formatters";

// ============================================================
// HIRER REVIEW SCREEN — /hirer/review/[bookingId]
// 1s Payment Released Animation → 5-Star Spring Rating
// Adaptive Quick Tags (Positive/Negative) · 60s Voice Note · Multi-language Text
// ============================================================

const POSITIVE_TAGS = [
  "✓ On time",
  "✓ Clean work",
  "✓ Polite",
  "✓ Fair price",
  "✓ Professional",
  "✓ Thorough",
  "✓ Would hire again",
];

const NEGATIVE_TAGS = [
  "Late arrival",
  "Overcharged",
  "Incomplete work",
  "Unprofessional",
  "Wrong diagnosis",
  "Rude",
];

interface BookingReviewInfo {
  id: string;
  worker_id: string;
  total_amount: number;
  net_to_worker: number;
  worker_name: string;
  worker_trade: string;
  worker_photo?: string | null;
  job_title: string;
}

export default function HirerReviewPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<BookingReviewInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 1-second payment release splash
  const [showPaymentSplash, setShowPaymentSplash] = useState(true);

  // Review Form States
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeStarAnim, setActiveStarAnim] = useState<number | null>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const supabase = useMemo(() => getSupabase(), []);

  // ── 1. FETCH BOOKING DETAILS ──
  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*, jobs(*, users(*)), worker:worker_id(name, trade_primary, profile_photo)")
          .eq("id", bookingId)
          .single();

        if (!error && data) {
          const userObj = data.worker || data.worker_profiles?.users || {};
          setBooking({
            id: data.id,
            worker_id: data.worker_id,
            total_amount: Number(data.total_amount) || Number(data.hirer_price) || 350,
            net_to_worker: Number(data.net_to_worker) || 345,
            worker_name: userObj.name || "Suresh Kumar",
            worker_trade: userObj.trade_primary || data.jobs?.trade || "Electrician",
            worker_photo: userObj.profile_photo || null,
            job_title: data.jobs?.problem_type?.replace(/_/g, " ") || "Electrical Inspection",
          });
        }
      } catch (err) {
        console.error("[review fetch err]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, supabase]);

  // 1-second auto-transition from payment splash to review
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPaymentSplash(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // ── STAR SELECTION & SPRING ANIMATION ──
  const handleStarSelect = (star: number) => {
    setRating(star);
    setActiveStarAnim(star);
    setSelectedTags([]); // Reset tags on polarity shift
    if ("vibrate" in navigator) navigator.vibrate(30);
    setTimeout(() => setActiveStarAnim(null), 300);
  };

  // ── TAG TOGGLE ──
  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // ── VOICE RECORDING LOGIC ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      alert("Microphone permission required for voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const handleDiscardAudio = () => {
    setAudioBlobUrl(null);
    setRecordingSeconds(0);
  };

  // ── SUBMIT REVIEW ──
  const handleSubmitReview = async () => {
    if (!rating || !booking) return;

    setSubmitting(true);

    const isPositive = rating >= 4;
    const positiveTags = isPositive ? selectedTags : [];
    const negativeTags = !isPositive ? selectedTags : [];

    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          worker_id: booking.worker_id,
          rating,
          positive_tags: positiveTags,
          negative_tags: negativeTags,
          comment: comment.trim(),
          voice_url: audioBlobUrl || null,
        }),
      });

      // Navigate to Hirer home with review confirmation
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "kaizy_toast_message",
          `Review submitted. ₹${booking.net_to_worker} sent to ${booking.worker_name} ✓`
        );
      }
      router.replace("/");
    } catch {
      router.replace("/");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !booking) {
    return <LoadingShell />;
  }

  // ── 1S PAYMENT RELEASE ANIMATION SPLASH ──
  if (showPaymentSplash) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center select-none"
        style={{ background: isDark ? "var(--bg-app)" : "#0A0A0A" }}
      >
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-[40px] text-green-400 mb-4 animate-bounce">
          ✓
        </div>
        <h2 className="text-[20px] font-black text-white">
          Payment Released to {booking.worker_name}
        </h2>
        <p className="text-[13px] font-bold text-gray-400 mt-1 font-mono">
          {formatPrice(booking.net_to_worker)} transferred safely
        </p>
      </div>
    );
  }

  const isPositiveRating = rating >= 4;
  const tagsToShow = rating > 0 ? (isPositiveRating ? POSITIVE_TAGS : NEGATIVE_TAGS) : [];

  return (
    <div
      className="min-h-screen pb-28 px-5 pt-8 select-none flex flex-col justify-between"
      style={{ background: isDark ? "var(--bg-app)" : "#F9FAFB" }}
    >
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* ── HEADING & WORKER RECAP ── */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full mx-auto p-0.5 border-2 border-[#FF6B00] overflow-hidden shadow-lg">
            <UserAvatar name={booking.worker_name} size={60} />
          </div>

          <div>
            <h1
              className="text-[22px] font-black"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
            >
              How was {booking.worker_name.split(" ")[0]}&apos;s work?
            </h1>
            <p className="text-[12px] font-bold text-gray-400 capitalize mt-0.5">
              {booking.worker_trade} · {booking.job_title}
            </p>
          </div>
        </div>

        {/* ── 5-STAR RATING ROW ── */}
        <div
          className="p-5 rounded-[22px] border text-center shadow-sm"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          <div className="flex justify-center items-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoverRating || rating);
              const isAnimating = activeStarAnim === star;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarSelect(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-all"
                  style={{
                    transform: isAnimating ? "scale(1.35)" : "scale(1.0)",
                    transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  <svg
                    className="w-9 h-9"
                    viewBox="0 0 24 24"
                    fill={isFilled ? "#FF6B00" : "none"}
                    stroke={isFilled ? "#FF6B00" : isDark ? "#4B5563" : "#D1D5DB"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              );
            })}
          </div>

          <p className="text-[12px] font-bold text-gray-400 mt-2">
            {rating === 5
              ? "⭐ Excellent work!"
              : rating === 4
              ? "👍 Good job"
              : rating === 3
              ? "😐 Average service"
              : rating === 2
              ? "👎 Below expectations"
              : rating === 1
              ? "⚠️ Poor experience"
              : "Tap stars to rate"}
          </p>
        </div>

        {/* ── QUICK TAGS (MULTI-SELECT) ── */}
        {tagsToShow.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
              {isPositiveRating ? "What did they do well?" : "What could be improved?"}
            </span>

            <div className="flex flex-wrap gap-2">
              {tagsToShow.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className="px-3 py-2 rounded-[12px] text-[11px] font-black border transition-all active:scale-95"
                    style={{
                      background: isSelected ? "#FF6B00" : "var(--bg-card)",
                      borderColor: isSelected ? "#FF6B00" : "var(--border-2)",
                      color: isSelected ? "#FFFFFF" : "var(--text-1)",
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── WRITTEN REVIEW TEXTAREA ── */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
              Tell others about your experience (optional)
            </span>
            <span className="text-[10px] text-gray-400 font-mono">{comment.length}/500</span>
          </div>

          <textarea
            value={comment}
            maxLength={500}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What went well? Any specific details? Supports தமிழ் / हिन्दी / English..."
            rows={3}
            className="w-full p-3.5 rounded-[18px] text-[12px] font-medium border outline-none resize-none shadow-sm"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-2)",
              color: "var(--text-1)",
            }}
          />
        </div>

        {/* ── 60-SECOND VOICE REVIEW ── */}
        <div
          className="p-4 rounded-[18px] border flex items-center justify-between shadow-sm"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          {!audioBlobUrl && !isRecording && (
            <button
              type="button"
              onClick={startRecording}
              className="w-full py-2.5 rounded-[12px] text-[12px] font-black flex items-center justify-center gap-2 border border-dashed border-gray-400 active:scale-98"
              style={{ color: "var(--text-1)" }}
            >
              <span>🎙️</span>
              <span>Record a 60s Voice Review instead</span>
            </button>
          )}

          {isRecording && (
            <div className="w-full flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-[12px] font-black font-mono text-red-500">
                  Recording 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 1:00
                </span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-1.5 rounded-full bg-red-500 text-white text-[11px] font-black active:scale-95"
              >
                Done ✓
              </button>
            </div>
          )}

          {audioBlobUrl && !isRecording && (
            <div className="w-full flex items-center justify-between gap-3">
              <audio src={audioBlobUrl} controls className="h-8 flex-1" />
              <button
                type="button"
                onClick={handleDiscardAudio}
                className="text-red-500 text-[11px] font-bold p-1"
              >
                Delete ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── SUBMIT BUTTON ── */}
      <div className="max-w-md mx-auto w-full pt-4">
        <button
          type="button"
          onClick={handleSubmitReview}
          disabled={rating === 0 || submitting}
          className="w-full py-4 rounded-[18px] text-[14px] font-black text-white active:scale-98 disabled:opacity-40 transition-all shadow-xl flex items-center justify-center gap-2"
          style={{ background: "var(--brand)" }}
        >
          {submitting ? "Submitting Review..." : "Submit Review →"}
        </button>
      </div>
    </div>
  );
}
