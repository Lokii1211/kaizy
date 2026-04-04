"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ============================================================
// ONBOARDING: SPECIALIZATION & PRICING — Stitch Screen Match
// Workers select services in their domain & set avg prices
// ============================================================

const tradeServices: Record<string, { icon: string; name: string; services: { id: string; name: string; avgPrice: number; unit: string }[] }> = {
  electrician: {
    icon: "⚡", name: "Electrician",
    services: [
      { id: "fan_install", name: "Fan Installation", avgPrice: 250, unit: "per fan" },
      { id: "switch_repair", name: "Switch/Board Repair", avgPrice: 150, unit: "per point" },
      { id: "wiring", name: "Full House Wiring", avgPrice: 3500, unit: "per room" },
      { id: "mcb_repair", name: "MCB/Fuse Repair", avgPrice: 200, unit: "per unit" },
      { id: "light_install", name: "Light Installation", avgPrice: 180, unit: "per light" },
      { id: "inverter_install", name: "Inverter/UPS Setup", avgPrice: 500, unit: "per unit" },
      { id: "earthing", name: "Earthing Work", avgPrice: 1500, unit: "per point" },
    ],
  },
  plumber: {
    icon: "🔧", name: "Plumber",
    services: [
      { id: "tap_repair", name: "Tap Repair/Replace", avgPrice: 200, unit: "per tap" },
      { id: "pipe_leak", name: "Pipe Leak Fix", avgPrice: 350, unit: "per leak" },
      { id: "toilet_repair", name: "Toilet Repair", avgPrice: 400, unit: "per unit" },
      { id: "tank_clean", name: "Water Tank Cleaning", avgPrice: 800, unit: "per tank" },
      { id: "drainage", name: "Drainage Block", avgPrice: 500, unit: "per job" },
      { id: "geyser_install", name: "Geyser Installation", avgPrice: 600, unit: "per unit" },
      { id: "motor_repair", name: "Motor Pump Repair", avgPrice: 700, unit: "per unit" },
    ],
  },
  mechanic: {
    icon: "🚗", name: "Mechanic",
    services: [
      { id: "oil_change", name: "Oil Change", avgPrice: 300, unit: "per vehicle" },
      { id: "brake_repair", name: "Brake Pad Replace", avgPrice: 800, unit: "per set" },
      { id: "battery_replace", name: "Battery Replace", avgPrice: 500, unit: "per unit" },
      { id: "tyre_puncture", name: "Tyre Puncture", avgPrice: 100, unit: "per tyre" },
      { id: "general_service", name: "General Service", avgPrice: 1500, unit: "per vehicle" },
      { id: "ac_recharge", name: "AC Gas Recharge", avgPrice: 1200, unit: "per vehicle" },
      { id: "engine_tune", name: "Engine Tune-up", avgPrice: 2000, unit: "per vehicle" },
    ],
  },
  ac_repair: {
    icon: "❄️", name: "AC Repair",
    services: [
      { id: "ac_service", name: "AC Service/Clean", avgPrice: 500, unit: "per unit" },
      { id: "gas_fill", name: "Gas Refill", avgPrice: 2000, unit: "per unit" },
      { id: "ac_install", name: "AC Installation", avgPrice: 1500, unit: "per unit" },
      { id: "ac_uninstall", name: "AC Uninstallation", avgPrice: 800, unit: "per unit" },
      { id: "compressor", name: "Compressor Repair", avgPrice: 3000, unit: "per unit" },
      { id: "pcb_repair", name: "PCB Board Repair", avgPrice: 1800, unit: "per unit" },
    ],
  },
  carpenter: {
    icon: "🪚", name: "Carpenter",
    services: [
      { id: "furniture_repair", name: "Furniture Repair", avgPrice: 400, unit: "per item" },
      { id: "door_fix", name: "Door Fix/Install", avgPrice: 500, unit: "per door" },
      { id: "shelf_install", name: "Shelf/Rack Install", avgPrice: 350, unit: "per unit" },
      { id: "bed_assembly", name: "Bed Assembly", avgPrice: 600, unit: "per unit" },
      { id: "wardrobe", name: "Wardrobe Work", avgPrice: 2000, unit: "per unit" },
      { id: "kitchen_cabinet", name: "Kitchen Cabinet", avgPrice: 3500, unit: "per unit" },
      { id: "wood_polish", name: "Wood Polish", avgPrice: 800, unit: "per item" },
    ],
  },
  painter: {
    icon: "🎨", name: "Painter",
    services: [
      { id: "room_paint", name: "Room Painting", avgPrice: 3000, unit: "per room" },
      { id: "wall_putty", name: "Wall Putty", avgPrice: 1500, unit: "per room" },
      { id: "texture_paint", name: "Texture Painting", avgPrice: 5000, unit: "per wall" },
      { id: "waterproof", name: "Waterproofing", avgPrice: 2500, unit: "per area" },
      { id: "exterior_paint", name: "Exterior Paint", avgPrice: 8000, unit: "per side" },
      { id: "touch_up", name: "Touch Up Work", avgPrice: 500, unit: "per job" },
    ],
  },
};

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trade = searchParams.get("trade") || "electrician";
  const workerName = searchParams.get("name") || "Worker";
  const workerId = searchParams.get("id") || "";

  const tradeData = tradeServices[trade] || tradeServices.electrician;

  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    tradeData.services.forEach(s => { init[s.id] = s.avgPrice; });
    return init;
  });
  const [saving, setSaving] = useState(false);

  const toggleService = (id: string) => {
    const next = new Set(selectedServices);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedServices(next);
  };

  const updatePrice = (id: string, val: string) => {
    setPrices(prev => ({ ...prev, [id]: parseInt(val) || 0 }));
  };

  const handleSave = async () => {
    if (selectedServices.size === 0) return;
    setSaving(true);
    try {
      const services = Array.from(selectedServices).map(id => ({
        serviceId: id,
        serviceName: tradeData.services.find(s => s.id === id)?.name || id,
        price: prices[id] || 0,
        unit: tradeData.services.find(s => s.id === id)?.unit || "per job",
      }));

      await fetch("/api/workers/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, trade, services }),
      });

      // Navigate to bank setup or verify
      router.push(`/onboarding/bank?id=${workerId}&name=${workerName}`);
    } catch {
      router.push(`/onboarding/bank?id=${workerId}&name=${workerName}`);
    } finally { setSaving(false); }
  };

  const avgPrice = selectedServices.size > 0
    ? Math.round(Array.from(selectedServices).reduce((sum, id) => sum + (prices[id] || 0), 0) / selectedServices.size)
    : 0;

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg-app)" }}>
      {/* Progress */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </button>
          <div>
            <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              Your Services & Pricing
            </h1>
            <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>Step 2 of 4</p>
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i <= 2 ? "var(--brand)" : "var(--bg-elevated)" }} />
          ))}
        </div>
      </div>

      {/* Trade Badge */}
      <div className="px-5 mt-4 mb-4">
        <div className="rounded-[18px] p-4" style={{ background: "var(--gradient-cta)" }}>
          <div className="flex items-center gap-3">
            <span className="text-[36px]">{tradeData.icon}</span>
            <div>
              <p className="text-[16px] font-black text-white" style={{ fontFamily: "'Epilogue', sans-serif" }}>
                {tradeData.name}
              </p>
              <p className="text-[10px] font-medium text-white/70">
                Select the services you offer & set your rates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="px-5">
        <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          Select Your Services ({selectedServices.size} selected)
        </p>
        <div className="space-y-2">
          {tradeData.services.map(service => {
            const isSelected = selectedServices.has(service.id);
            return (
              <div key={service.id} className="rounded-[16px] overflow-hidden transition-all"
                   style={{
                     background: isSelected ? "var(--bg-card)" : "var(--bg-surface)",
                     border: isSelected ? "2px solid rgba(255,107,0,0.3)" : "2px solid transparent",
                   }}>
                <button onClick={() => toggleService(service.id)}
                        className="w-full flex items-center justify-between p-4 active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px]"
                         style={{ background: isSelected ? "var(--brand-tint)" : "var(--bg-elevated)" }}>
                      {isSelected ? "✅" : "⬜"}
                    </div>
                    <div className="text-left">
                      <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{service.name}</p>
                      <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
                        Avg. market rate: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>₹{service.avgPrice}</span> {service.unit}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[8px] font-bold px-2 py-1 rounded-full" style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                      ACTIVE
                    </span>
                  )}
                </button>

                {/* Price Editor — only show when selected */}
                {isSelected && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="flex items-center gap-3 rounded-[12px] p-3" style={{ background: "var(--bg-surface)" }}>
                      <span className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>Your Price:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>₹</span>
                        <input type="number" value={prices[service.id] || ""}
                               onChange={e => updatePrice(service.id, e.target.value)}
                               className="w-20 text-[16px] font-black bg-transparent outline-none text-center"
                               style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}
                               inputMode="numeric" />
                      </div>
                      <span className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{service.unit}</span>
                    </div>
                    {/* Quick price buttons */}
                    <div className="flex gap-1.5 mt-2">
                      {[
                        Math.round(service.avgPrice * 0.8),
                        service.avgPrice,
                        Math.round(service.avgPrice * 1.2),
                        Math.round(service.avgPrice * 1.5),
                      ].map(p => (
                        <button key={p} onClick={() => updatePrice(service.id, String(p))}
                                className="flex-1 py-1.5 rounded-[8px] text-[9px] font-bold active:scale-95 transition-transform"
                                style={{
                                  background: prices[service.id] === p ? "var(--brand)" : "var(--bg-elevated)",
                                  color: prices[service.id] === p ? "#fff" : "var(--text-2)",
                                }}>
                          ₹{p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40"
           style={{ background: "var(--bg-app)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        {selectedServices.size > 0 && (
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Avg. Rate for Hirers</p>
              <p className="text-[18px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                ₹{avgPrice}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold" style={{ color: "var(--text-3)" }}>{selectedServices.size} services</p>
              <p className="text-[8px] font-medium" style={{ color: "var(--text-3)" }}>Hirers will see this rate</p>
            </div>
          </div>
        )}
        <button onClick={handleSave} disabled={saving || selectedServices.size === 0}
                className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all"
                style={{
                  background: selectedServices.size > 0 ? "var(--gradient-cta)" : "var(--bg-elevated)",
                  color: selectedServices.size > 0 ? "#FFDBCC" : "var(--text-3)",
                  boxShadow: selectedServices.size > 0 ? "var(--shadow-brand)" : "none",
                }}>
          {saving ? "Saving..." : `Continue with ${selectedServices.size} Services →`}
        </button>
      </div>
    </div>
  );
}

export default function OnboardingSpecializationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
      <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
    </div>}>
      <OnboardingContent />
    </Suspense>
  );
}
