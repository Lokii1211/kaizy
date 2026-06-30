"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ═══════════════════════════════════════════════════════
// WORKER ONBOARDING — 6 Steps, saves everything to Supabase
// Step 1: Profile (Name)
// Step 2: Trade Selection
// Step 3: Pricing Setup (per-problem-type with market reference)
// Step 4: Availability (days + hours + radius)
// Step 5: UPI Payment Setup
// Step 6: Review + Submit
// ═══════════════════════════════════════════════════════

const TRADES = [
  { key: "electrician", icon: "⚡", name: "Electrician" },
  { key: "plumber", icon: "🔧", name: "Plumber" },
  { key: "mechanic", icon: "🚗", name: "Mechanic" },
  { key: "ac_repair", icon: "❄️", name: "AC Repair" },
  { key: "carpenter", icon: "🪚", name: "Carpenter" },
  { key: "painter", icon: "🎨", name: "Painter" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MarketPrice {
  trade: string;
  problem_type: string;
  display_name: string;
  price_min: number;
  price_max: number;
  duration_min: number;
}

interface WorkerPrice {
  trade: string;
  problem_type: string;
  display_name: string;
  price_min: string;
  price_max: string;
  market_min: number;
  market_max: number;
}

export default function WorkerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [name, setName] = useState("");

  // Step 2
  const [trade, setTrade] = useState("");
  const [experience, setExperience] = useState("");

  // Step 3
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [workerPrices, setWorkerPrices] = useState<WorkerPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Step 4
  const [availDays, setAvailDays] = useState<string[]>([...DAYS]);
  const [availFrom, setAvailFrom] = useState("08:00");
  const [availTo, setAvailTo] = useState("20:00");
  const [nightAvail, setNightAvail] = useState(false);
  const [radius, setRadius] = useState(10);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("");

  // Step 5
  const [upiId, setUpiId] = useState("");
  const [bio, setBio] = useState("");

  // ── Load market prices when trade selected ──
  useEffect(() => {
    if (!trade) return;
    setLoadingPrices(true);
    fetch(`/api/pricing/market?trade=${trade}`)
      .then(r => r.json())
      .then(data => {
        const prices: MarketPrice[] = data.data || [];
        setMarketPrices(prices);
        setWorkerPrices(
          prices.map(p => ({
            trade: p.trade,
            problem_type: p.problem_type,
            display_name: p.display_name,
            price_min: String(p.price_min),
            price_max: String(p.price_max),
            market_min: p.price_min,
            market_max: p.price_max,
          }))
        );
      })
      .catch(() => setMarketPrices([]))
      .finally(() => setLoadingPrices(false));
  }, [trade]);

  // ── Get GPS location ──
  const getLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude;
        const lo = pos.coords.longitude;
        setLat(la);
        setLng(lo);
        // Reverse geocode with Mapbox
        try {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          if (token) {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lo},${la}.json?access_token=${token}&limit=1`
            );
            const geo = await res.json();
            const place = geo.features?.[0]?.place_name;
            if (place) setLocationName(place.split(",").slice(0, 2).join(","));
          }
        } catch { /* ignore */ }
      },
      () => setError("Please enable GPS to continue"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Validate pricing ──
  const validatePricing = () => {
    for (const p of workerPrices) {
      const min = parseFloat(p.price_min);
      const max = parseFloat(p.price_max);
      const floorMin = p.market_min * 0.7;
      const ceilMax = p.market_max * 1.3;

      if (isNaN(min) || isNaN(max)) return `Set prices for ${p.display_name}`;
      if (min < floorMin) return `${p.display_name}: Min price can't be below ₹${Math.round(floorMin)}`;
      if (max > ceilMax) return `${p.display_name}: Max price can't exceed ₹${Math.round(ceilMax)}`;
      if (min > max) return `${p.display_name}: Min should be less than Max`;
    }
    return null;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register-worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          trade,
          experience: parseInt(experience) || 0,
          bio,
          upiId,
          latitude: lat,
          longitude: lng,
          serviceRadius: radius,
          availabilityDays: availDays,
          availableFrom: availFrom,
          availableTo: availTo,
          nightAvailable: nightAvail,
          pricing: workerPrices.map(p => ({
            trade: p.trade,
            problem_type: p.problem_type,
            price_min: parseFloat(p.price_min),
            price_max: parseFloat(p.price_max),
          })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStep(7); // Success
        setTimeout(() => router.push("/dashboard/worker"), 2000);
      } else {
        setError(json.error || "Failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  // ── Success screen ──
  if (step === 7) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
             style={{ background: "var(--success)", boxShadow: "0 12px 40px rgba(52,211,153,0.35)" }}>
          <span className="text-white text-[40px]">✓</span>
        </div>
        <h1 className="text-[24px] font-black text-center" style={{ color: "var(--text-1)" }}>
          Welcome to Kaizy, {name}! 🎉
        </h1>
        <p className="text-[13px] mt-2 text-center" style={{ color: "var(--text-2)" }}>
          {workerPrices.length} services priced · Ready to receive jobs
        </p>
        <div className="mt-5 w-5 h-5 border-2 rounded-full animate-spin"
             style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const totalSteps = 6;
  const inputStyle = {
    background: "var(--bg-lowest)",
    color: "var(--text-1)",
    border: "1px solid var(--border-2)",
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--brand)" }}>
          Worker Onboarding
        </p>
        <h1 className="text-[22px] font-black" style={{ color: "var(--text-1)" }}>
          {step === 1 && "Your Profile"}
          {step === 2 && "Select Trade"}
          {step === 3 && "Set Your Prices"}
          {step === 4 && "Availability"}
          {step === 5 && "Payment Setup"}
          {step === 6 && "Review & Submit"}
        </h1>

        {/* Progress */}
        <div className="flex gap-1 mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                 style={{ background: i < step ? "var(--brand)" : "var(--bg-elevated)" }} />
          ))}
        </div>
        <p className="text-[11px] mt-2" style={{ color: "var(--text-3)" }}>
          Step {step} of {totalSteps}
        </p>
      </div>

      <div className="px-5">
        {/* ═══ STEP 1: PROFILE ═══ */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-bold block mb-2" style={{ color: "var(--text-2)" }}>
                Full Name *
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-2xl px-4 py-4 text-[15px] font-semibold outline-none"
                style={inputStyle}
                placeholder="e.g. Raju Kumar"
                autoFocus
              />
            </div>

            <button
              onClick={() => { if (name.trim()) { setStep(2); setError(""); } else setError("Name is required"); }}
              disabled={!name.trim()}
              className="w-full rounded-2xl py-4 text-[14px] font-black mt-4 active:scale-[0.97] disabled:opacity-40"
              style={{ background: "var(--gradient-cta)", color: "#FFDBCC" }}
            >
              Next → Select Trade
            </button>
          </div>
        )}

        {/* ═══ STEP 2: TRADE SELECTION ═══ */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {TRADES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTrade(t.key)}
                  className="flex flex-col items-center gap-2 rounded-2xl p-5 active:scale-[0.96] transition-all"
                  style={{
                    background: trade === t.key ? "var(--brand-tint)" : "var(--bg-card)",
                    border: trade === t.key ? "2px solid var(--brand)" : "2px solid transparent",
                  }}
                >
                  <span className="text-[32px]">{t.icon}</span>
                  <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{t.name}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="text-[12px] font-bold block mb-2" style={{ color: "var(--text-2)" }}>
                Experience (years)
              </label>
              <input
                value={experience}
                onChange={e => setExperience(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-2xl px-4 py-4 text-[15px] font-semibold outline-none"
                style={inputStyle}
                placeholder="e.g. 5"
                inputMode="numeric"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                      className="flex-1 rounded-2xl py-4 text-[13px] font-bold"
                      style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
                ← Back
              </button>
              <button
                onClick={() => { if (trade) { setStep(3); setError(""); } }}
                disabled={!trade}
                className="flex-1 rounded-2xl py-4 text-[14px] font-black disabled:opacity-40"
                style={{ background: "var(--gradient-cta)", color: "#FFDBCC" }}
              >
                Next → Pricing
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: PRICING SETUP (the critical screen) ═══ */}
        {step === 3 && (
          <div className="space-y-3">
            {loadingPrices ? (
              <div className="text-center py-10">
                <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
                     style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
                <p className="text-[12px] mt-3" style={{ color: "var(--text-3)" }}>Loading market prices...</p>
              </div>
            ) : workerPrices.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[14px] font-bold" style={{ color: "var(--text-2)" }}>
                  No problem types found for {TRADES.find(t => t.key === trade)?.name}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl p-3 mb-2" style={{ background: "var(--brand-tint)" }}>
                  <p className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>
                    💡 Set YOUR prices for each job type. Hirers see these before booking.
                  </p>
                </div>

                {workerPrices.map((p, i) => (
                  <div key={p.problem_type} className="rounded-2xl p-4" style={{ background: "var(--bg-card)" }}>
                    <p className="text-[13px] font-bold mb-1" style={{ color: "var(--text-1)" }}>
                      {p.display_name}
                    </p>
                    <p className="text-[10px] mb-3" style={{ color: "var(--text-3)" }}>
                      Market rate: ₹{p.market_min} – ₹{p.market_max}
                    </p>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>MIN (₹)</label>
                        <input
                          value={p.price_min}
                          onChange={e => {
                            const updated = [...workerPrices];
                            updated[i].price_min = e.target.value;
                            setWorkerPrices(updated);
                          }}
                          className="w-full rounded-xl px-3 py-3 text-[15px] font-bold outline-none text-center"
                          style={inputStyle}
                          inputMode="numeric"
                        />
                      </div>
                      <span className="text-[16px] font-bold mt-4" style={{ color: "var(--text-3)" }}>–</span>
                      <div className="flex-1">
                        <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--text-3)" }}>MAX (₹)</label>
                        <input
                          value={p.price_max}
                          onChange={e => {
                            const updated = [...workerPrices];
                            updated[i].price_max = e.target.value;
                            setWorkerPrices(updated);
                          }}
                          className="w-full rounded-xl px-3 py-3 text-[15px] font-bold outline-none text-center"
                          style={inputStyle}
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)}
                      className="flex-1 rounded-2xl py-4 text-[13px] font-bold"
                      style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
                ← Back
              </button>
              <button
                onClick={() => {
                  const err = validatePricing();
                  if (err) { setError(err); } else { setStep(4); setError(""); }
                }}
                className="flex-1 rounded-2xl py-4 text-[14px] font-black"
                style={{ background: "var(--gradient-cta)", color: "#FFDBCC" }}
              >
                Next → Availability
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: AVAILABILITY ═══ */}
        {step === 4 && (
          <div className="space-y-4">
            {/* Days */}
            <div>
              <label className="text-[12px] font-bold block mb-2" style={{ color: "var(--text-2)" }}>
                Available Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <button
                    key={d}
                    onClick={() => setAvailDays(prev =>
                      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                    )}
                    className="rounded-xl px-4 py-2.5 text-[12px] font-bold"
                    style={{
                      background: availDays.includes(d) ? "var(--brand-tint)" : "var(--bg-card)",
                      border: availDays.includes(d) ? "1px solid var(--brand)" : "1px solid var(--border-1)",
                      color: availDays.includes(d) ? "var(--brand)" : "var(--text-2)",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[12px] font-bold block mb-2" style={{ color: "var(--text-2)" }}>From</label>
                <input type="time" value={availFrom} onChange={e => setAvailFrom(e.target.value)}
                       className="w-full rounded-2xl px-4 py-3 text-[14px] font-semibold outline-none" style={inputStyle} />
              </div>
              <div className="flex-1">
                <label className="text-[12px] font-bold block mb-2" style={{ color: "var(--text-2)" }}>To</label>
                <input type="time" value={availTo} onChange={e => setAvailTo(e.target.value)}
                       className="w-full rounded-2xl px-4 py-3 text-[14px] font-semibold outline-none" style={inputStyle} />
              </div>
            </div>

            {/* Night toggle */}
            <button
              onClick={() => setNightAvail(!nightAvail)}
              className="w-full rounded-2xl p-4 flex items-center justify-between"
              style={{ background: nightAvail ? "rgba(52,211,153,0.08)" : "var(--bg-card)", border: "1px solid var(--border-1)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-[18px]">🌙</span>
                <div>
                  <p className="text-[13px] font-bold text-left" style={{ color: "var(--text-1)" }}>Night jobs (10pm–6am)</p>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>1.5x higher rates</p>
                </div>
              </div>
              <div className="w-12 h-7 rounded-full p-0.5 transition-all"
                   style={{ background: nightAvail ? "var(--success)" : "var(--bg-elevated)" }}>
                <div className="w-6 h-6 rounded-full bg-white transition-all"
                     style={{ marginLeft: nightAvail ? "20px" : "0" }} />
              </div>
            </button>

            {/* Radius */}
            <div>
              <label className="text-[12px] font-bold block mb-2" style={{ color: "var(--text-2)" }}>
                Service Radius: {radius} km
              </label>
              <input type="range" min={3} max={25} value={radius}
                     onChange={e => setRadius(parseInt(e.target.value))}
                     className="w-full accent-[#FF6B00]" />
              <div className="flex justify-between text-[10px]" style={{ color: "var(--text-3)" }}>
                <span>3 km</span><span>25 km</span>
              </div>
            </div>

            {/* Location */}
            <button
              onClick={getLocation}
              className="w-full rounded-2xl p-4 flex items-center gap-3"
              style={{ background: lat ? "rgba(52,211,153,0.08)" : "var(--bg-card)", border: "1px solid var(--border-1)" }}
            >
              <span className="text-[20px]">{lat ? "✅" : "📍"}</span>
              <div className="text-left">
                <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>
                  {lat ? "Location Set" : "Set Your Location"}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                  {locationName || "Tap to detect GPS"}
                </p>
              </div>
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)}
                      className="flex-1 rounded-2xl py-4 text-[13px] font-bold"
                      style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
                ← Back
              </button>
              <button
                onClick={() => { setStep(5); setError(""); }}
                className="flex-1 rounded-2xl py-4 text-[14px] font-black"
                style={{ background: "var(--gradient-cta)", color: "#FFDBCC" }}
              >
                Next → Payment
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 5: UPI + BIO ═══ */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="rounded-2xl p-3" style={{ background: "var(--success-tint)" }}>
              <p className="text-[11px] font-bold" style={{ color: "var(--success)" }}>
                💰 Kaizy sends earnings directly to your UPI. No bank details needed.
              </p>
            </div>

            <div>
              <label className="text-[12px] font-bold block mb-2" style={{ color: "var(--text-2)" }}>UPI ID *</label>
              <input
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full rounded-2xl px-4 py-4 text-[15px] font-semibold outline-none"
                style={inputStyle}
                placeholder="yourname@upi"
              />
              <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>
                Format: name@paytm, name@ybl, or name@oksbi
              </p>
            </div>

            <div>
              <label className="text-[12px] font-bold block mb-2" style={{ color: "var(--text-2)" }}>
                Short Bio (helps hirers trust you)
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-2xl px-4 py-3 text-[14px] outline-none resize-none"
                style={inputStyle}
                placeholder="e.g. 8 years experience in house wiring and MCB repairs. Available for emergencies."
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(4)}
                      className="flex-1 rounded-2xl py-4 text-[13px] font-bold"
                      style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!upiId.includes("@")) { setError("Enter a valid UPI ID"); return; }
                  setStep(6); setError("");
                }}
                className="flex-1 rounded-2xl py-4 text-[14px] font-black"
                style={{ background: "var(--gradient-cta)", color: "#FFDBCC" }}
              >
                Next → Review
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 6: REVIEW + SUBMIT ═══ */}
        {step === 6 && (
          <div className="space-y-3">
            {/* Summary card */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)" }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
                Your Profile
              </p>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-3)" }}>Name</span>
                  <span className="font-bold" style={{ color: "var(--text-1)" }}>{name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-3)" }}>Trade</span>
                  <span className="font-bold" style={{ color: "var(--text-1)" }}>
                    {TRADES.find(t => t.key === trade)?.icon} {TRADES.find(t => t.key === trade)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-3)" }}>Experience</span>
                  <span className="font-bold" style={{ color: "var(--text-1)" }}>{experience || "0"} years</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-3)" }}>Services</span>
                  <span className="font-bold" style={{ color: "var(--brand)" }}>{workerPrices.length} priced</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-3)" }}>Availability</span>
                  <span className="font-bold" style={{ color: "var(--text-1)" }}>{availDays.length} days · {availFrom}–{availTo}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-3)" }}>Radius</span>
                  <span className="font-bold" style={{ color: "var(--text-1)" }}>{radius} km</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-3)" }}>UPI</span>
                  <span className="font-bold" style={{ color: "var(--success)" }}>{upiId}</span>
                </div>
              </div>
            </div>

            {/* Pricing summary */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)" }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
                Your Pricing
              </p>
              {workerPrices.map(p => (
                <div key={p.problem_type} className="flex justify-between py-2 text-[12px]"
                     style={{ borderBottom: "1px solid var(--border-1)" }}>
                  <span style={{ color: "var(--text-2)" }}>{p.display_name}</span>
                  <span className="font-bold" style={{ color: "var(--text-1)" }}>
                    ₹{p.price_min} – ₹{p.price_max}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(5)}
                      className="flex-1 rounded-2xl py-4 text-[13px] font-bold"
                      style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 rounded-2xl py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-60"
                style={{ background: "var(--success)", color: "#fff", boxShadow: "0 8px 24px rgba(52,211,153,0.3)" }}
              >
                {saving ? "Creating..." : "✓ Complete Registration"}
              </button>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mt-3 rounded-xl p-3 text-center" style={{ background: "var(--danger-tint)" }}>
            <p className="text-[12px] font-bold" style={{ color: "var(--danger)" }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
