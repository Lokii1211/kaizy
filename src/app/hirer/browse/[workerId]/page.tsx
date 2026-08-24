"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import UserAvatar from "@/components/UserAvatar";
import { ProfileSkeleton } from "@/components/Skeletons";
import { formatPrice } from "@/lib/formatters";

interface WorkerService {
  id: string;
  name: string;
  price: number;
  unit: string;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

interface WorkerProfile {
  id: string;
  name: string;
  trade: string;
  experience: number;
  rating: number;
  jobs_done: number;
  completion_rate: number;
  verified: boolean;
  kaizy_score: number;
  is_online: boolean;
  distance: number;
  services: WorkerService[];
  reviews: Review[];
}

export default function HirerWorkerProfilePage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const workerId = params?.workerId as string;

  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workerId) return;

    const fetchWorker = async () => {
      try {
        const res = await fetch(`/api/workers/${workerId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setWorker(json.data);
        }
      } catch (err) {
        console.error("[fetchWorker err]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorker();
  }, [workerId]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="text-[36px] mb-2">👤</span>
        <h2 className="text-[18px] font-black text-white">Captain not found</h2>
        <Link href="/hirer/browse" className="mt-4 px-5 py-2.5 rounded-full bg-[#FF6B00] text-white text-[12px] font-bold">
          ← Back to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 select-none" style={{ background: isDark ? "var(--bg-app)" : "#F9FAFB" }}>
      {/* ── TOP BAR ── */}
      <div className="px-5 pt-6 pb-3 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
        <Link
          href="/hirer/browse"
          className="w-9 h-9 rounded-full flex items-center justify-center border font-bold"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          ←
        </Link>
        <span className="text-[12px] font-black tracking-wide" style={{ color: "var(--text-1)" }}>
          Captain Profile
        </span>
        <div className="w-9" />
      </div>

      {/* ── HERO PROFILE CARD ── */}
      <div className="px-5 mt-2">
        <div
          className="rounded-[24px] p-5 border text-center relative overflow-hidden shadow-sm"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          <div className="flex justify-center mb-3">
            <UserAvatar name={worker.name} size={76} />
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-[20px] font-black" style={{ color: "var(--text-1)" }}>
              {worker.name}
            </h1>
            {worker.verified && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500">
                ✓ Aadhaar Verified
              </span>
            )}
          </div>

          <p className="text-[12px] font-bold text-[#FF6B00] capitalize mt-0.5">
            {worker.trade.replace(/_/g, " ")} · {worker.experience || 4}+ yrs experience
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-[18px] font-black text-amber-500 font-mono">
                ★ {worker.rating?.toFixed(1) || "4.8"}
              </p>
              <p className="text-[9px] font-bold uppercase text-gray-400">Rating</p>
            </div>
            <div>
              <p className="text-[18px] font-black text-blue-500 font-mono">
                {worker.jobs_done || 48}
              </p>
              <p className="text-[9px] font-bold uppercase text-gray-400">Jobs Completed</p>
            </div>
            <div>
              <p className="text-[18px] font-black text-green-500 font-mono">
                {worker.kaizy_score || 780}
              </p>
              <p className="text-[9px] font-bold uppercase text-gray-400">KaazyScore</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRICING & SERVICES ── */}
      <div className="px-5 mt-5">
        <h2 className="text-[14px] font-black mb-3" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          Services & Hourly Rates
        </h2>
        <div className="space-y-2.5">
          {worker.services && worker.services.length > 0 ? (
            worker.services.map((s) => (
              <div
                key={s.id}
                className="rounded-[18px] p-4 border flex justify-between items-center"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
              >
                <div>
                  <h3 className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>
                    {s.name}
                  </h3>
                  <p className="text-[10px] font-medium text-gray-400">Estimated standard service</p>
                </div>
                <p className="text-[15px] font-black text-green-600 dark:text-green-400 font-mono">
                  {formatPrice(s.price)}
                </p>
              </div>
            ))
          ) : (
            <div
              className="rounded-[18px] p-4 border flex justify-between items-center"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
            >
              <div>
                <h3 className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>
                  General Inspection & Repair
                </h3>
                <p className="text-[10px] font-medium text-gray-400">Includes diagnosis + first 30 mins</p>
              </div>
              <p className="text-[15px] font-black text-green-600 dark:text-green-400 font-mono">
                {formatPrice(299)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── FIXED BOTTOM CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 p-5 border-t z-30"
        style={{
          background: isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
        }}
      >
        <Link
          href={`/hirer/book/${worker.id}`}
          className="block w-full py-4 rounded-[18px] text-center text-[15px] font-black text-white active:scale-98 transition-all shadow-xl"
          style={{ background: "var(--brand)" }}
        >
          Book / Schedule This Captain →
        </Link>
      </div>
    </div>
  );
}
