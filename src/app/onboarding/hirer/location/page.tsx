"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useTheme } from "@/stores/ThemeStore";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

// ============================================================
// HIRER ONBOARDING — SCREEN 2: LOCATION
// Dot 2 of 3 · GPS Auto-detect · 200px map · Address autocomplete
// ============================================================

interface AddressResult {
  place_name: string;
  lat: number;
  lng: number;
}

export default function HirerLocationOnboardingPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 11.0168, lng: 76.9558 }); // Default Coimbatore
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [isDetecting, setIsDetecting] = useState(true);
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AddressResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "en", "User-Agent": "Kaizy-App/1.0" } }
      );
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  const detectLocation = useCallback(() => {
    setIsDetecting(true);
    setGpsPermissionDenied(false);

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(newCoords);
          setIsDetecting(false);
          reverseGeocode(newCoords.lat, newCoords.lng);
        },
        (err) => {
          console.warn("[GPS Error]", err.message);
          setGpsPermissionDenied(true);
          setIsDetecting(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsPermissionDenied(true);
      setIsDetecting(false);
    }
  }, [reverseGeocode]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const handleSearchAddress = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", India")}&limit=5`,
        { headers: { "Accept-Language": "en", "User-Agent": "Kaizy-App/1.0" } }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setSearchResults(
          data.map((item: { display_name: string; lat: string; lon: string }) => ({
            place_name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }))
        );
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: AddressResult) => {
    setCoords({ lat: result.lat, lng: result.lng });
    setAddress(result.place_name);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleContinue = async () => {
    const finalAddress = address.trim() || searchQuery.trim();
    if (!finalAddress) {
      setError("Please confirm your location or search your address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Save location in localStorage
      try {
        localStorage.setItem(
          "kaizy_saved_address",
          JSON.stringify({
            address: finalAddress,
            landmark: landmark.trim(),
            lat: coords.lat,
            lng: coords.lng,
          })
        );
      } catch {}

      // Save to backend database saved_locations table
      await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: "Home",
          address: finalAddress,
          landmark: landmark.trim(),
          lat: coords.lat,
          lng: coords.lng,
        }),
      });

      // Proceed to Screen 3: Ready
      router.push("/onboarding/hirer/ready");
    } catch {
      // Continue anyway
      router.push("/onboarding/hirer/ready");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between px-6 pt-10 pb-8"
      style={{ background: isDark ? "var(--bg-app)" : "#FFFFFF" }}
    >
      <div>
        {/* ── Progress: Dot 2 of 3 ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: "var(--success)" }}
            />
            <div
              className="w-8 h-2.5 rounded-full transition-all"
              style={{ background: "var(--brand)" }}
            />
            <div
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: isDark ? "var(--bg-elevated)" : "#E5E7EB" }}
            />
          </div>
          <span
            className="text-[11px] font-bold"
            style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            STEP 2 / 3
          </span>
        </div>

        {/* ── Heading ── */}
        <h1
          className="text-[24px] font-black tracking-tight mb-1.5"
          style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
        >
          Where do you usually need help?
        </h1>
        <p className="text-[12px] font-medium leading-relaxed mb-5" style={{ color: "var(--text-3)" }}>
          We use this to calculate travel time and dispatch nearest verified workers.
        </p>

        {/* ── 200px Map Section ── */}
        <div className="relative rounded-[22px] overflow-hidden mb-4 shadow-sm" style={{ height: 200, border: "1px solid var(--border-2)" }}>
          {isDetecting ? (
            <div className="w-full h-full skeleton flex items-center justify-center">
              <p className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>
                📍 Locating via GPS...
              </p>
            </div>
          ) : (
            <LiveMap
              center={coords}
              userPos={coords}
              isDark={isDark}
              className="w-full h-full"
              zoom={15}
            />
          )}

          {/* Re-detect GPS button overlay */}
          <button
            type="button"
            onClick={detectLocation}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md text-[10px] font-bold shadow-md active:scale-95 flex items-center gap-1"
            style={{ color: "var(--text-1)" }}
          >
            <span>🎯</span> Relocate
          </button>
        </div>

        <p className="text-[10px] font-semibold text-center mb-4" style={{ color: "var(--text-3)" }}>
          📍 Pin is set to your current home or service location
        </p>

        {/* ── Address Search or Detected Name ── */}
        <div className="space-y-3">
          {gpsPermissionDenied ? (
            <div className="relative">
              <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-2)" }}>
                Search Your Street or Area
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchAddress(e.target.value)}
                placeholder="e.g. Gandhipuram, RS Puram, Coimbatore..."
                className="w-full rounded-[16px] px-4 py-3.5 text-[13px] font-bold outline-none"
                style={{
                  background: isDark ? "var(--bg-lowest)" : "#F8F8F8",
                  color: "var(--text-1)",
                  border: "1.5px solid var(--border-2)",
                }}
              />
              {isSearching && (
                <div className="absolute right-4 top-9 w-3 h-3 rounded-full skeleton" />
              )}

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div
                  className="absolute left-0 right-0 top-[72px] z-30 rounded-[18px] p-2 shadow-xl border"
                  style={{
                    background: isDark ? "var(--bg-card)" : "#FFFFFF",
                    borderColor: "var(--border-2)",
                  }}
                >
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left p-2.5 rounded-[12px] text-[12px] font-medium active:scale-[0.98] transition-all truncate hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: "var(--text-1)" }}
                    >
                      📍 {item.place_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-2)" }}>
                Detected Address
              </label>
              <div
                className="rounded-[16px] p-3.5 text-[12px] font-semibold leading-relaxed"
                style={{
                  background: isDark ? "var(--bg-lowest)" : "#F8F8F8",
                  color: "var(--text-1)",
                  border: "1.5px solid var(--border-2)",
                }}
              >
                {address || "Locating..."}
              </div>
            </div>
          )}

          {/* ── Landmark Input (Optional) ── */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-2)" }}>
              Landmark / Flat / Gate (Optional)
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near blue gate, 3rd floor, opposite temple..."
              className="w-full rounded-[16px] px-4 py-3.5 text-[13px] font-medium outline-none"
              style={{
                background: isDark ? "var(--bg-lowest)" : "#F8F8F8",
                color: "var(--text-1)",
                border: "1.5px solid var(--border-2)",
              }}
            />
          </div>
        </div>

        {error && (
          <p className="text-[11px] font-bold mt-3" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </div>

      {/* ── Use This Location CTA ── */}
      <div className="pt-6">
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading || isDetecting}
          className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all shadow-md"
          style={{
            background: "var(--gradient-cta)",
            color: "#FFFFFF",
            boxShadow: "var(--shadow-brand)",
          }}
        >
          {loading ? "Saving Location..." : "Use This Location →"}
        </button>
      </div>
    </div>
  );
}
