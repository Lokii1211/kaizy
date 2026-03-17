import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════
// KAIZY — PRODUCTION SUPABASE CLIENT
// Public client (browser) + Admin client (server-only)
// ═══════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Public client — safe for browser, uses anon key + RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — server-side only, bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ═══ HELPER: Calculate distance between two GPS points (Haversine) ═══
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// ═══ HELPER: Find nearby workers from database ═══
export async function findNearbyWorkers(
  trade: string, lat: number, lng: number, radiusKm: number = 5, limit: number = 10
) {
  const { data: workers } = await supabaseAdmin
    .from('worker_profiles')
    .select('*, users(id, name, phone, profile_photo, fcm_token)')
    .eq('is_online', true)
    .eq('is_available', true)
    .ilike('trade_primary', trade)
    .limit(50);

  if (!workers?.length) return [];

  return workers
    .map(w => ({
      ...w,
      distance: calculateDistance(lat, lng, Number(w.latitude), Number(w.longitude)),
      eta: Math.max(3, Math.round(calculateDistance(lat, lng, Number(w.latitude), Number(w.longitude)) / 0.5)),
    }))
    .filter(w => w.distance <= radiusKm)
    .sort((a, b) => {
      // Smart sort: 30% rating + 25% proximity + 20% KaizyScore + 15% verification + 10% experience
      const scoreA = (a.avg_rating / 5) * 30 + (1 - a.distance / radiusKm) * 25 + (a.kaizy_score / 1000) * 20 + (a.aadhaar_verified ? 15 : 0) + Math.min(a.experience_years, 10) / 10 * 10;
      const scoreB = (b.avg_rating / 5) * 30 + (1 - b.distance / radiusKm) * 25 + (b.kaizy_score / 1000) * 20 + (b.aadhaar_verified ? 15 : 0) + Math.min(b.experience_years, 10) / 10 * 10;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

// ═══ HELPER: Get pricing for a job ═══
export async function calculateJobPricing(trade: string, problemType: string, distanceKm: number, isEmergency: boolean) {
  const { data: rule } = await supabaseAdmin
    .from('pricing_rules')
    .select('*')
    .eq('trade', trade.toLowerCase())
    .eq('problem_type', problemType)
    .single();

  const basePrice = rule?.base_price || 400;
  const pricePerKm = rule?.price_per_km || 10;
  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 6;
  const isWeekend = [0, 6].includes(new Date().getDay());

  let workerCharge = basePrice + (distanceKm * pricePerKm);
  const surcharges: Array<{ name: string; amount: number }> = [];

  if (isNight) {
    const nightExtra = Math.round(workerCharge * ((rule?.night_multiplier || 1.5) - 1));
    surcharges.push({ name: 'Night charge', amount: nightExtra });
    workerCharge += nightExtra;
  }
  if (isEmergency) {
    const emergExtra = Math.round(workerCharge * ((rule?.emergency_multiplier || 1.8) - 1));
    surcharges.push({ name: 'Emergency', amount: emergExtra });
    workerCharge += emergExtra;
  }
  if (isWeekend) {
    const weekendExtra = Math.round(workerCharge * ((rule?.weekend_multiplier || 1.2) - 1));
    surcharges.push({ name: 'Weekend', amount: weekendExtra });
    workerCharge += weekendExtra;
  }

  workerCharge = Math.round(workerCharge);
  const platformFee = Math.round(workerCharge * 0.10);
  const insurance = 5;
  const total = workerCharge + platformFee + insurance;

  return {
    workerCharge, platformFee, insurance, total, surcharges,
    distanceCharge: Math.round(distanceKm * pricePerKm),
    estimatedDuration: rule?.duration_minutes || 60,
    breakdown: { base: basePrice, distance: Math.round(distanceKm * pricePerKm), night: isNight, emergency: isEmergency, weekend: isWeekend },
  };
}

// ═══ HELPER: Send notification to user ═══
export async function createNotification(userId: string, type: string, title: string, body: string, data: Record<string, unknown> = {}) {
  await supabaseAdmin.from('notifications').insert({ user_id: userId, type, title, body, data });
}

// ═══ TYPES ═══
export interface DbUser {
  id: string; phone: string; name: string; user_type: 'worker' | 'hirer';
  profile_photo?: string; city: string; latitude?: number; longitude?: number;
  language: string; fcm_token?: string;
}

export interface DbWorkerProfile {
  id: string; trade_primary: string; experience_years: number; rate_hourly: number;
  is_online: boolean; is_available: boolean; latitude: number; longitude: number;
  avg_rating: number; total_jobs: number; kaizy_score: number; aadhaar_verified: boolean;
  users?: DbUser;
}

export interface DbJob {
  id: string; hirer_id: string; trade: string; problem_type: string;
  latitude: number; longitude: number; address?: string; status: string;
  estimated_price: number; urgency: string;
}

export interface DbBooking {
  id: string; job_id: string; hirer_id: string; worker_id: string;
  status: string; total_amount: number; otp: string; payment_status: string;
}
