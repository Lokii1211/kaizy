"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ============================================================
// WORKER PUBLIC PROFILE v1.0
// KaizyScore · Reviews · Services · Book CTA
// ============================================================

interface Service {
  id: string; name: string; price: number; unit: string;
}
interface Review {
  id: string; name: string; rating: number; comment: string; date: string; tags: string[];
}
interface WorkerProfile {
  id: string; name: string; trade: string; experience: number;
  rating: number; jobs_done: number; completion_rate: number;
  verified: boolean; kaizy_score: number; is_online: boolean;
  available_from: string; distance: number;
  services: Service[]; reviews: Review[]; photos: string[];
}

const tierFromScore = (ks: number, jobs: number) => {
  if (ks >= 800 && jobs >= 100) return { label: "KaizyPro", color: "#FF6B00", icon: "⚡" };
  if (ks >= 600 && jobs >= 50) return { label: "Elite", color: "#8B5CF6", icon: "👑" };
  if (ks >= 400 && jobs >= 10) return { label: "Trusted", color: "#3B82F6", icon: "✓" };
  return { label: "Active", color: "#22C55E", icon: "🟢" };
};

const tradeEmoji: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[11px]">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ color: s <= Math.round(rating) ? "#F59E0B" : "var(--border-1)" }}>★</span>
      ))}
    </span>
  );
}

function WorkerProfileContent() {
  const params = useParams();
  const workerId = params?.id as string;

  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"services" | "reviews">("services");
  const [hirerLat, setHirerLat] = useState<number | null>(null);
  const [hirerLng, setHirerLng] = useState<number | null>(null);

  // Try to get hirer location for distance
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setHirerLat(pos.coords.latitude);
        setHirerLng(pos.coords.longitude);
      }, () => {});
    }
  }, []);

  useEffect(() => {
    if (!workerId) return;
    const latParam = hirerLat ? `&lat=${hirerLat}&lng=${hirerLng}` : "";
    fetch(`/api/workers/${workerId}?${latParam}`)
      .then(r => r.json())
      .then(j => { if (j.success && j.data) setWorker(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workerId, hirerLat, hirerLng]);

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
        <div className="px-5 pt-5 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full skeleton" />
          <div className="flex-1"><div className="h-4 w-32 rounded-full skeleton mb-1" /><div className="h-3 w-20 rounded-full skeleton" /></div>
        </div>
        <div className="mx-5 h-32 rounded-[20px] skeleton mb-3" />
        <div className="mx-5 h-48 rounded-[20px] skeleton" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: "var(--bg-app)" }}>
        <p className="text-[40px] mb-3">🔍</p>
        <h1 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>Worker not found</h1>
        <Link href="/marketplace" className="mt-6 text-[12px] font-bold" style={{ color: "var(--brand)" }}>← Back to marketplace</Link>
      </div>
    );
  }

  const tier = tierFromScore(worker.kaizy_score, worker.jobs_done);
  const initials = worker.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const emoji = tradeEmoji[worker.trade?.toLowerCase()] || "🔧";

  return (
    <div className="min-h-screen pb-36" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <Link href="/marketplace" aria-label="Back" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
              style={{ background: "var(--bg-surface)" }}>
          <span className="text-[14px]">←</span>
        </Link>
        <h1 className="text-[15px] font-black" style={{ color: "var(--text-1)" }}>Worker Profile</h1>
        <div className="flex-1" />
        <div className="w-2.5 h-2.5 rounded-full online-dot" style={{ background: worker.is_online ? "var(--success)" : "var(--text-3)" }} />
        <span className="text-[9px] font-bold" style={{ color: worker.is_online ? "var(--success)" : "var(--text-3)" }}>
          {worker.is_online ? "Online" : "Offline"}
        </span>
      </div>

      {/* Hero Card */}
      <div className="mx-5 rounded-[20px] p-5 mb-4" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-black text-white shrink-0 relative"
               style={{ background: "linear-gradient(135deg, #8B5CF6, #3B82F6)" }}>
            {initials || emoji}
            {worker.verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                   style={{ background: "#22C55E", border: "2px solid var(--bg-card)" }}>✓</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>{worker.name}</h2>
              {/* Tier badge */}
              <span className="text-[8px] font-black px-2 py-0.5 rounded-full text-white"
                    style={{ background: tier.color }}>{tier.icon} {tier.label}</span>
            </div>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>
              {emoji} {worker.trade?.replace('_', ' ')} · {worker.experience}yr exp
            </p>
            {worker.distance > 0 && (
              <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--brand)" }}>
                📍 {worker.distance.toFixed(1)} km away
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Rating", value: worker.rating ? `${worker.rating.toFixed(1)} ⭐` : "New" },
            { label: "Jobs", value: String(worker.jobs_done) },
            { label: "KaizyScore", value: String(worker.kaizy_score || 0) },
          ].map(s => (
            <div key={s.label} className="rounded-[12px] p-2.5 text-center" style={{ background: "var(--bg-surface)" }}>
              <p className="text-[14px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
              <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 mb-3">
        {(["services", "reviews"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
                  className="px-5 py-2 rounded-full text-[10px] font-bold capitalize transition-all active:scale-95"
                  style={{ background: activeTab === t ? "var(--brand)" : "var(--bg-surface)", color: activeTab === t ? "#FFDBCC" : "var(--text-3)" }}>
            {t} {t === "reviews" && worker.reviews.length > 0 ? `(${worker.reviews.length})` : ""}
          </button>
        ))}
      </div>

      <div className="px-5">
        {/* Services */}
        {activeTab === "services" && (
          <div className="space-y-2">
            {worker.services.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[32px] mb-2">🔧</p>
                <p className="text-[12px] font-bold" style={{ color: "var(--text-3)" }}>Services will be listed after first job</p>
              </div>
            ) : worker.services.map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-[14px] p-3.5"
                   style={{ background: "var(--bg-card)" }}>
                <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{s.name}</p>
                <div className="text-right">
                  <p className="text-[13px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>₹{s.price}</p>
                  <p className="text-[8px]" style={{ color: "var(--text-3)" }}>{s.unit}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        {activeTab === "reviews" && (
          <div className="space-y-2.5">
            {worker.reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[32px] mb-2">⭐</p>
                <p className="text-[12px] font-bold" style={{ color: "var(--text-3)" }}>No reviews yet</p>
              </div>
            ) : worker.reviews.map(r => (
              <div key={r.id} className="rounded-[14px] p-3.5" style={{ background: "var(--bg-card)" }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{r.name}</p>
                  <div className="flex items-center gap-1.5">
                    <Stars rating={r.rating} />
                    <span className="text-[8px]" style={{ color: "var(--text-3)" }}>{r.date}</span>
                  </div>
                </div>
                {r.comment && (
                  <p className="text-[10px] font-medium mt-1" style={{ color: "var(--text-2)" }}>{r.comment}</p>
                )}
                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="text-[8px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "var(--success-tint)", color: "var(--success)" }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book Now CTA — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3 z-40"
           style={{ background: "linear-gradient(to top, var(--bg-app) 80%, transparent)" }}>
        <Link href={`/booking?workerId=${worker.id}&trade=${worker.trade}`}
              className="block w-full rounded-[16px] py-4 text-center text-[14px] font-black text-white active:scale-[0.98] transition-transform"
              style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>
          Book {worker.name.split(" ")[0]} Now →
        </Link>
        <p className="text-[9px] text-center mt-2" style={{ color: "var(--text-3)" }}>
          {worker.available_from} · Response usually within 5 min
        </p>
      </div>
    </div>
  );
}

export default function WorkerProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
      </div>
    }>
      <WorkerProfileContent />
    </Suspense>
  );
}
