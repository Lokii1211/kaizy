import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════════════════════
// POST /api/admin/migrate
// ONE-TIME: Creates missing tables and seeds market pricing
// Delete this file after running once
// ═══════════════════════════════════════════════════════

export async function POST() {
  const results: string[] = [];

  try {
    // 1. Create market_pricing table
    const { error: e1 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS market_pricing (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trade TEXT NOT NULL,
        problem_type TEXT NOT NULL,
        display_name TEXT NOT NULL,
        price_min DECIMAL(8,2) NOT NULL,
        price_max DECIMAL(8,2) NOT NULL,
        duration_min INTEGER DEFAULT 45,
        is_emergency_eligible BOOLEAN DEFAULT TRUE,
        UNIQUE(trade, problem_type)
      )`
    });
    if (e1) {
      // If rpc doesn't work, try direct insert approach
      results.push(`rpc failed: ${e1.message} — trying seed directly`);
    } else {
      results.push('market_pricing table created');
    }

    // 2. Try seeding via direct inserts
    const marketData = [
      { trade: 'electrician', problem_type: 'fan_repair', display_name: 'Fan / Light repair', price_min: 150, price_max: 300, duration_min: 45, is_emergency_eligible: true },
      { trade: 'electrician', problem_type: 'mcb_repair', display_name: 'MCB / Switchboard', price_min: 200, price_max: 400, duration_min: 30, is_emergency_eligible: true },
      { trade: 'electrician', problem_type: 'wiring_fault', display_name: 'Wiring fault', price_min: 300, price_max: 700, duration_min: 90, is_emergency_eligible: true },
      { trade: 'electrician', problem_type: 'ac_wiring', display_name: 'AC electrical work', price_min: 400, price_max: 900, duration_min: 120, is_emergency_eligible: true },
      { trade: 'electrician', problem_type: 'inverter', display_name: 'Inverter / Battery', price_min: 500, price_max: 1000, duration_min: 90, is_emergency_eligible: true },
      { trade: 'plumber', problem_type: 'tap_repair', display_name: 'Tap / Pipe repair', price_min: 150, price_max: 300, duration_min: 30, is_emergency_eligible: true },
      { trade: 'plumber', problem_type: 'pipe_leak', display_name: 'Pipe leak', price_min: 250, price_max: 600, duration_min: 60, is_emergency_eligible: true },
      { trade: 'plumber', problem_type: 'drain_block', display_name: 'Drain cleaning', price_min: 200, price_max: 500, duration_min: 45, is_emergency_eligible: true },
      { trade: 'plumber', problem_type: 'toilet_repair', display_name: 'Toilet repair', price_min: 300, price_max: 700, duration_min: 60, is_emergency_eligible: true },
      { trade: 'mechanic', problem_type: 'puncture_bike', display_name: 'Tyre puncture (bike)', price_min: 80, price_max: 150, duration_min: 20, is_emergency_eligible: true },
      { trade: 'mechanic', problem_type: 'puncture_car', display_name: 'Tyre puncture (car)', price_min: 150, price_max: 280, duration_min: 25, is_emergency_eligible: true },
      { trade: 'mechanic', problem_type: 'battery_jump', display_name: 'Battery jumpstart', price_min: 250, price_max: 400, duration_min: 20, is_emergency_eligible: true },
      { trade: 'mechanic', problem_type: 'engine_stall', display_name: 'Engine stall', price_min: 500, price_max: 1200, duration_min: 90, is_emergency_eligible: true },
      { trade: 'mechanic', problem_type: 'car_towing', display_name: 'Car towing', price_min: 600, price_max: 1500, duration_min: 120, is_emergency_eligible: false },
      { trade: 'ac_repair', problem_type: 'not_cooling', display_name: 'AC not cooling', price_min: 350, price_max: 800, duration_min: 60, is_emergency_eligible: true },
      { trade: 'ac_repair', problem_type: 'gas_refill', display_name: 'Gas refill', price_min: 700, price_max: 1400, duration_min: 60, is_emergency_eligible: true },
      { trade: 'ac_repair', problem_type: 'cleaning', display_name: 'AC cleaning', price_min: 300, price_max: 600, duration_min: 45, is_emergency_eligible: false },
      { trade: 'carpenter', problem_type: 'door_fix', display_name: 'Door repair', price_min: 250, price_max: 600, duration_min: 45, is_emergency_eligible: false },
      { trade: 'painter', problem_type: 'room_painting', display_name: 'Room painting', price_min: 1500, price_max: 4000, duration_min: 300, is_emergency_eligible: false },
    ];

    const { data, error: e2 } = await supabaseAdmin
      .from('market_pricing')
      .upsert(marketData, { onConflict: 'trade,problem_type' })
      .select();

    if (e2) {
      results.push(`seed error: ${e2.message}`);
    } else {
      results.push(`seeded ${data?.length || 0} market prices`);
    }

    // 3. Create worker_pricing table if missing
    const { error: e3 } = await supabaseAdmin
      .from('worker_pricing')
      .select('id')
      .limit(1);

    if (e3) {
      results.push(`worker_pricing check: ${e3.message}`);
    } else {
      results.push('worker_pricing table exists');
    }

    // 4. Create jobs table columns check
    const { error: e4 } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .limit(1);
    results.push(e4 ? `jobs: ${e4.message}` : 'jobs table OK');

    // 5. Create bookings table check
    const { error: e5 } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .limit(1);
    results.push(e5 ? `bookings: ${e5.message}` : 'bookings table OK');

    // 6. Job alerts
    const { error: e6 } = await supabaseAdmin
      .from('job_alerts')
      .select('id')
      .limit(1);
    results.push(e6 ? `job_alerts: ${e6.message}` : 'job_alerts table OK');

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[migrate] error:', error);
    return NextResponse.json({ success: false, results, error: String(error) }, { status: 500 });
  }
}
