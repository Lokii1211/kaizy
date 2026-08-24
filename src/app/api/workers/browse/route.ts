import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ═══════════════════════════════════════════════════════
// GET /api/workers/browse
// Filters: trade, availability (now|today|tomorrow|week), sortBy (distance|rating|price), lat, lng, page, limit
// ═══════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trade = searchParams.get("trade") || "";
    const availability = searchParams.get("availability") || "now";
    const sortBy = searchParams.get("sortBy") || "distance";
    const lat = parseFloat(searchParams.get("lat") || "11.0168");
    const lng = parseFloat(searchParams.get("lng") || "76.9558");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const supabase = getSupabase();

    // Query worker profiles with users join
    let query = supabase
      .from("worker_profiles")
      .select("*, users(name, profile_photo, city)");

    if (trade && trade !== "all") {
      query = query.or(`trade_primary.eq.${trade},trade.eq.${trade}`);
    }

    if (availability === "now") {
      query = query.eq("is_online", true);
    }

    const { data: dbWorkers, error } = await query;

    if (error || !dbWorkers) {
      return NextResponse.json({ success: true, data: { workers: [], total: 0, page } });
    }

    // Process worker records & pricing
    const processed = await Promise.all(
      dbWorkers.map(async (w) => {
        const userObj = Array.isArray(w.users) ? w.users[0] : w.users;
        const wLat = Number(w.latitude) || lat;
        const wLng = Number(w.longitude) || lng;

        // Calculate Haversine distance
        const radLat1 = (Math.PI * lat) / 180;
        const radLat2 = (Math.PI * wLat) / 180;
        const theta = lng - wLng;
        const radTheta = (Math.PI * theta) / 180;
        let dist = Math.sin(radLat1) * Math.sin(radLat2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);
        dist = Math.min(1, dist);
        dist = Math.acos(dist);
        dist = (dist * 180) / Math.PI;
        dist = dist * 60 * 1.1515 * 1.609344;
        const distanceKm = Math.round(dist * 10) / 10 || 1.2;
        const etaMinutes = Math.ceil(distanceKm / 0.5) || 8;

        // Get starting price from worker_pricing
        let startingPrice = Number(w.rate_hourly) || 299;
        const { data: pricingData } = await supabase
          .from("worker_pricing")
          .select("price_min")
          .eq("worker_id", w.id)
          .order("price_min", { ascending: true })
          .limit(1);

        if (pricingData && pricingData.length > 0 && pricingData[0].price_min) {
          startingPrice = Number(pricingData[0].price_min);
        }

        const primaryTrade = w.trade_primary || w.trade || "electrician";

        // Availability text
        let availText = "Available now";
        if (!w.is_online) {
          availText = "Available today from 9:00 AM";
        }

        return {
          id: w.id,
          name: userObj?.name || "Kaizy Captain",
          photo: userObj?.profile_photo || null,
          trade: primaryTrade,
          trade_primary: primaryTrade,
          rating: Number(w.avg_rating || w.rating || 4.8),
          totalJobs: Number(w.total_jobs || w.jobs_completed || 24),
          distance: distanceKm,
          distance_km: distanceKm,
          eta: etaMinutes,
          starting_price: startingPrice,
          rate: startingPrice,
          is_online: Boolean(w.is_online),
          verified: Boolean(w.aadhaar_verified || (w.verification_lvl && w.verification_lvl >= 1)),
          top_rated: Number(w.avg_rating || 0) >= 4.8,
          avail_text: availText,
          avail_days: w.avail_days || ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
          avail_from: w.shift_start || "08:00",
          avail_to: w.shift_end || "20:00",
        };
      })
    );

    // Apply sorting
    let sorted = processed;
    if (sortBy === "distance") {
      sorted = processed.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === "rating") {
      sorted = processed.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price") {
      sorted = processed.sort((a, b) => a.starting_price - b.starting_price);
    }

    const startIdx = (page - 1) * limit;
    const paginated = sorted.slice(startIdx, startIdx + limit);

    return NextResponse.json({
      success: true,
      data: {
        workers: paginated,
        total: sorted.length,
        page,
        hasMore: startIdx + limit < sorted.length,
      },
    });
  } catch (error) {
    console.error("[api/workers/browse error]", error);
    return NextResponse.json({ success: false, error: "Failed to browse workers" }, { status: 500 });
  }
}
