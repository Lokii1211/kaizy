import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, calculateDistance } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const hirerLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const hirerLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;

    // 1. Fetch worker profile joined with users
    const { data: worker, error: workerError } = await supabaseAdmin
      .from('worker_profiles')
      .select('*, users(id, name, phone, city, profile_photo)')
      .eq('id', id)
      .single();

    if (workerError || !worker) {
      return NextResponse.json({ success: false, error: 'Worker not found' }, { status: 404 });
    }

    // 2. Fetch services from worker_pricing joined with market_pricing for display names
    let services: { id: string; name: string; price: number; unit: string }[] = [];
    try {
      const { data: pricing } = await supabaseAdmin
        .from('worker_pricing')
        .select('id, trade, problem_type, price_min, price_max')
        .eq('worker_id', id);

      if (pricing && pricing.length > 0) {
        // Get display names from market_pricing
        const problemTypes = pricing.map(p => p.problem_type).filter(Boolean);
        let displayNames: Record<string, string> = {};

        if (problemTypes.length > 0) {
          const { data: marketData } = await supabaseAdmin
            .from('market_pricing')
            .select('problem_type, display_name')
            .in('problem_type', problemTypes);

          if (marketData) {
            displayNames = Object.fromEntries(
              marketData.map(m => [m.problem_type, m.display_name])
            );
          }
        }

        services = pricing.map(p => ({
          id: p.id || p.problem_type,
          name: displayNames[p.problem_type] || p.problem_type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Service',
          price: p.price_min || 0,
          unit: 'per job',
        }));
      }
    } catch (e) {
      console.error('[worker services]', e);
    }

    // 3. Fetch reviews via bookings -> reviews -> users
    let reviews: { id: string; name: string; rating: number; comment: string; date: string; tags: string[] }[] = [];
    try {
      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('job_id')
        .eq('worker_id', id);

      const jobIds = (bookings || []).map(b => b.job_id).filter(Boolean);

      if (jobIds.length > 0) {
        const { data: rawReviews } = await supabaseAdmin
          .from('reviews')
          .select('id, rating, comment, tags, created_at, reviewer_id')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (rawReviews && rawReviews.length > 0) {
          reviews = await Promise.all(
            rawReviews.map(async (r) => {
              let reviewerName = 'Customer';
              if (r.reviewer_id) {
                const { data: reviewer } = await supabaseAdmin
                  .from('users')
                  .select('name')
                  .eq('id', r.reviewer_id)
                  .single();
                if (reviewer?.name) reviewerName = reviewer.name;
              }

              // Format relative date
              const createdAt = new Date(r.created_at);
              const now = new Date();
              const diffMs = now.getTime() - createdAt.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              let dateLabel = 'Recently';
              if (diffDays === 0) dateLabel = 'Today';
              else if (diffDays === 1) dateLabel = '1 day ago';
              else if (diffDays < 7) dateLabel = `${diffDays} days ago`;
              else if (diffDays < 14) dateLabel = '1 week ago';
              else if (diffDays < 30) dateLabel = `${Math.floor(diffDays / 7)} weeks ago`;
              else if (diffDays < 60) dateLabel = '1 month ago';
              else dateLabel = `${Math.floor(diffDays / 30)} months ago`;

              return {
                id: r.id || `r-${r.reviewer_id}-${r.created_at}`,
                name: reviewerName,
                rating: r.rating,
                comment: r.comment || '',
                date: dateLabel,
                tags: r.tags || [],
              };
            })
          );
        }
      }
    } catch (e) {
      console.error('[worker reviews]', e);
    }

    // 4. Calculate distance if hirer coordinates are provided
    let distance = 0;
    if (hirerLat !== null && hirerLng !== null && worker.latitude && worker.longitude) {
      distance = calculateDistance(hirerLat, hirerLng, Number(worker.latitude), Number(worker.longitude));
    }

    // 5. Format response to match expected structure
    const formatted = {
      id: worker.id,
      name: worker.users?.name || 'Worker',
      trade: worker.trade_primary || '',
      experience: worker.experience_years || 0,
      rating: Number(worker.avg_rating) || 0,
      jobs_done: worker.total_jobs || 0,
      completion_rate: worker.completion_rate ?? 95,
      verified: worker.aadhaar_verified || false,
      kaizy_score: worker.kaizy_score || 0,
      is_online: worker.is_online || false,
      available_from: worker.is_online ? 'Available now' : 'Offline',
      distance,
      services,
      reviews,
      photos: worker.photos || [],
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[worker profile error]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch worker' }, { status: 500 });
  }
}
