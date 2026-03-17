import { NextRequest, NextResponse } from "next/server";

// ============================================================
// Kaizy — PRODUCTION DYNAMIC PRICING ENGINE v2
// Cloned from: Uber surge + Rapido dynamic + Swiggy pricing
// 30+ problem types · 8 multipliers · GST · Min/Max caps
// ============================================================

interface PricingRule {
  trade: string; problem: string; base: number; perKm: number;
  min: number; max: number; durationMins: number;
}

// ── COMPLETE PRICING TABLE (30+ problem types) ──
const PRICING_RULES: PricingRule[] = [
  // ELECTRICAL
  { trade: "electrical", problem: "fan_repair",        base: 150, perKm: 10, min: 100, max: 400,  durationMins: 45 },
  { trade: "electrical", problem: "switch_repair",     base: 100, perKm: 10, min: 80,  max: 250,  durationMins: 30 },
  { trade: "electrical", problem: "wiring_fault",      base: 300, perKm: 15, min: 200, max: 800,  durationMins: 90 },
  { trade: "electrical", problem: "mcb_trip",          base: 150, perKm: 10, min: 100, max: 350,  durationMins: 30 },
  { trade: "electrical", problem: "ac_wiring",         base: 400, perKm: 15, min: 300, max: 1000, durationMins: 120 },
  { trade: "electrical", problem: "complete_rewiring", base: 1500,perKm: 20, min: 1000,max: 5000, durationMins: 480 },
  { trade: "electrical", problem: "inverter_battery",  base: 400, perKm: 15, min: 300, max: 900,  durationMins: 90 },
  { trade: "electrical", problem: "meter_issue",       base: 200, perKm: 10, min: 150, max: 500,  durationMins: 45 },

  // PLUMBING
  { trade: "plumbing", problem: "tap_repair",           base: 150, perKm: 10, min: 100, max: 350,  durationMins: 30 },
  { trade: "plumbing", problem: "pipe_leak",            base: 300, perKm: 15, min: 200, max: 700,  durationMins: 60 },
  { trade: "plumbing", problem: "drain_block",          base: 250, perKm: 12, min: 200, max: 600,  durationMins: 45 },
  { trade: "plumbing", problem: "toilet_repair",        base: 350, perKm: 15, min: 250, max: 800,  durationMins: 60 },
  { trade: "plumbing", problem: "water_motor",          base: 500, perKm: 20, min: 400, max: 1200, durationMins: 90 },
  { trade: "plumbing", problem: "pipe_burst_emergency", base: 800, perKm: 20, min: 600, max: 2000, durationMins: 90 },
  { trade: "plumbing", problem: "bathroom_fitting",     base: 600, perKm: 18, min: 500, max: 1500, durationMins: 120 },

  // MECHANIC
  { trade: "mechanic", problem: "tyre_puncture",       base: 200, perKm: 15, min: 150, max: 500,  durationMins: 30 },
  { trade: "mechanic", problem: "battery_jumpstart",   base: 300, perKm: 20, min: 250, max: 700,  durationMins: 20 },
  { trade: "mechanic", problem: "engine_stall",        base: 600, perKm: 20, min: 500, max: 1500, durationMins: 90 },
  { trade: "mechanic", problem: "tyre_change",         base: 250, perKm: 15, min: 200, max: 600,  durationMins: 30 },
  { trade: "mechanic", problem: "car_towing",          base: 800, perKm: 25, min: 600, max: 2000, durationMins: 120 },
  { trade: "mechanic", problem: "breakdown_diagnosis", base: 400, perKm: 20, min: 300, max: 900,  durationMins: 60 },
  { trade: "mechanic", problem: "oil_change",          base: 350, perKm: 15, min: 300, max: 700,  durationMins: 45 },
  { trade: "mechanic", problem: "brake_issue",         base: 700, perKm: 20, min: 600, max: 1500, durationMins: 90 },

  // AC REPAIR
  { trade: "ac_repair", problem: "ac_not_cooling",     base: 400, perKm: 15, min: 350, max: 900,  durationMins: 60 },
  { trade: "ac_repair", problem: "ac_gas_refill",      base: 800, perKm: 20, min: 700, max: 1500, durationMins: 60 },
  { trade: "ac_repair", problem: "ac_cleaning",        base: 350, perKm: 15, min: 300, max: 700,  durationMins: 45 },
  { trade: "ac_repair", problem: "ac_installation",    base: 1200,perKm: 25, min: 1000,max: 2500, durationMins: 180 },
  { trade: "ac_repair", problem: "ac_pcb_repair",      base: 600, perKm: 20, min: 500, max: 1200, durationMins: 90 },
  { trade: "ac_repair", problem: "ac_compressor",      base: 1500,perKm: 25, min: 1200,max: 3000, durationMins: 180 },

  // CARPENTRY
  { trade: "carpentry", problem: "door_fix",           base: 300, perKm: 15, min: 250, max: 700,  durationMins: 45 },
  { trade: "carpentry", problem: "furniture_repair",   base: 400, perKm: 15, min: 350, max: 900,  durationMins: 60 },
  { trade: "carpentry", problem: "lock_repair",        base: 200, perKm: 12, min: 150, max: 500,  durationMins: 30 },
  { trade: "carpentry", problem: "window_fix",         base: 350, perKm: 15, min: 300, max: 800,  durationMins: 60 },

  // PAINTING
  { trade: "painting", problem: "room_painting",      base: 1500,perKm: 20, min: 1200,max: 4000, durationMins: 300 },
  { trade: "painting", problem: "wall_repair",        base: 400, perKm: 15, min: 300, max: 900,  durationMins: 60 },
  { trade: "painting", problem: "waterproofing",      base: 2000,perKm: 25, min: 1500,max: 6000, durationMins: 480 },
];

// ── INDIAN HOLIDAYS 2026 ──
const HOLIDAYS_2026 = [
  "2026-01-26","2026-03-14","2026-03-31","2026-04-02","2026-04-06","2026-04-14",
  "2026-05-01","2026-07-07","2026-08-15","2026-08-17","2026-09-27","2026-10-02",
  "2026-10-20","2026-10-21","2026-10-22","2026-11-09","2026-12-25",
];

// ── MULTIPLIERS ──
const NIGHT_MULT = 1.5;    // 10PM–6AM
const EMERGENCY_MULT = 1.8; // KaizySOS
const RAIN_MULT = 1.3;      // Rainy conditions
const HOLIDAY_MULT = 2.0;   // National holidays

// Worker level premium
const LEVEL_PREMIUM: Record<number, number> = {
  0: 1.0,   // New
  1: 1.0,   // Gold
  2: 1.1,   // Platinum (10% more)
  3: 1.15,  // Diamond (15% more)
  4: 1.25,  // KaizyPro (25% more)
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return HOLIDAYS_2026.includes(dateStr);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      trade, problemType, hirerLat = 11.0168, hirerLng = 76.9558,
      workerLat, workerLng, isEmergency = false, scheduledAt,
      workerLevel = 0, isRaining = false, demandSurge = 1.0, complexity = 1.0,
    } = body;

    // 1. Find pricing rule
    const rule = PRICING_RULES.find(r =>
      r.trade.toLowerCase() === (trade || "").toLowerCase() &&
      r.problem.toLowerCase() === (problemType || r.problem).toLowerCase()
    ) || PRICING_RULES.find(r => r.trade.toLowerCase() === (trade || "").toLowerCase());

    if (!rule) {
      return NextResponse.json({ success: false, error: "Trade not found" }, { status: 400 });
    }

    // 2. Calculate distance
    const distanceKm = workerLat && workerLng
      ? haversine(hirerLat, hirerLng, workerLat, workerLng)
      : body.distance || 2;
    const distanceCharge = distanceKm > 5 ? Math.round((distanceKm - 5) * rule.perKm) : 0;

    // 3. Time multipliers
    const now = scheduledAt ? new Date(scheduledAt) : new Date();
    const hour = now.getHours();
    const isNight = hour >= 22 || hour < 6;
    const isWeekend = [0, 6].includes(now.getDay());
    const isHol = isHoliday(now);

    // 4. Calculate base + distance
    let workerCharge = (rule.base + distanceCharge) * complexity;
    const surcharges: { name: string; mult: number; amount: number }[] = [];

    // Apply multipliers
    if (isEmergency) {
      const amt = Math.round(workerCharge * (EMERGENCY_MULT - 1));
      workerCharge *= EMERGENCY_MULT;
      surcharges.push({ name: "🆘 Emergency", mult: EMERGENCY_MULT, amount: amt });
    }
    if (isNight) {
      const amt = Math.round(workerCharge * (NIGHT_MULT - 1));
      workerCharge *= NIGHT_MULT;
      surcharges.push({ name: "🌙 Night Service", mult: NIGHT_MULT, amount: amt });
    }
    if (isHol) {
      const amt = Math.round(workerCharge * (HOLIDAY_MULT - 1));
      workerCharge *= HOLIDAY_MULT;
      surcharges.push({ name: "🎉 Holiday", mult: HOLIDAY_MULT, amount: amt });
    }
    if (isRaining) {
      const amt = Math.round(workerCharge * (RAIN_MULT - 1));
      workerCharge *= RAIN_MULT;
      surcharges.push({ name: "🌧️ Rain", mult: RAIN_MULT, amount: amt });
    }
    if (demandSurge > 1) {
      const amt = Math.round(workerCharge * (demandSurge - 1));
      workerCharge *= demandSurge;
      surcharges.push({ name: "📈 High Demand", mult: demandSurge, amount: amt });
    }
    if (isWeekend && !isHol) {
      const weekendMult = 1.15;
      const amt = Math.round(workerCharge * (weekendMult - 1));
      workerCharge *= weekendMult;
      surcharges.push({ name: "📅 Weekend", mult: weekendMult, amount: amt });
    }

    // Worker level premium
    const lvl = LEVEL_PREMIUM[workerLevel] || 1.0;
    if (lvl > 1) {
      workerCharge *= lvl;
      surcharges.push({ name: "⭐ Pro Worker", mult: lvl, amount: Math.round(workerCharge * (lvl - 1)) });
    }

    // Apply min/max caps
    workerCharge = Math.min(Math.max(Math.round(workerCharge), rule.min), rule.max);

    // 5. Platform fees
    const platformFee = Math.round(workerCharge * 0.10);
    const insuranceFee = 5;
    const gstOnFee = Math.round(platformFee * 0.18);
    const totalAmount = workerCharge + platformFee + insuranceFee + gstOnFee;
    const netToWorker = Math.round(workerCharge * 0.98); // 2% payment processing

    return NextResponse.json({
      success: true,
      data: {
        breakdown: {
          basePrice: rule.base,
          distanceKm: Math.round(distanceKm * 10) / 10,
          distanceCharge,
          complexity: `${complexity}x`,
          workerCharge,
          platformFee,
          gst: gstOnFee,
          insurance: insuranceFee,
          totalAmount,
          netToWorker,
        },
        surcharges,
        estimatedDuration: rule.durationMins,
        priceRange: {
          min: rule.min + Math.round(rule.min * 0.10) + insuranceFee,
          max: rule.max + Math.round(rule.max * 0.10) + insuranceFee,
        },
        meta: {
          trade: rule.trade,
          problem: rule.problem,
          isNight, isWeekend, isHoliday: isHol, isRaining, isEmergency,
          workerLevel, complexity,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

// GET: fetch all pricing rules for a trade
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trade = searchParams.get("trade");

  if (trade) {
    const rules = PRICING_RULES.filter(r => r.trade.toLowerCase() === trade.toLowerCase());
    return NextResponse.json({ success: true, data: rules });
  }

  // Return all trades with counts
  const trades = [...new Set(PRICING_RULES.map(r => r.trade))].map(t => ({
    trade: t,
    problems: PRICING_RULES.filter(r => r.trade === t).length,
    priceRange: {
      min: Math.min(...PRICING_RULES.filter(r => r.trade === t).map(r => r.min)),
      max: Math.max(...PRICING_RULES.filter(r => r.trade === t).map(r => r.max)),
    },
  }));

  return NextResponse.json({ success: true, data: trades });
}
