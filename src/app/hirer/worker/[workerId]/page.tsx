"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { getSupabase } from "@/lib/supabase";
import UserAvatar from "@/components/UserAvatar";
import { ProfileSkeleton } from "@/components/Skeletons";
import { formatPrice } from "@/lib/formatters";

// ============================================================
// PUBLIC WORKER PROFILE — /hirer/worker/[workerId]
// Hero cover · Verification Badges · 4-Col Stats · Realtime Availability
// Real Pricing Table · Work Portfolio Lightbox · Reviews Breakdown · Sticky CTAs
// ============================================================

interface PricingItem {
  id: string;
  problem_type: string;
  display_name: string;
  price_min: number;
  price_max: number;
}

interface PortfolioPhoto {
  id: string;
  photo_url: string;
  caption?: string;
}

interface ReviewItem {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  tags: string[];
  avatar?: string | null;
}

interface WorkerProfileFull {
  id: string;
  name: string;
  photo?: string | null;
  trade: string;
  experience: number;
  rating: number;
  jobs_done: number;
  completion_rate: number;
  kaizy_score: number;
  verification_lvl: number;
  verified: boolean;
  aadhaar_verified: boolean;
  cert_verified: boolean;
  is_online: boolean;
  avail_days: string[];
  avail_from: string;
  avail_to: string;
  distance: number;
  min_price: number;
  pricing: PricingItem[];
  portfolio_photos: PortfolioPhoto[];
  rating_counts: Record<number, number>;
  top_tags: { tag: string; count: number }[];
  reviews: ReviewItem[];
}

const tradeColors: Record<string, string> = {
  electrician: "#FF6B00",
  plumber: "#3B82F6",
  mechanic: "#8B5CF6",
  ac_repair: "#06B6D4",
  carpenter: "#F59E0B",
  painter: "#10B981",
  mason: "#EF4444",
  locksmith: "#64748B",
};

const tradeIcons: Record<string, string> = {
  electrician: "⚡",
  plumber: "🔧",
  mechanic: "🚗",
  ac_repair: "❄️",
  carpenter: "🪚",
  painter: "🎨",
  mason: "⚒️",
  locksmith: "🔒",
};

export default function PublicWorkerProfilePage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const workerId = params?.workerId as string;

  const [worker, setWorker] = useState<WorkerProfileFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabase(), []);

  // ── 1. FETCH PROFILE DATA ──
  useEffect(() => {
    if (!workerId) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/workers/${workerId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setWorker(json.data);
          setIsOnline(Boolean(json.data.is_online));
        }
      } catch (err) {
        console.error("[fetchProfile err]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [workerId]);

  // ── 2. REALTIME AVAILABILITY SUBSCRIPTION ──
  useEffect(() => {
    if (!workerId) return;

    const channel = supabase
      .channel(`profile-online-${workerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "worker_profiles",
          filter: `id=eq.${workerId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.is_online === "boolean") {
            setIsOnline(payload.new.is_online);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId, supabase]);

  // ── SHARE HANDLER ──
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${worker?.name || "Kaizy Captain"} - Verified Professional on Kaizy`,
          text: `Check out ${worker?.name}'s verified profile and transparent pricing on Kaizy.`,
          url,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShowToast("Link copied to clipboard!");
        setTimeout(() => setShowToast(null), 3000);
      } catch {}
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="text-[36px] mb-2">👤</span>
        <h2 className="text-[18px] font-black text-white">Captain not found</h2>
        <Link
          href="/hirer/browse"
          className="mt-4 px-5 py-2.5 rounded-full bg-[#FF6B00] text-white text-[12px] font-bold"
        >
          ← Back to Browse
        </Link>
      </div>
    );
  }

  const tradeKey = worker.trade.toLowerCase();
  const tradeColor = tradeColors[tradeKey] || "#FF6B00";
  const tradeIcon = tradeIcons[tradeKey] || "⚡";
  const coverPhoto = worker.portfolio_photos?.[0]?.photo_url || null;

  // Rating bar calculations
  const totalReviews = Math.max(
    1,
    Object.values(worker.rating_counts || {}).reduce((a, b) => a + b, 0)
  );

  return (
    <div
      className="min-h-screen pb-32 select-none relative"
      style={{ background: isDark ? "var(--bg-app)" : "#F9FAFB" }}
    >
      {/* ── TOAST MESSAGE ── */}
      {showToast && (
        <div className="fixed top-4 left-4 right-4 z-50 p-3 rounded-[14px] bg-green-500 text-white text-[12px] font-black text-center shadow-xl anim-up">
          {showToast}
        </div>
      )}

      {/* ── LIGHTBOX MODAL ── */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 anim-fade"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-lg w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxPhoto}
              alt="Portfolio"
              className="w-full h-auto max-h-[80vh] object-contain rounded-[20px] shadow-2xl"
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-12 right-0 text-white text-[24px] font-bold p-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          HERO SECTION
      ══════════════════════════════ */}
      <div className="relative w-full h-[200px] overflow-hidden">
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${tradeColor}, #111111)`,
            }}
          />
        )}

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, var(--bg-app) 100%)`,
          }}
        />

        {/* Floating Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/20 active:scale-90 transition-transform"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/20 active:scale-90 transition-transform"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            📤
          </button>
        </div>
      </div>

      {/* ── AVATAR & HERO INFO (Overlaps cover) ── */}
      <div className="px-5 -mt-10 relative z-10">
        <div className="flex items-end justify-between">
          <div
            className="rounded-full p-1 shadow-2xl"
            style={{ background: "var(--bg-app)" }}
          >
            <div
              className="rounded-full overflow-hidden"
              style={{ border: `3px solid ${tradeColor}` }}
            >
              <UserAvatar name={worker.name} size={72} />
            </div>
          </div>
        </div>

        {/* Name & Trade Title */}
        <div className="mt-3">
          <h1
            className="text-[24px] font-black tracking-tight"
            style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
          >
            {worker.name}
          </h1>
          <p className="text-[14px] font-bold text-[#FF6B00] mt-0.5 capitalize">
            {tradeIcon} Senior {worker.trade.replace(/_/g, " ")} · {worker.experience}+ yrs
          </p>
        </div>

        {/* ── VERIFICATION BADGES (Horizontal Row) ── */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {worker.verification_lvl >= 1 && (
            <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-green-500/15 text-green-500 border border-green-500/30">
              ✓ ID Verified
            </span>
          )}
          {(worker.verification_lvl >= 2 || worker.aadhaar_verified) && (
            <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30">
              ✓ Aadhaar Verified
            </span>
          )}
          {worker.cert_verified && (
            <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
              ✓ ITI Certified
            </span>
          )}
          {worker.rating >= 4.5 && worker.jobs_done >= 20 && (
            <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
              ⭐ Top Rated
            </span>
          )}
        </div>
      </div>

      {/* ══════════════════════════════
          STATS ROW (4 COLUMNS)
      ══════════════════════════════ */}
      <div className="px-5 mt-5">
        <div
          className="rounded-[20px] p-4 border grid grid-cols-4 gap-2 text-center shadow-sm"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          <div>
            <p className="text-[16px] font-black text-amber-500 font-mono">
              ★ {worker.rating.toFixed(1)}
            </p>
            <p className="text-[9px] font-bold uppercase text-gray-400 mt-0.5">Rating</p>
          </div>
          <div>
            <p className="text-[16px] font-black text-blue-500 font-mono">
              {worker.jobs_done}
            </p>
            <p className="text-[9px] font-bold uppercase text-gray-400 mt-0.5">Jobs</p>
          </div>
          <div>
            <p className="text-[16px] font-black text-green-500 font-mono">
              {worker.completion_rate}%
            </p>
            <p className="text-[9px] font-bold uppercase text-gray-400 mt-0.5">Completion</p>
          </div>
          <div>
            <p className="text-[16px] font-black text-purple-500 font-mono">
              {worker.kaizy_score}
            </p>
            <p className="text-[9px] font-bold uppercase text-gray-400 mt-0.5">KaazyScore</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          AVAILABILITY INDICATOR
      ══════════════════════════════ */}
      <div className="px-5 mt-4">
        <div
          className="rounded-[16px] p-3 border flex items-center gap-2.5"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-2)" }}
        >
          <div
            className="w-3 h-3 rounded-full online-dot shrink-0"
            style={{ background: isOnline ? "#10B981" : "#F59E0B" }}
          />
          <p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>
            {isOnline
              ? "🟢 Online now · Usually responds in 5 min"
              : `🟡 Available from ${worker.avail_from || "8:00 AM"} today`}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════
          PRICING TABLE
      ══════════════════════════════ */}
      <div className="px-5 mt-6">
        <h2
          className="text-[16px] font-black mb-3"
          style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
        >
          {worker.name.split(" ")[0]}&apos;s Transparent Pricing
        </h2>

        <div
          className="rounded-[22px] border overflow-hidden shadow-sm"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {worker.pricing.map((p) => (
              <div key={p.id} className="p-3.5 flex justify-between items-center text-[13px]">
                <span className="font-bold" style={{ color: "var(--text-1)" }}>
                  {p.display_name}
                </span>
                <span className="font-black text-green-600 dark:text-green-400 font-mono">
                  {formatPrice(p.price_min)} – {formatPrice(p.price_max)}
                </span>
              </div>
            ))}

            {/* Visit charge row */}
            <div
              className="p-3.5 flex justify-between items-center text-[11px] font-bold"
              style={{ background: "var(--bg-surface)", color: "var(--text-2)" }}
            >
              <span>+ Travel Visit Charge:</span>
              <span className="font-mono">₹49 (0–3km) / ₹79 (3–7km)</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 italic mt-2 px-1 leading-relaxed">
          * Final price quoted on-site after captain inspects the work. You approve the quote before
          work starts. Pay only after job is complete.
        </p>
      </div>

      {/* ══════════════════════════════
          PORTFOLIO PHOTOS
      ══════════════════════════════ */}
      <div className="px-5 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2
            className="text-[15px] font-black"
            style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
          >
            Recent Work ({worker.portfolio_photos?.length || 0} photos)
          </h2>
        </div>

        {worker.portfolio_photos && worker.portfolio_photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {worker.portfolio_photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setLightboxPhoto(photo.photo_url)}
                className="w-full h-[160px] rounded-[18px] overflow-hidden cursor-pointer active:scale-95 transition-transform border border-white/10 relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photo_url}
                  alt={photo.caption || "Work"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-[18px] p-6 text-center border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
          >
            <span className="text-[28px] block mb-1">📸</span>
            <p className="text-[12px] font-bold text-gray-400">
              No portfolio photos uploaded yet
            </p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════
          REVIEWS & RATINGS BREAKDOWN
      ══════════════════════════════ */}
      <div className="px-5 mt-6">
        <h2
          className="text-[15px] font-black mb-3"
          style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
        >
          Customer Reviews
        </h2>

        {/* Rating Breakdown Hero */}
        <div
          className="rounded-[22px] p-5 border shadow-sm mb-4"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          <div className="flex items-center gap-5">
            <div className="text-center">
              <span
                className="text-[40px] font-black leading-none block text-[#FF6B00]"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                {worker.rating.toFixed(1)}
              </span>
              <div className="text-[12px] text-amber-400 mt-1">★★★★★</div>
              <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                {worker.jobs_done} reviews
              </span>
            </div>

            {/* 5-star Bar Chart */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = worker.rating_counts[star] || 0;
                const pct = Math.round((count / totalReviews) * 100);
                return (
                  <div key={star} className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="w-3 text-gray-400">{star}★</span>
                    <div className="flex-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FF6B00]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-7 text-right text-gray-400">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top mentioned tags */}
          {worker.top_tags && worker.top_tags.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
              {worker.top_tags.map((t) => (
                <span
                  key={t.tag}
                  className="text-[10px] font-black px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400"
                >
                  ✓ {t.tag} ({t.count})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Review Cards */}
        <div className="space-y-3">
          {worker.reviews.slice(0, 3).map((r) => (
            <div
              key={r.id}
              className="rounded-[18px] p-4 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <UserAvatar name={r.name} size={32} />
                  <div>
                    <h3 className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>
                      {r.name}
                    </h3>
                    <p className="text-[9px] text-gray-400">{r.date}</p>
                  </div>
                </div>
                <div className="text-[11px] text-amber-400 font-bold">
                  {"★".repeat(r.rating)}
                </div>
              </div>

              <p className="text-[12px] font-medium leading-relaxed" style={{ color: "var(--text-2)" }}>
                &ldquo;{r.comment}&rdquo;
              </p>

              {r.tags && r.tags.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {r.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════
          STICKY BOTTOM ACTION BAR
      ══════════════════════════════ */}
      <div
        className="fixed bottom-0 left-0 right-0 h-[76px] px-5 flex items-center justify-between border-t z-30"
        style={{
          background: isDark ? "rgba(10,10,10,0.94)" : "rgba(255,255,255,0.96)",
          backdropFilter: "blur(24px)",
          borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
        }}
      >
        <div>
          <span className="text-[10px] font-bold text-gray-400 block uppercase">Starting at</span>
          <span
            className="text-[18px] font-black text-green-600 dark:text-green-400 font-mono"
          >
            {formatPrice(worker.min_price || 249)}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/hirer/book/${worker.id}`}
            className="h-[44px] px-4 rounded-[14px] border text-[12px] font-black flex items-center justify-center active:scale-95 transition-all"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border-2)",
              color: "var(--text-1)",
            }}
          >
            Book for Later
          </Link>

          <Link
            href={`/hirer/sos?workerId=${worker.id}`}
            className="h-[48px] px-5 rounded-[14px] text-[13px] font-black text-white flex items-center justify-center active:scale-95 transition-all shadow-lg"
            style={{ background: "var(--brand)" }}
          >
            Book Now →
          </Link>
        </div>
      </div>
    </div>
  );
}
