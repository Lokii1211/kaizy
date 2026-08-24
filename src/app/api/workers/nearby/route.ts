import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// ═══════════════════════════════════════════════════════
// GET /api/workers/nearby
// Invokes get_nearby_workers RPC with real distances & pricing
// ═══════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trade = searchParams.get('trade') || null;
    const lat = parseFloat(searchParams.get('lat') || '11.0168');
    const lng = parseFloat(searchParams.get('lng') || '76.9558');
    const radius = parseInt(searchParams.get('radius') || '20', 10);

    const supabase = getSupabase();

    // 1. Try get_nearby_workers RPC first
    const { data: rpcWorkers, error: rpcError } = await supabase.rpc('get_nearby_workers', {
      user_lat: lat,
      user_lng: lng,
      trade_filter: trade || null,
      radius_km: radius,
    });

    if (!rpcError && rpcWorkers) {
      return NextResponse.json({
        success: true,
        data: {
          workers: rpcWorkers.map((w: {
            id: string;
            name: string;
            profile_photo: string | null;
            trade_primary: string;
            avg_rating: number;
            total_jobs: number;
            verification_lvl: number;
            is_online: boolean;
            upi_id: string | null;
            starting_price: number;
            cheapest_service: string;
            distance_km: number;
            eta_minutes: number;
            latitude: number;
            longitude: number;
          }) => ({
            id: w.id,
            name: w.name || 'Kaizy Captain',
            profile_photo: w.profile_photo,
            trade: w.trade_primary || 'electrician',
            trade_primary: w.trade_primary || 'electrician',
            rating: Number(w.avg_rating) || 4.8,
            totalJobs: Number(w.total_jobs) || 0,
            verification_lvl: Number(w.verification_lvl) || 1,
            verified: (w.verification_lvl || 1) >= 1,
            is_online: w.is_online,
            rate: Number(w.starting_price) || 199,
            starting_price: Number(w.starting_price) || 199,
            cheapest_service: w.cheapest_service || 'General Service',
            distance: Number(w.distance_km) || 1.2,
            distance_km: Number(w.distance_km) || 1.2,
            eta: Number(w.eta_minutes) || 8,
            eta_minutes: Number(w.eta_minutes) || 8,
            lat: Number(w.latitude) || lat,
            lng: Number(w.longitude) || lng,
          })),
          total: rpcWorkers.length,
          center: { lat, lng },
        },
      });
    }

    // 2. Fallback direct query if RPC not yet compiled
    let query = supabase
      .from('worker_profiles')
      .select('*, users(name, profile_photo)')
      .eq('is_online', true);

    if (trade) {
      query = query.or(`trade_primary.eq.${trade},trade.eq.${trade}`);
    }

    const { data: dbWorkers, error: dbError } = await query.limit(20);

    if (dbError || !dbWorkers) {
      return NextResponse.json({
        success: true,
        data: { workers: [], total: 0, center: { lat, lng } },
      });
    }

    const processed = dbWorkers.map(w => {
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
      const distKm = Math.round(dist * 10) / 10 || 1.2;
      const eta = Math.ceil(distKm / 0.5) || 8;

      const userObj = Array.isArray(w.users) ? w.users[0] : w.users;

      return {
        id: w.id,
        name: userObj?.name || 'Kaizy Captain',
        profile_photo: userObj?.profile_photo,
        trade: w.trade_primary || w.trade || 'electrician',
        trade_primary: w.trade_primary || w.trade || 'electrician',
        rating: Number(w.avg_rating || w.rating || 4.8),
        totalJobs: Number(w.total_jobs || w.jobs_completed || 0),
        verification_lvl: Number(w.verification_lvl || 1),
        verified: (w.verification_lvl || 1) >= 1,
        is_online: w.is_online ?? true,
        rate: Number(w.rate_hourly || 199),
        starting_price: Number(w.rate_hourly || 199),
        cheapest_service: 'General Service',
        distance: distKm,
        distance_km: distKm,
        eta,
        eta_minutes: eta,
        lat: wLat,
        lng: wLng,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        workers: processed,
        total: processed.length,
        center: { lat, lng },
      },
    });
  } catch (error) {
    console.error('[workers/nearby exception]', error);
    return NextResponse.json({
      success: true,
      data: { workers: [], total: 0, center: { lat: 11.0168, lng: 76.9558 } },
    });
  }
}
