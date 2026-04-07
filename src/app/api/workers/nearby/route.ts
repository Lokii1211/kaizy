import { NextRequest, NextResponse } from 'next/server';
import { findNearbyWorkers } from '@/lib/supabase';

// ═══════════════════════════════════════
// GET /api/workers/nearby?trade=electrician&lat=11.01&lng=76.95
// Fetch real online workers from Supabase
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trade = searchParams.get('trade') || '';
    const lat = parseFloat(searchParams.get('lat') || '11.0168');
    const lng = parseFloat(searchParams.get('lng') || '76.9558');
    const radius = parseFloat(searchParams.get('radius') || '5');
    const limit = parseInt(searchParams.get('limit') || '10');

    const workers = await findNearbyWorkers(trade, lat, lng, radius, limit);

    return NextResponse.json({
      success: true,
      data: {
        workers: workers.map(w => ({
          id: w.id,
          name: w.users?.name || 'Worker',
          phone: w.users?.phone,
          photo: w.users?.profile_photo,
          trade: w.trade_primary,
          rating: Number(w.avg_rating),
          totalJobs: w.total_jobs,
          experience: w.experience_years,
          rate: 0, // Real pricing is per-problem-type, shown on worker profile
          distance: w.distance,
          eta: w.eta,
          kaizyScore: w.kaizy_score,
          verified: w.aadhaar_verified,
          online: w.is_online,
          lat: Number(w.latitude),
          lng: Number(w.longitude),
        })),
        total: workers.length,
        center: { lat, lng },
        radius,
      },
    });
  } catch (error) {
    console.error('[workers/nearby error]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch workers' }, { status: 500 });
  }
}
