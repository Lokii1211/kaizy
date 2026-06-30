import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// Kaizy — SMART MATCHING API
// Fetches real workers from Supabase, scores with smart algorithm
// ============================================================

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨",
  mason: "⚒️", puncture: "🛞",
};

const tradeColors: Record<string, string> = {
  electrician: "#FF6B00", plumber: "#3B8BFF", mechanic: "#8B5CF6",
  ac_repair: "#06B6D4", carpenter: "#10B981", painter: "#F59E0B",
  mason: "#6366F1", puncture: "#EC4899",
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchRealWorkers(trade: string, lat: number, lng: number, maxDistance: number, onlineOnly: boolean) {
  let query = supabaseAdmin
    .from('worker_profiles')
    .select('*, users(name, phone, city)')
    .eq('is_available', true);

  if (onlineOnly) query = query.eq('is_online', true);
  if (trade && trade !== 'All') query = query.ilike('trade_primary', trade);

  const { data: dbWorkers } = await query.limit(20);

  if (dbWorkers && dbWorkers.length > 0) {
    return dbWorkers.map((w: Record<string, unknown>) => {
      const name = String((w.users as Record<string, unknown>)?.name || 'Worker');
      const tradePrimary = String(w.trade_primary || 'technician').toLowerCase();
      const workerLat = Number(w.latitude || lat + (Math.random() - 0.5) * 0.02);
      const workerLng = Number(w.longitude || lng + (Math.random() - 0.5) * 0.02);
      const dist = haversine(lat, lng, workerLat, workerLng);

      return {
        id: String(w.id),
        name,
        initials: name.split(" ").map(s => s[0]).join("").toUpperCase().slice(0, 2),
        trade: tradePrimary.charAt(0).toUpperCase() + tradePrimary.slice(1).replace(/_/g, ' '),
        tradeIcon: tradeIcons[tradePrimary] || "🔧",
        rating: Number(w.avg_rating || 4.0 + Math.random() * 0.9),
        jobs: Number(w.total_jobs || 0),
        dist: Math.round(dist * 100) / 100,
        price: Number(w.rate_hourly || 400),
        color: tradeColors[tradePrimary] || "#FF6B00",
        verified: Boolean(w.aadhaar_verified),
        online: Boolean(w.is_online),
        eta: Math.round(dist * 6 + 3),
        lat: workerLat,
        lng: workerLng,
        experience: `${w.experience_years || 0}yr`,
        KaizyScore: Number(w.kaizy_score || 500),
      };
    }).filter((w: { dist: number }) => w.dist <= maxDistance);
  }

  return [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trade, lat = 11.0168, lng = 76.9558, maxDistance = 15, onlineOnly = true, sortBy = "smart", limit = 5 } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let results: any[] = await fetchRealWorkers(trade, lat, lng, maxDistance, onlineOnly);

    // Smart scoring
    if (sortBy === "smart") {
      results = results.map((w: Record<string, unknown>) => ({
        ...w,
        matchScore: Math.round(
          (Number(w.rating) / 5) * 30 +
          (1 - Number(w.dist) / maxDistance) * 25 +
          (Number(w.KaizyScore) / 800) * 20 +
          (w.verified ? 15 : 0) +
          (Number(w.jobs) / 500) * 10
        ),
      })).sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        Number(b.matchScore) - Number(a.matchScore)
      );
    } else if (sortBy === "distance") {
      results.sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.dist) - Number(b.dist));
    } else if (sortBy === "rating") {
      results.sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(b.rating) - Number(a.rating));
    } else if (sortBy === "price") {
      results.sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.price) - Number(b.price));
    }

    return NextResponse.json({
      success: true,
      data: {
        workers: results.slice(0, limit),
        total: results.length,
        searchRadius: maxDistance,
        center: { lat, lng },
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trade = searchParams.get("trade") || "All";
  const lat = parseFloat(searchParams.get("lat") || "11.0168");
  const lng = parseFloat(searchParams.get("lng") || "76.9558");

  const results = await fetchRealWorkers(trade, lat, lng, 15, true);
  results.sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.dist) - Number(b.dist));

  return NextResponse.json({ success: true, data: { workers: results.slice(0, 5), total: results.length } });
}
