import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════════════════════
// GET /api/pricing/market?trade=electrician
// Returns market pricing — from DB if available, hardcoded fallback
// ═══════════════════════════════════════════════════════

const HARDCODED_PRICES: Record<string, { problem_type: string; display_name: string; price_min: number; price_max: number; duration_min: number }[]> = {
  electrician: [
    { problem_type: 'fan_repair', display_name: 'Fan / Light repair', price_min: 150, price_max: 300, duration_min: 45 },
    { problem_type: 'mcb_repair', display_name: 'MCB / Switchboard', price_min: 200, price_max: 400, duration_min: 30 },
    { problem_type: 'wiring_fault', display_name: 'Wiring fault', price_min: 300, price_max: 700, duration_min: 90 },
    { problem_type: 'ac_wiring', display_name: 'AC electrical work', price_min: 400, price_max: 900, duration_min: 120 },
    { problem_type: 'inverter', display_name: 'Inverter / Battery', price_min: 500, price_max: 1000, duration_min: 90 },
  ],
  plumber: [
    { problem_type: 'tap_repair', display_name: 'Tap / Pipe repair', price_min: 150, price_max: 300, duration_min: 30 },
    { problem_type: 'pipe_leak', display_name: 'Pipe leak', price_min: 250, price_max: 600, duration_min: 60 },
    { problem_type: 'drain_block', display_name: 'Drain cleaning', price_min: 200, price_max: 500, duration_min: 45 },
    { problem_type: 'toilet_repair', display_name: 'Toilet repair', price_min: 300, price_max: 700, duration_min: 60 },
  ],
  mechanic: [
    { problem_type: 'puncture_bike', display_name: 'Tyre puncture (bike)', price_min: 80, price_max: 150, duration_min: 20 },
    { problem_type: 'puncture_car', display_name: 'Tyre puncture (car)', price_min: 150, price_max: 280, duration_min: 25 },
    { problem_type: 'battery_jump', display_name: 'Battery jumpstart', price_min: 250, price_max: 400, duration_min: 20 },
    { problem_type: 'engine_stall', display_name: 'Engine stall', price_min: 500, price_max: 1200, duration_min: 90 },
    { problem_type: 'car_towing', display_name: 'Car towing', price_min: 600, price_max: 1500, duration_min: 120 },
  ],
  ac_repair: [
    { problem_type: 'not_cooling', display_name: 'AC not cooling', price_min: 350, price_max: 800, duration_min: 60 },
    { problem_type: 'gas_refill', display_name: 'Gas refill', price_min: 700, price_max: 1400, duration_min: 60 },
    { problem_type: 'cleaning', display_name: 'AC cleaning', price_min: 300, price_max: 600, duration_min: 45 },
  ],
  carpenter: [
    { problem_type: 'door_fix', display_name: 'Door repair', price_min: 250, price_max: 600, duration_min: 45 },
  ],
  painter: [
    { problem_type: 'room_painting', display_name: 'Room painting', price_min: 1500, price_max: 4000, duration_min: 300 },
  ],
};

export async function GET(req: NextRequest) {
  const trade = req.nextUrl.searchParams.get('trade')?.toLowerCase() || '';

  // Try DB first
  try {
    const query = trade
      ? supabaseAdmin.from('market_pricing').select('*').eq('trade', trade).order('price_min')
      : supabaseAdmin.from('market_pricing').select('*').order('trade').order('price_min');

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return NextResponse.json({ success: true, data, trade, source: 'db' });
    }
  } catch { /* fall through */ }

  // Fallback to hardcoded
  const prices = trade
    ? (HARDCODED_PRICES[trade] || []).map(p => ({ ...p, trade }))
    : Object.entries(HARDCODED_PRICES).flatMap(([t, items]) => items.map(p => ({ ...p, trade: t })));

  return NextResponse.json({
    success: true,
    data: prices,
    trade,
    count: prices.length,
    source: 'hardcoded',
  });
}
