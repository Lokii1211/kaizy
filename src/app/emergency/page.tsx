"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";

const emergencies = [
  { icon: "🚗", key: "vehicle_breakdown", name: "Vehicle Breakdown", color: "#8B5CF6" },
  { icon: "🛞", key: "tyre_puncture", name: "Tyre Puncture", color: "#EC4899" },
  { icon: "💧", key: "pipe_burst", name: "Pipe Burst", color: "#3B82F6" },
  { icon: "⚡", key: "power_failure", name: "Power Failure", color: "#FF6B00" },
  { icon: "🔒", key: "lock_broken", name: "Lock Broken", color: "#F59E0B" },
  { icon: "❄️", key: "ac_emergency", name: "AC Emergency", color: "#06B6D4" },
];

export default function EmergencyPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState(0);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<{ workersNotified: number; jobId: string } | null>(null);
  const [error, setError] = useState("");

  const handleFind = async () => {
    setSearching(true);
    setError("");

    // Get real GPS location
    const getLocation = (): Promise<{ lat: number; lng: number }> =>
      new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve({ lat: 11.0168, lng: 76.9558 }) // Coimbatore fallback
          );
        } else {
          resolve({ lat: 11.0168, lng: 76.9558 });
        }
      });

    try {
      const { lat, lng } = await getLocation();
      const res = await fetch("/api/emergency/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat, lng,
          problemType: emergencies[selected].key,
          description: `EMERGENCY: ${emergencies[selected].name}`,
        }),
      });
      const json = await res.json();

      if (json.success && json.data?.workersNotified > 0) {
        setResult({ workersNotified: json.data.workersNotified, jobId: json.data.jobId });
      } else {
        setError("No workers available nearby. Please call local emergency services.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // Success state
  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 anim-pop"
             style={{ background: "var(--success)", boxShadow: "0 8px 32px rgba(52,211,153,0.3)" }}>
          <span className="text-white text-[40px]">✓</span>
        </div>
        <h1 className="text-[22px] font-black text-center" style={{ color: "var(--text-1)" }}>Help is on the way!</h1>
        <p className="text-[14px] mt-2 text-center" style={{ color: "var(--text-2)" }}>
          <span className="font-bold" style={{ color: "var(--brand)" }}>{result.workersNotified} workers</span> have been alerted
        </p>
        <p className="text-[12px] mt-1 text-center" style={{ color: "var(--text-3)" }}>
          They have 45 seconds to respond. First one wins.
        </p>
        <div className="flex gap-3 mt-8 w-full">
          <Link href="/" className="flex-1 rounded-xl py-3.5 text-center text-[13px] font-bold active:scale-95"
                style={{ background: "var(--bg-card)", color: "var(--text-1)", border: "1px solid var(--border-1)" }}>Home</Link>
          <Link href="/notifications" className="flex-1 rounded-xl py-3.5 text-center text-[13px] font-bold text-white active:scale-95"
                style={{ background: "var(--brand)" }}>Track Status →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Red hero */}
      <div className="px-4 pt-4 pb-4" style={{ background: isDark ? "#150000" : "#FFF0F0" }}>
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)" }}><span className="text-[14px]">←</span></Link>
          <span className="text-[11px] font-bold" style={{ color: "var(--text-3)" }}>📶 🔋</span>
        </div>
        <span className="inline-block rounded-full px-3 py-1 text-[10px] font-bold text-white tracking-wider mb-2"
              style={{ background: "var(--danger)" }}>🆘 EMERGENCY</span>
        <h1 className="text-[24px] font-black" style={{ color: "var(--text-1)" }}>Need Help Now?</h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>We&apos;ll alert nearest workers within 15km</p>
      </div>

      {/* Location */}
      <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl p-3"
           style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", borderLeft: "4px solid var(--danger)" }}>
        <div className="shrink-0 rounded-full online-dot" style={{ width: 10, height: 10, background: "var(--danger)" }} />
        <div className="flex-1">
          <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>Your GPS Location</p>
          <p className="text-[10px]" style={{ color: "var(--text-3)" }}>📡 Auto-detecting when you tap Find Help</p>
        </div>
      </div>

      {/* Emergency grid */}
      <div className="px-4 mt-4 flex-1">
        <p className="text-[12px] font-bold mb-2" style={{ color: "var(--text-1)" }}>What happened?</p>
        <div className="grid grid-cols-2 gap-2 stagger">
          {emergencies.map((e, i) => (
            <button key={e.key} onClick={() => setSelected(i)}
                    className="flex items-center gap-2.5 rounded-xl p-3.5 transition-all active:scale-95 text-left"
                    style={{
                      background: selected === i ? "var(--brand-tint)" : "var(--bg-card)",
                      border: selected === i ? "2px solid var(--brand)" : "2px solid transparent",
                    }}>
              <span className="text-[24px]">{e.icon}</span>
              <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{e.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 rounded-xl p-3 text-center" style={{ background: "var(--danger-tint)", border: "1px solid var(--danger)" }}>
          <p className="text-[12px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      )}

      {/* CTA */}
      <div className="px-4 pb-20 mt-3">
        <button onClick={handleFind} disabled={searching}
                className="w-full rounded-xl py-4 text-center text-[14px] font-black text-white active:scale-[0.98] transition-transform disabled:opacity-60"
                style={{ background: "var(--danger)", boxShadow: "0 8px 32px rgba(239,68,68,0.35)" }}>
          {searching ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "#fff", borderTopColor: "transparent" }} />
              Finding nearest workers...
            </span>
          ) : "🔍 Find Help Now"}
        </button>
        <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-3)" }}>
          Emergency pricing applies (1.8× normal rate)
        </p>
      </div>
    </div>
  );
}
