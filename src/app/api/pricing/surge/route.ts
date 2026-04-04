import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════
// DYNAMIC SURGE PRICING ENGINE
// Bible ref: Challenges Bible → SOLUTION 4
// "Uber-like surge pricing: demand spike = price bump"
// Base: supply-demand ratio + time-of-day + emergency multiplier
// ═══════════════════════════════════════

interface SurgeRequest {
  trade: string;
  latitude: number;
  longitude: number;
  urgency: 'normal' | 'urgent' | 'emergency';
  timeOfDay?: number; // Hour 0-23
}

// Simulated demand data (production: from Redis/Supabase realtime)
function getAreaDemand(lat: number, lng: number, trade: string): { activeJobs: number; availableWorkers: number } {
  // In production, query Supabase for active bookings and available workers
  // For now, use heuristics based on time and location
  const hour = new Date().getHours();
  const isRushHour = (hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 20);
  const isNight = hour >= 22 || hour < 6;

  const baseJobs = isRushHour ? 15 : isNight ? 3 : 8;
  const baseWorkers = isNight ? 2 : isRushHour ? 6 : 10;

  // Some trades are more in-demand
  const tradeMultiplier: Record<string, number> = {
    electrician: 1.3, plumber: 1.4, ac_repair: 1.5,
    carpenter: 0.9, painter: 0.7, mechanic: 1.1,
  };
  const mult = tradeMultiplier[trade] || 1.0;

  return {
    activeJobs: Math.round(baseJobs * mult),
    availableWorkers: Math.max(1, Math.round(baseWorkers / mult)),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: SurgeRequest = await req.json();
    const { trade, latitude = 11.0168, longitude = 76.9558, urgency = 'normal' } = body;

    const hour = body.timeOfDay ?? new Date().getHours();
    const { activeJobs, availableWorkers } = getAreaDemand(latitude, longitude, trade);

    // ─── CALCULATE SURGE MULTIPLIER ───

    // 1. Supply-Demand Ratio (primary factor)
    const demandRatio = activeJobs / Math.max(1, availableWorkers);
    let surgeMultiplier = 1.0;

    if (demandRatio > 3) surgeMultiplier = 1.5;       // Very high demand
    else if (demandRatio > 2) surgeMultiplier = 1.3;   // High demand
    else if (demandRatio > 1.5) surgeMultiplier = 1.15; // Moderate demand
    else if (demandRatio < 0.5) surgeMultiplier = 0.9;  // Low demand discount

    // 2. Time-of-Day Adjustment
    const isNight = hour >= 22 || hour < 6;
    const isWeekend = [0, 6].includes(new Date().getDay());
    if (isNight) surgeMultiplier *= 1.25;  // Night premium
    if (isWeekend) surgeMultiplier *= 1.1; // Weekend premium

    // 3. Urgency Premium
    const urgencyMultiplier: Record<string, number> = {
      normal: 1.0,
      urgent: 1.2,
      emergency: 1.5,
    };
    surgeMultiplier *= urgencyMultiplier[urgency] || 1.0;

    // 4. Cap at 2x (Bible: "no more than 2x base price")
    surgeMultiplier = Math.min(2.0, Math.round(surgeMultiplier * 100) / 100);

    // ─── PRICING BREAKDOWN ───
    const basePrices: Record<string, number> = {
      electrician: 149, plumber: 149, ac_repair: 299,
      carpenter: 199, painter: 249, mechanic: 199,
      puncture: 99, mason: 249,
    };
    const basePrice = basePrices[trade] || 149;
    const surgedPrice = Math.round(basePrice * surgeMultiplier);
    const surgeAmount = surgedPrice - basePrice;

    // ─── DISPLAY LEVEL ───
    let surgeLevel: 'none' | 'low' | 'medium' | 'high' | 'extreme' = 'none';
    let surgeColor = '#00D084'; // green
    let surgeEmoji = '✅';

    if (surgeMultiplier >= 1.8) {
      surgeLevel = 'extreme'; surgeColor = '#FF3B3B'; surgeEmoji = '🔴';
    } else if (surgeMultiplier >= 1.4) {
      surgeLevel = 'high'; surgeColor = '#FF6B00'; surgeEmoji = '🟠';
    } else if (surgeMultiplier >= 1.15) {
      surgeLevel = 'medium'; surgeColor = '#FFB800'; surgeEmoji = '🟡';
    } else if (surgeMultiplier > 1.0) {
      surgeLevel = 'low'; surgeColor = '#3B8BFF'; surgeEmoji = '🔵';
    }

    return NextResponse.json({
      success: true,
      data: {
        trade,
        basePrice,
        surgeMultiplier,
        surgedPrice,
        surgeAmount,
        surgeLevel,
        surgeColor,
        surgeEmoji,
        // Context
        supply: availableWorkers,
        demand: activeJobs,
        demandRatio: Math.round(demandRatio * 100) / 100,
        isNight,
        isWeekend,
        urgency,
        hour,
        // User-facing message
        message: surgeMultiplier > 1
          ? `${surgeEmoji} ${surgeLevel.charAt(0).toUpperCase() + surgeLevel.slice(1)} demand — prices are ${Math.round((surgeMultiplier - 1) * 100)}% higher right now`
          : '✅ Normal pricing — no surge',
        tip: surgeMultiplier > 1.3
          ? 'Tip: Try booking after 30 minutes when demand may drop.'
          : null,
      },
    });
  } catch (error) {
    console.error('[surge pricing error]', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate pricing' }, { status: 500 });
  }
}
