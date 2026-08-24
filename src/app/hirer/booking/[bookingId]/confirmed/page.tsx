"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { getSupabase } from "@/lib/supabase";
import UserAvatar from "@/components/UserAvatar";
import LoadingShell from "@/components/LoadingShell";

// ============================================================
// HIRER BOOKING CONFIRMATION — SCREEN 4
// Booking ID · Calendar integration (.ics) · My Jobs navigation
// ============================================================

function BookingConfirmedContent() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const bookingId = params?.bookingId as string;
  const rawDate = searchParams.get("date");
  const workerName = searchParams.get("workerName") || "Kaizy Captain";
  const trade = searchParams.get("trade") || "electrician";

  const [bookingCode, setBookingCode] = useState<string>("");
  const [scheduledDateStr, setScheduledDateStr] = useState<string>("");

  useEffect(() => {
    if (bookingId) {
      setBookingCode(`KZ-${bookingId.slice(0, 8).toUpperCase()}`);
    }

    if (rawDate) {
      try {
        const d = new Date(rawDate);
        setScheduledDateStr(
          d.toLocaleDateString("en-IN", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch {
        setScheduledDateStr("Scheduled Slot");
      }
    } else {
      setScheduledDateStr("Tomorrow · 10:00 AM");
    }
  }, [bookingId, rawDate]);

  // Calendar .ics file generator & download
  const handleAddToCalendar = () => {
    const d = rawDate ? new Date(rawDate) : new Date(Date.now() + 86400000);
    const startStr = d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(d.getTime() + 60 * 60000);
    const endStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kaizy App//Scheduled Service//EN",
      "BEGIN:VEVENT",
      `SUMMARY:Kaizy Service: ${trade.toUpperCase()} with ${workerName}`,
      `DESCRIPTION:Booking ID: ${bookingCode}\\nCaptain: ${workerName}\\nTrade: ${trade}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `kaizy_booking_${bookingCode}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-6 select-none"
      style={{ background: isDark ? "var(--bg-app)" : "#FFFFFF" }}
    >
      <div>
        {/* ── SUCCESS ICON HERO ── */}
        <div className="text-center pt-8 pb-4">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-[30px] mb-3 text-white shadow-xl shadow-green-500/30"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
          >
            ✓
          </div>
          <h1
            className="text-[24px] font-black tracking-tight"
            style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
          >
            Booking Confirmed!
          </h1>
          <p className="text-[12px] font-bold text-gray-400 mt-1">
            Slot reserved with ₹49 deposit. Captain has accepted your request.
          </p>
        </div>

        {/* ── DETAILS CARD ── */}
        <div
          className="rounded-[24px] p-5 border mt-4 space-y-4 shadow-sm"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          <div className="flex items-center gap-3">
            <UserAvatar name={workerName} size={50} />
            <div>
              <h2 className="text-[14px] font-black" style={{ color: "var(--text-1)" }}>
                {workerName}
              </h2>
              <p className="text-[11px] font-bold text-[#FF6B00] capitalize">
                {trade.replace(/_/g, " ")} Captain
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                Scheduled Slot:
              </span>
              <p className="text-[14px] font-black text-blue-500 mt-0.5">
                🗓️ {scheduledDateStr}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                Booking Reference ID:
              </span>
              <p
                className="text-[14px] font-black text-gray-900 dark:text-gray-100 font-mono mt-0.5"
                style={{ letterSpacing: "1px" }}
              >
                {bookingCode || "KZ-SCHEDULED"}
              </p>
            </div>
          </div>
        </div>

        {/* ── WHAT HAPPENS NEXT ── */}
        <div
          className="rounded-[20px] p-4 border mt-4"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-2)" }}
        >
          <h3 className="text-[12px] font-black mb-2" style={{ color: "var(--text-1)" }}>
            What happens next?
          </h3>
          <ul className="text-[11px] text-gray-400 space-y-1.5 list-disc pl-4">
            <li>Your captain will receive a reminder 1 hour before the scheduled time.</li>
            <li>Live location tracking activates once the captain starts their trip.</li>
            <li>Your ₹49 deposit is deducted from the final repair invoice.</li>
          </ul>
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="space-y-3 pt-6">
        <button
          type="button"
          onClick={handleAddToCalendar}
          className="w-full py-3.5 rounded-[16px] border text-[13px] font-black active:scale-95 transition-all flex items-center justify-center gap-2"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-2)",
            color: "var(--text-1)",
          }}
        >
          <span>📅</span>
          <span>Add to Calendar (.ics)</span>
        </button>

        <Link
          href="/my-bookings"
          className="block w-full py-4 rounded-[16px] text-center text-[14px] font-black text-white active:scale-95 transition-all shadow-xl"
          style={{ background: "var(--brand)" }}
        >
          View in My Jobs →
        </Link>
      </div>
    </div>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <BookingConfirmedContent />
    </Suspense>
  );
}
