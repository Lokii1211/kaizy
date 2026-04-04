"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { useBooking, type NearbyWorker } from "@/stores/BookingStore";

// ============================================================
// Kaizy v10.0 — BOOKING FLOW (Stitch Digital Artisan)
// Epilogue headlines · JetBrains Mono data · Gradient CTAs
// Select → Match → Accept → Track → Chat → Pay → Review
// ============================================================

const tradeProblems: Record<string, string[]> = {
  "All": ["General Help"],
  "Electrician": ["MCB Tripping", "Fan Not Working", "Wiring Issue", "AC Points", "Short Circuit", "Inverter Install", "Other"],
  "Plumber": ["Pipe Leak", "Tap Repair", "Drainage Block", "Water Tank", "Bathroom Fitting", "Other"],
  "Mechanic": ["Car Breakdown", "Engine Issue", "Battery Dead", "Oil Change", "Brake Problem", "Other"],
  "AC Repair": ["Not Cooling", "Gas Refill", "Compressor Issue", "Noise Problem", "Installation", "Other"],
  "Puncture": ["Tyre Puncture", "Tyre Replacement", "Air Fill", "Other"],
  "Carpenter": ["Door Repair", "Shelf Install", "Furniture Repair", "Window Fix", "Other"],
  "Painter": ["Room Paint", "Touch Up", "Waterproofing", "Texture Finish", "Other"],
  "Mason": ["Wall Repair", "Tile Work", "Plastering", "Waterproofing", "Other"],
};

export default function BookingPage() {
  const {} = useTheme();
  const { state, startSearch, selectWorker, confirmBooking, sendMessage, cancelBooking, workerArrived, jobStarted, jobCompleted, confirmPayment, submitReview, resetBooking, calculatePricing } = useBooking();
  const [selectedTrade, setSelectedTrade] = useState("Electrician");
  const [selectedProblem, setSelectedProblem] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTags, setReviewTags] = useState<string[]>(["On Time", "Good Work"]);
  const chatRef = useRef<HTMLDivElement>(null);
  const [locationLabel, setLocationLabel] = useState("Detecting location...");
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [customProblem, setCustomProblem] = useState("");
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);

  const [bookingMode, setBookingMode] = useState<"instant" | "scheduled">("instant");
  const [scheduledTime, setScheduledTime] = useState("");

  // GPS reverse geocode for location label
  useEffect(() => {
    if (!navigator.geolocation) { setLocationLabel("Your location"); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocationCoords(coords);
      setLocationVerified(true);
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (token) {
        try {
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${token}&limit=1&types=locality,place,neighborhood`);
          const d = await res.json();
          if (d.features?.[0]) setLocationLabel(d.features[0].place_name?.split(',').slice(0, 2).join(',') || d.features[0].text);
        } catch { setLocationLabel("Your area"); }
      }
    }, () => setLocationLabel("Location off — enter manually"));
  }, []);

  // Mapbox geocoding search for manual address
  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 3) { setAddressResults([]); return; }
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    setAddressSearching(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=IN&limit=5&types=address,poi,locality,place,neighborhood`);
      const d = await res.json();
      setAddressResults(d.features?.map((f: { place_name: string; center: [number, number] }) => ({
        place_name: f.place_name,
        center: f.center,
      })) || []);
    } catch { setAddressResults([]); }
    setAddressSearching(false);
  };

  // Auto-scroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [state.messages.length]);

  // Generate time slots for scheduled booking
  const getTimeSlots = () => {
    const now = new Date();
    const slots: { label: string; value: string; icon: string }[] = [];
    const h = now.getHours();

    if (h < 17) slots.push({ label: "Today Evening", value: "today_evening", icon: "🌇" });
    if (h < 20) slots.push({ label: "Today Night", value: "today_night", icon: "🌙" });

    slots.push(
      { label: "Tomorrow Morning", value: "tomorrow_morning", icon: "🌅" },
      { label: "Tomorrow Afternoon", value: "tomorrow_afternoon", icon: "☀️" },
      { label: "Tomorrow Evening", value: "tomorrow_evening", icon: "🌇" },
      { label: "Day After Tomorrow", value: "day_after", icon: "📅" },
    );
    return slots;
  };

  // ── STEP 1: SELECT TRADE + PROBLEM ──
  if (state.status === "idle") {
    return (
      <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: "var(--bg-surface)" }}>
              <span className="text-[14px]">←</span>
            </Link>
            <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Book a Worker</h1>
          </div>

          {/* ═══ DUAL-TRACK MODE SELECTOR ═══ */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button onClick={() => setBookingMode("instant")}
                    className="rounded-[18px] p-4 text-left active:scale-[0.96] transition-all"
                    style={{
                      background: bookingMode === "instant" ? "var(--gradient-cta)" : "var(--bg-card)",
                      boxShadow: bookingMode === "instant" ? "var(--shadow-brand)" : "none",
                    }}>
              <span className="text-[28px] block mb-2">⚡</span>
              <p className="text-[13px] font-black" style={{ color: bookingMode === "instant" ? "#fff" : "var(--text-1)" }}>
                FastBook
              </p>
              <p className="text-[9px] font-medium mt-0.5" style={{ color: bookingMode === "instant" ? "rgba(255,255,255,0.7)" : "var(--text-3)" }}>
                Instant match • Worker in 15-30 min
              </p>
            </button>
            <button onClick={() => setBookingMode("scheduled")}
                    className="rounded-[18px] p-4 text-left active:scale-[0.96] transition-all"
                    style={{
                      background: bookingMode === "scheduled" ? "var(--bg-card)" : "var(--bg-card)",
                      border: bookingMode === "scheduled" ? "2px solid var(--brand)" : "2px solid transparent",
                    }}>
              <span className="text-[28px] block mb-2">📅</span>
              <p className="text-[13px] font-black" style={{ color: "var(--text-1)" }}>
                Schedule
              </p>
              <p className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>
                Book for later • Browse & choose worker
              </p>
            </button>
          </div>

          {/* Schedule Time Slots (only for scheduled mode) */}
          {bookingMode === "scheduled" && (
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>When do you need?</p>
              <div className="grid grid-cols-2 gap-2">
                {getTimeSlots().map(slot => (
                  <button key={slot.value} onClick={() => setScheduledTime(slot.value)}
                          className="rounded-[14px] p-3 flex items-center gap-2.5 active:scale-95 transition-all"
                          style={{
                            background: scheduledTime === slot.value ? "var(--brand-tint)" : "var(--bg-surface)",
                            border: scheduledTime === slot.value ? "2px solid var(--brand)" : "2px solid transparent",
                          }}>
                    <span className="text-[18px]">{slot.icon}</span>
                    <span className="text-[10px] font-bold" style={{ color: scheduledTime === slot.value ? "var(--brand)" : "var(--text-2)" }}>{slot.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trade selection */}
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Select Category</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
            {Object.keys(tradeProblems).filter(t => t !== "All").map(trade => (
              <button key={trade} onClick={() => { setSelectedTrade(trade); setSelectedProblem(""); }}
                      className="shrink-0 rounded-full px-4 py-2.5 text-[11px] font-bold active:scale-95 transition-all"
                      style={{
                        background: selectedTrade === trade ? "var(--brand)" : "var(--bg-surface)",
                        color: selectedTrade === trade ? "#FFDBCC" : "var(--text-2)",
                        boxShadow: selectedTrade === trade ? "var(--shadow-brand)" : "none",
                      }}>
                {trade}
              </button>
            ))}
          </div>

          {/* Problem selection */}
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>What&apos;s the problem?</p>
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {(tradeProblems[selectedTrade] || []).map(problem => (
              <button key={problem} onClick={() => { setSelectedProblem(problem); if (problem !== "Other") setCustomProblem(""); }}
                      className="rounded-[14px] p-3.5 text-left active:scale-[0.96] transition-all"
                      style={{
                        background: selectedProblem === problem ? "var(--brand-tint)" : "var(--bg-surface)",
                        boxShadow: selectedProblem === problem ? "0 0 0 2px var(--brand)" : "none",
                      }}>
                <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>
                  {problem === "Other" ? "✍️ Other" : problem}
                </p>
                {problem === "Other" && <p className="text-[8px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>Describe your issue</p>}
              </button>
            ))}
          </div>

          {/* Manual problem description */}
          {selectedProblem === "Other" && (
            <div className="mb-4">
              <textarea
                value={customProblem}
                onChange={e => setCustomProblem(e.target.value)}
                placeholder="Describe your problem in detail... (e.g., 'My geyser is leaking from the top connection')"
                className="w-full rounded-[12px] p-3 text-[12px] outline-none resize-none"
                rows={3}
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-1)",
                  border: customProblem.trim() ? "2px solid var(--brand)" : "2px solid var(--border-1)",
                }}
              />
              <p className="text-[9px] mt-1 px-1" style={{ color: "var(--text-3)" }}>
                💡 The more detail you provide, the better the worker can prepare
              </p>
            </div>
          )}

          {/* Location — Editable with Mapbox Geocoding */}
          <div className="rounded-[16px] p-4 mb-4" style={{ background: "var(--bg-card)", boxShadow: locationVerified ? "0 0 0 1.5px var(--success)" : "none" }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: locationVerified ? "var(--success)" : "var(--brand)" }}>{locationVerified ? "✅" : "📍"}</span>
              <div className="flex-1">
                <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{locationLabel}</p>
                <p className="text-[10px]" style={{ color: locationVerified ? "var(--success)" : "var(--text-3)" }}>
                  {locationVerified ? "Location verified on map ✓" : "⚠️ Enter address to verify"}
                </p>
              </div>
              <button onClick={() => setShowAddressSearch(!showAddressSearch)}
                      className="text-[11px] font-bold px-2 py-1 rounded-lg active:scale-95"
                      style={{ color: "var(--brand)", background: "var(--brand-tint)" }}>
                ✏️ {showAddressSearch ? "Close" : "Edit"}
              </button>
            </div>

            {/* Address Search Panel */}
            {showAddressSearch && (
              <div className="mt-2 space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={addressQuery}
                    onChange={(e) => { setAddressQuery(e.target.value); searchAddress(e.target.value); }}
                    placeholder="Search address... (e.g., MG Road, Coimbatore)"
                    className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-1)", border: "1px solid var(--border-1)" }}
                    autoFocus
                  />
                  {addressSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full animate-spin"
                         style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
                  )}
                </div>

                {/* Search Results */}
                {addressResults.length > 0 && (
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-1)" }}>
                    {addressResults.map((result, i) => (
                      <button key={i} onClick={() => {
                        setLocationLabel(result.place_name.split(',').slice(0, 3).join(','));
                        setLocationCoords({ lat: result.center[1], lng: result.center[0] });
                        setLocationVerified(true);
                        setShowAddressSearch(false);
                        setAddressResults([]);
                        setAddressQuery("");
                      }} className="w-full flex items-center gap-2 px-3 py-2.5 text-left active:scale-[0.98] transition-all"
                              style={{ background: "var(--bg-elevated)", borderBottom: i < addressResults.length - 1 ? "1px solid var(--border-1)" : "none" }}>
                        <span className="text-[14px]">📍</span>
                        <p className="text-[11px] font-medium flex-1" style={{ color: "var(--text-1)" }}>
                          {result.place_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {addressQuery.length >= 3 && addressResults.length === 0 && !addressSearching && (
                  <p className="text-[10px] text-center py-2" style={{ color: "var(--error)" }}>
                    ❌ Address not found on map. Try a more specific address.
                  </p>
                )}

                {/* Use GPS button */}
                <button onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                      setLocationCoords(coords);
                      setLocationVerified(true);
                      setShowAddressSearch(false);
                      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
                      if (token) {
                        try {
                          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${token}&limit=1`);
                          const d = await res.json();
                          if (d.features?.[0]) setLocationLabel(d.features[0].place_name?.split(',').slice(0, 2).join(','));
                        } catch {}
                      }
                    });
                  }
                }} className="w-full rounded-lg py-2 text-[11px] font-bold active:scale-[0.98]"
                        style={{ background: "var(--brand-tint)", color: "var(--brand)", border: "1px solid var(--brand)" }}>
                  📡 Use Current GPS Location
                </button>
              </div>
            )}
          </div>

          {/* Price estimate */}
          <div className="rounded-[16px] p-4 mb-4" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Estimated Price</p>
                <p className="text-[18px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedProblem ? "Starts from ₹150" : "Select a problem"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px]" style={{ color: "var(--text-3)" }}>Final price based on</p>
                <p className="text-[9px] font-semibold" style={{ color: "var(--text-2)" }}>work done + materials</p>
              </div>
            </div>
            {selectedProblem && (
              <p className="text-[8px] mt-1" style={{ color: "var(--text-3)" }}>
                💡 Price varies by complexity, distance, time of day & worker experience
              </p>
            )}
          </div>

          {/* Location not verified warning */}
          {!locationVerified && selectedProblem && (
            <p className="text-[10px] font-semibold mb-2 px-1" style={{ color: "var(--error)" }}>
              ⚠️ Please verify your location on the map before booking
            </p>
          )}

          {/* Find button */}
          <button
            onClick={() => {
              const problem = selectedProblem === "Other" ? (customProblem.trim() || "General Issue") : selectedProblem;
              if (problem && locationVerified) {
                // Store user location for tracking page
                try {
                  sessionStorage.setItem("kaizy_booking_location", JSON.stringify({
                    label: locationLabel,
                    lat: locationCoords?.lat,
                    lng: locationCoords?.lng,
                  }));
                } catch {}
                startSearch(selectedTrade, problem);
              }
            }}
            disabled={!selectedProblem || !locationVerified || (selectedProblem === "Other" && !customProblem.trim())}
            className="w-full rounded-[16px] py-4 text-[14px] font-black text-white active:scale-[0.97] transition-all disabled:opacity-40"
            style={{ background: selectedProblem && locationVerified ? "var(--gradient-cta)" : "var(--bg-elevated)", boxShadow: selectedProblem && locationVerified ? "var(--shadow-brand)" : "none" }}>
            {locationVerified ? "🔍 Find Workers Near Me" : "📍 Verify Location First"}
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 2: SEARCHING (Uber radar animation) ──
  if (state.status === "searching") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="relative mb-8" style={{ width: 120, height: 120 }}>
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: "var(--brand)", opacity: 0.3, animation: "ring-expand 2s ease-out infinite" }} />
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: "var(--brand)", opacity: 0.3, animation: "ring-expand 2s ease-out infinite 0.6s" }} />
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: "var(--brand)", opacity: 0.3, animation: "ring-expand 2s ease-out infinite 1.2s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center text-[28px]"
               style={{ background: "var(--brand)" }}>📍</div>
        </div>
        <p className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Finding Workers...</p>
        <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--text-3)" }}>Searching {selectedTrade}s near you for {selectedProblem}</p>
        <button onClick={cancelBooking} className="mt-6 text-[11px] font-bold px-6 py-2 rounded-full"
                style={{ background: "var(--bg-surface)", color: "var(--danger)" }}>Cancel</button>
      </div>
    );
  }

  // ── STEP 3: MATCHING (Uber worker list) ──
  if (state.status === "matching") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
        {/* Map */}
        <div className="flex-1 relative overflow-hidden" style={{ background: "var(--map-bg)", minHeight: 200 }}>
          <div className="map-road-h" style={{ top: "40%", opacity: 0.5 }} />
          <div className="map-road-v" style={{ left: "50%", opacity: 0.4 }} />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-[20px] px-4 py-[5px] text-[11px] font-bold glass"
               style={{ color: "var(--brand)", border: "1px solid var(--brand)" }}>
            {state.matchedWorkers.length} {selectedTrade}s found nearby
          </div>
          {/* Pulse center */}
          <div className="absolute" style={{ top: "45%", left: "50%", transform: "translate(-50%,-50%)" }}>
            <div className="absolute inset-0 rounded-full border-2" style={{ width: 80, height: 80, left: -40, top: -40, borderColor: "rgba(255,107,0,0.3)", animation: "ring-expand 2s ease-out infinite" }} />
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[20px]" style={{ background: "var(--brand)" }}>📍</div>
          </div>
        </div>

        {/* Bottom sheet */}
        <div className="shrink-0 p-5 anim-up" style={{ background: "var(--bg-app)" }}>
          <p className="text-[15px] font-black tracking-tight mb-1" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>{state.matchedWorkers.length} workers found</p>
          <p className="text-[10px] mb-3 font-medium" style={{ color: "var(--text-3)" }}>Select one or we&apos;ll auto-assign the best match</p>

          <div className="flex flex-col gap-2 mb-3 max-h-[240px] overflow-y-auto">
            {state.matchedWorkers.map((w, i) => {
              const pricing = calculatePricing(w.price, w.dist, "normal");
              return (
                <button key={w.id} onClick={() => selectWorker(w)}
                        className="flex items-center gap-3 rounded-[14px] p-3 text-left active:scale-[0.98] transition-all"
                        style={{
                          background: state.selectedWorker?.id === w.id ? "var(--brand-tint)" : "var(--bg-card)",
                          border: state.selectedWorker?.id === w.id ? "2px solid var(--brand)" : "2px solid transparent",
                        }}>
                  <div className="rounded-full flex items-center justify-center text-[16px] font-black text-white shrink-0"
                       style={{ width: 44, height: 44, background: w.color }}>{w.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>
                      {w.name} <span style={{ color: "var(--warning)" }}>⭐{w.rating}</span>
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                      {w.tradeIcon} {w.trade} · {w.experience} · {w.verified ? "Verified ✓" : ""} · KS {w.KaizyScore}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-black" style={{ color: "var(--success)" }}>{w.eta} min</p>
                    <p className="text-[9px]" style={{ color: "var(--text-3)" }}>starts from</p>
                    <p className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>₹{pricing.base}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pricing breakdown */}
          {state.pricing && (
            <div className="rounded-[12px] p-3 mb-3 animate-scale-in" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <p className="text-[10px] font-bold mb-2" style={{ color: "var(--text-3)" }}>PRICE ESTIMATE (starts from)</p>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span style={{ color: "var(--text-2)" }}>Base inspection fee</span><span style={{ color: "var(--text-1)" }} className="font-bold">₹{state.pricing.base}</span></div>
                {state.pricing.distanceFee > 0 && <div className="flex justify-between"><span style={{ color: "var(--text-2)" }}>Visit charge ({state.selectedWorker?.dist}km)</span><span style={{ color: "var(--text-2)" }} className="font-bold">+₹{state.pricing.distanceFee}</span></div>}
                <div className="border-t pt-1 mt-1 flex justify-between" style={{ borderColor: "var(--border-1)" }}>
                  <span className="font-extrabold" style={{ color: "var(--text-1)" }}>Starts from</span>
                  <span className="text-[14px] font-black" style={{ color: "var(--brand)" }}>₹{state.pricing.grandTotal}</span>
                </div>
                <p className="text-[8px] mt-1" style={{ color: "var(--text-3)" }}>
                  💡 Final price after worker inspects. Includes labour + materials used.
                </p>
              </div>
            </div>
          )}

          <button onClick={confirmBooking} disabled={!state.selectedWorker}
                  className="w-full rounded-[16px] py-4 text-[14px] font-black text-white active:scale-[0.97] transition-all disabled:opacity-40 mb-16"
                  style={{ background: state.selectedWorker ? "var(--gradient-cta)" : "var(--bg-elevated)", boxShadow: state.selectedWorker ? "var(--shadow-brand)" : "none" }}>
            {state.selectedWorker ? `Book ${state.selectedWorker.name} — from ₹${state.pricing?.base}` : "Select a worker"}
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 4: MATCHED / ACCEPTED / EN_ROUTE / ARRIVED / WORKING ──
  if (["matched", "accepted", "en_route", "arrived", "working"].includes(state.status)) {
    const stageMap: Record<string, number> = { matched: 0, accepted: 1, en_route: 1, arrived: 2, working: 3 };
    const stageIdx = stageMap[state.status] ?? 0;
    const stages = ["Booked", "En Route", "Arrived", "Working", "Done"];
    const w = state.selectedWorker;

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
        {/* Map */}
        <div className="relative overflow-hidden" style={{ background: "var(--map-bg)", height: 220 }}>
          <div className="map-road-h" style={{ top: "50%", opacity: 0.5 }} />
          <div className="map-road-v" style={{ left: "50%", opacity: 0.4 }} />
          <div className="absolute rounded-sm" style={{ top: "50%", left: "15%", right: "30%", height: 3, background: "linear-gradient(90deg, var(--brand), var(--warning))" }} />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-[20px] px-4 py-[5px] text-[11px] font-bold glass"
               style={{ color: "var(--brand)", border: "1px solid var(--brand)" }}>
            {state.status === "arrived" ? "Worker has arrived!" : state.status === "working" ? "Job in progress..." : `${w?.name} · ${state.eta > 0 ? `${state.eta} min away` : "Almost there!"}`}
          </div>
          {state.status === "en_route" && (
            <div className="absolute flex items-center justify-center"
                 style={{ width: 42, height: 42, background: "var(--brand)", top: "42%", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", animation: "wpin-move 4s ease-in-out infinite alternate" }}>
              <span style={{ transform: "rotate(45deg)", fontSize: 18 }}>{w?.tradeIcon}</span>
            </div>
          )}
          <div className="absolute rounded-full flex items-center justify-center text-[16px]"
               style={{ width: 36, height: 36, background: "var(--success)", top: "28%", right: "20%" }}>📍</div>
          <button className="absolute bottom-3 right-3 z-10 rounded-[10px] px-3 py-2 text-[10px] font-bold"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--danger)", color: "var(--danger)" }}>🛡️ Safety</button>
        </div>

        {/* Info sheet */}
        <div className="flex-1 p-4 overflow-y-auto" style={{ borderTop: "1px solid var(--border-1)" }}>
          {/* ETA + Progress */}
          <div className="flex items-center gap-3 mb-4">
            <div>
              <p className="text-[36px] font-black leading-none" style={{ color: "var(--brand)", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>
                {state.status === "working" ? "⚙️" : state.eta}
              </p>
              <p className="text-[10px] font-semibold" style={{ color: "var(--text-3)" }}>
                {state.status === "working" ? "IN PROGRESS" : "MINUTES"}
              </p>
            </div>
            <div className="flex-1">
              <div className="rounded-sm overflow-hidden mb-[6px]" style={{ background: "var(--bg-elevated)", height: 5 }}>
                <div className="h-full rounded-sm transition-all" style={{ width: `${(stageIdx / 4) * 100}%`, background: "var(--brand)" }} />
              </div>
              <div className="flex justify-between">
                {stages.map((s, i) => (
                  <span key={s} className="text-[7px] font-bold" style={{ color: i <= stageIdx ? "var(--brand)" : "var(--text-3)" }}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* OTP */}
          {state.otp && (state.status === "arrived" || state.status === "accepted") && (
            <div className="rounded-[12px] p-3 mb-3 text-center animate-scale-in" style={{ background: "var(--brand-tint)", border: "1.5px solid var(--brand)" }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: "var(--brand)" }}>Share OTP with worker to start</p>
              <p className="text-[32px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "8px" }}>{state.otp}</p>
            </div>
          )}

          {/* Worker info */}
          <div className="flex items-center gap-3 mb-3 rounded-[14px] p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <div className="rounded-full flex items-center justify-center text-[18px] font-black text-white shrink-0"
                 style={{ width: 48, height: 48, background: w?.color }}>{w?.initials}</div>
            <div className="flex-1">
              <p className="text-[14px] font-extrabold" style={{ color: "var(--text-1)" }}>{w?.name}</p>
              <p className="text-[11px] font-bold" style={{ color: w?.color }}>{w?.tradeIcon} {w?.trade} · {w?.experience}</p>
              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>⭐ {w?.rating} · {w?.jobs} jobs · KS {w?.KaizyScore}</p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-black" style={{ color: "var(--brand)" }}>₹{state.pricing?.grandTotal}</p>
              {/* Phone visible only AFTER accepted */}
              {["accepted", "en_route", "arrived", "working"].includes(state.status) && w?.phone && (
                <a href={`tel:${w.phone}`} className="text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                   style={{ background: "var(--success)", color: "#fff" }}>📞 Call</a>
              )}
            </div>
          </div>

          {/* Contact info — only after booking */}
          {["accepted", "en_route", "arrived", "working"].includes(state.status) && w?.phone && (
            <div className="rounded-[12px] p-3 mb-3" style={{ background: "var(--success-tint)", border: "1px solid var(--success)" }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: "var(--success)" }}>📞 Worker Contact (visible after booking)</p>
              <p className="text-[14px] font-black" style={{ color: "var(--text-1)" }}>{w.phone}</p>
            </div>
          )}

          {/* Chat section (WhatsApp-style) */}
          <p className="text-[11px] font-bold mb-2" style={{ color: "var(--text-3)" }}>💬 Messages</p>
          <div ref={chatRef} className="rounded-[14px] p-3 mb-3 overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", maxHeight: 200 }}>
            {state.messages.map(msg => (
              <div key={msg.id} className={`mb-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className="rounded-[12px] px-3 py-2 max-w-[75%]"
                     style={{
                       background: msg.sender === "user" ? "var(--brand)" : msg.sender === "system" ? "var(--bg-elevated)" : "var(--bg-elevated)",
                       color: msg.sender === "user" ? "#fff" : "var(--text-1)",
                       border: msg.sender === "system" ? "1px solid var(--border-1)" : "none",
                     }}>
                  <p className="text-[11px]">{msg.text}</p>
                  <p className="text-[8px] mt-0.5 text-right" style={{ color: msg.sender === "user" ? "rgba(255,255,255,0.6)" : "var(--text-3)" }}>
                    {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-3">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                   onKeyDown={e => { if (e.key === "Enter" && chatInput.trim()) { sendMessage(chatInput.trim()); setChatInput(""); } }}
                   placeholder="Type a message..."
                   className="flex-1 rounded-[12px] px-4 py-2.5 text-[12px] font-semibold outline-none"
                   style={{ background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border-1)" }} />
            <button onClick={() => { if (chatInput.trim()) { sendMessage(chatInput.trim()); setChatInput(""); } }}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-90"
                    style={{ background: "var(--brand)" }}>
              <span className="text-white text-[14px]">➤</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-4">
            <a href="tel:+919876543210" className="flex-1 rounded-[12px] py-3 text-center text-[12px] font-extrabold text-white active:scale-95"
               style={{ background: "var(--success)" }}>📞 Call</a>
            {(state.status === "matched" || state.status === "accepted" || state.status === "en_route") && (
              <Link href="/tracking" className="flex-1 rounded-[12px] py-3 text-center text-[12px] font-extrabold text-white active:scale-95"
                    style={{ background: "#3B82F6" }}>🗺️ Live Track</Link>
            )}
            {state.status === "arrived" && (
              <button onClick={jobStarted} className="flex-1 rounded-[12px] py-3 text-center text-[12px] font-extrabold text-white active:scale-95"
                      style={{ background: "var(--brand)" }}>▶ Start Job</button>
            )}
            {state.status === "working" && (
              <button onClick={jobCompleted} className="flex-1 rounded-[12px] py-3 text-center text-[12px] font-extrabold text-white active:scale-95"
                      style={{ background: "var(--brand)" }}>✓ Job Done</button>
            )}
            <button onClick={() => setShowCancelModal(true)} className="rounded-[12px] py-3 px-4 text-center text-[12px] font-extrabold active:scale-95"
                    style={{ background: "var(--bg-card)", color: "var(--danger)", border: "1px solid var(--danger-tint)" }}>✕</button>
          </div>

          {/* Cancel Reason Modal */}
          {showCancelModal && (
            <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <div className="w-full max-w-md rounded-t-3xl p-5 pb-8 anim-up" style={{ background: "var(--bg-app)" }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--bg-elevated)" }} />
                <h3 className="text-[16px] font-black mb-1" style={{ color: "var(--text-1)" }}>Cancel Booking?</h3>
                <p className="text-[11px] mb-4" style={{ color: "var(--text-3)" }}>Help us understand why. This helps improve Kaizy.</p>
                <div className="space-y-2 mb-4">
                  {["Worker is taking too long", "Found another worker", "Price too high", "Problem solved", "Wrong service selected", "Other reason"].map(reason => (
                    <button key={reason} onClick={() => setCancelReason(reason)}
                            className="w-full text-left rounded-xl px-4 py-3 text-[12px] font-semibold active:scale-[0.98]"
                            style={{
                              background: cancelReason === reason ? "var(--danger-tint)" : "var(--bg-card)",
                              color: cancelReason === reason ? "var(--danger)" : "var(--text-1)",
                              border: `1.5px solid ${cancelReason === reason ? "var(--danger)" : "var(--border-1)"}`,
                            }}>
                      {cancelReason === reason ? "● " : "○ "}{reason}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCancelModal(false)}
                          className="flex-1 rounded-xl py-3.5 text-[13px] font-bold active:scale-95"
                          style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
                    Go Back
                  </button>
                  <button onClick={() => { cancelBooking(); setShowCancelModal(false); }}
                          disabled={!cancelReason}
                          className="flex-1 rounded-xl py-3.5 text-[13px] font-bold text-white active:scale-95 disabled:opacity-40"
                          style={{ background: "var(--danger)" }}>
                    Cancel Booking
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── STEP 5: COMPLETED → PAYMENT CONFIRMATION ──
  if (state.status === "completed") {
    const w = state.selectedWorker;

    return (
      <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
        <div className="px-4 pt-4">
          {/* Success header */}
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 animate-bounce-in" style={{ background: "var(--success)", boxShadow: "0 6px 24px rgba(0,208,132,0.3)" }}>
              <span className="text-white text-[28px]">✓</span>
            </div>
         <h1 className="text-[20px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Job Completed! 🎉</h1>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>Please pay the worker to proceed</p>
          </div>

          {/* Worker card */}
          <div className="flex items-center gap-3 rounded-xl p-3 mb-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <div className="rounded-full flex items-center justify-center text-[18px] font-black text-white shrink-0"
                 style={{ width: 48, height: 48, background: w?.color }}>{w?.initials}</div>
            <div className="flex-1">
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{w?.name}</p>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{w?.tradeIcon} {selectedProblem}</p>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="rounded-xl p-4 mb-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[12px] font-bold mb-3" style={{ color: "var(--text-3)" }}>Payment Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-2)" }}>Worker&apos;s rate</span><span className="font-bold" style={{ color: "var(--text-1)" }}>₹{state.pricing?.base}</span></div>
              {(state.pricing?.distanceFee || 0) > 0 && (
                <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-2)" }}>Distance fee</span><span className="font-bold" style={{ color: "var(--text-1)" }}>₹{state.pricing?.distanceFee}</span></div>
              )}
              <div className="h-px" style={{ background: "var(--border-1)" }} />
              <div className="flex justify-between text-[16px]"><span className="font-bold" style={{ color: "var(--text-1)" }}>Total</span><span className="font-black" style={{ color: "var(--brand)" }}>₹{state.pricing?.grandTotal}</span></div>
            </div>
          </div>

          {/* Payment method */}
          <p className="text-[12px] font-bold mb-2" style={{ color: "var(--text-3)" }}>Payment Method</p>

          {/* Cash on Hand */}
          <button onClick={() => confirmPayment('cash', state.pricing?.grandTotal || 0)}
                  className="w-full rounded-[16px] py-4 mb-3 active:scale-[0.97] transition-all"
                  style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
            <p className="text-[15px] font-black text-white">💵 Paid ₹{state.pricing?.grandTotal} Cash</p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>I have paid {w?.name} directly</p>
          </button>

          {/* UPI (future) */}
          <button disabled className="w-full rounded-xl py-4 opacity-40"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[13px] font-bold" style={{ color: "var(--text-2)" }}>📱 Pay via UPI — Coming Soon</p>
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 5b: REVIEWING → RATE THE WORKER ──
  if (state.status === "reviewing") {
    const w = state.selectedWorker;
    const posTags = ["On Time", "Good Work", "Polite", "Clean", "Fair Price", "Expert"];
    const negTags = ["Late", "Overcharged", "Rude", "Messy"];

    return (
      <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
        <div className="px-4 pt-4">
          <h1 className="text-[18px] font-black tracking-tight mb-1" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>How was {w?.name}? 🌟</h1>
          <p className="text-[11px] mb-4" style={{ color: "var(--text-3)" }}>Your review helps other hirers find great workers</p>

          {/* Worker card */}
          <div className="flex items-center gap-3 rounded-xl p-3 mb-4" style={{ background: "var(--bg-card)" }}>
            <div className="rounded-full flex items-center justify-center text-[18px] font-black text-white shrink-0"
                 style={{ width: 44, height: 44, background: w?.color }}>{w?.initials}</div>
            <div>
              <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{w?.name}</p>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{w?.tradeIcon} {selectedProblem} · ₹{state.pricing?.grandTotal}</p>
            </div>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-3 py-5 text-[40px]">
            {[1,2,3,4,5].map(star => (
              <button key={star} onClick={() => setReviewRating(star)} className="active:scale-110 transition-transform">
                {star <= reviewRating ? "⭐" : "☆"}
              </button>
            ))}
          </div>
          <p className="text-center text-[13px] font-bold mb-4" style={{ color: "var(--brand)" }}>
            {reviewRating === 5 ? "Excellent! 🔥" : reviewRating === 4 ? "Great!" : reviewRating === 3 ? "Good" : reviewRating === 2 ? "Fair" : "Poor"}
          </p>

          {/* Tags */}
          <p className="text-[11px] font-bold mb-2" style={{ color: "var(--text-3)" }}>What went well?</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {posTags.map(tag => (
              <button key={tag} onClick={() => setReviewTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className="text-[10px] font-bold px-3 py-[5px] rounded-full active:scale-95"
                      style={{
                        background: reviewTags.includes(tag) ? "var(--success)" : "var(--success-tint)",
                        color: reviewTags.includes(tag) ? "#fff" : "var(--success)",
                      }}>{reviewTags.includes(tag) ? "✓ " : ""}{tag}</button>
            ))}
          </div>
          <p className="text-[11px] font-bold mb-2" style={{ color: "var(--text-3)" }}>Any issues?</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {negTags.map(tag => (
              <button key={tag} onClick={() => setReviewTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className="text-[10px] font-bold px-3 py-[5px] rounded-full active:scale-95"
                      style={{
                        background: reviewTags.includes(tag) ? "var(--danger)" : "var(--danger-tint)",
                        color: reviewTags.includes(tag) ? "#fff" : "var(--danger)",
                      }}>{reviewTags.includes(tag) ? "✗ " : ""}{tag}</button>
            ))}
          </div>

          <button onClick={() => submitReview(reviewRating, reviewTags)}
                  className="w-full rounded-[16px] py-4 active:scale-[0.97] transition-all"
                  style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
            <p className="text-[14px] font-black text-white">Submit Review ⭐</p>
          </button>

          <button onClick={() => submitReview(0, [])}
                  className="w-full mt-3 py-3 text-[12px] font-semibold active:scale-95"
                  style={{ color: "var(--text-3)" }}>Skip Review</button>
        </div>
      </div>
    );
  }

  // ── STEP 6: PAID → SUCCESS ──
  if (state.status === "paid") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: "var(--bg-app)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 animate-bounce-in"
             style={{ background: "var(--success)", boxShadow: "0 8px 32px rgba(0,208,132,0.3)" }}>
          <span className="text-white text-[32px]">✓</span>
        </div>
        <h1 className="text-[24px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Payment Done! 🎉</h1>
        <p className="text-[13px] mt-2 text-center font-medium" style={{ color: "var(--text-3)" }}>₹{state.pricing?.workerPayout} released to {state.selectedWorker?.name}</p>
        <p className="text-[10px] mt-1 text-center font-medium" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>Review saved · Worker notified</p>
        <Link href="/" onClick={() => resetBooking()} className="mt-8 rounded-[16px] px-8 py-4 text-[15px] font-black text-white active:scale-[0.97] transition-transform"
              style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
          Back to Home
        </Link>
      </div>
    );
  }

  return null;
}
