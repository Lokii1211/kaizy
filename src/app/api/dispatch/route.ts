import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ============================================================
// Kaizy — RAPIDO-STYLE DISPATCH ENGINE (Supabase-persisted)
// 3-round dispatch · 45s countdown · expanding radius
// State stored in dispatch_sessions + job_alerts tables.
// Serverless-safe: no in-memory Maps.
// ============================================================

interface WorkerMatch {
  id: string; name: string; initials: string; trade: string; tradeIcon: string;
  rating: number; jobs: number; distance: number; eta: number;
  kaizyScore: number; verified: boolean; color: string;
  lat: number; lng: number; matchScore: number;
}

const tradeIcons: Record<string, string> = {
  electrician: '⚡', electrical: '⚡', plumber: '🔧', plumbing: '🔧',
  mechanic: '🚗', ac_repair: '❄️', carpenter: '🪚', carpentry: '🪚',
  painter: '🎨', painting: '🎨', mason: '⚒️', puncture: '🛞',
};

const tradeColors: Record<string, string> = {
  electrician: '#FF6B00', electrical: '#FF6B00', plumber: '#3B8BFF', plumbing: '#3B8BFF',
  mechanic: '#8B5CF6', ac_repair: '#06B6D4', carpenter: '#10B981', carpentry: '#10B981',
  painter: '#F59E0B', painting: '#F59E0B',
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findNearbyWorkers(trade: string, lat: number, lng: number, radiusKm: number, limit: number): Promise<WorkerMatch[]> {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from('worker_profiles')
      .select('*, users(name, phone)')
      .eq('is_available', true);

    if (trade && trade !== 'all') {
      query = query.ilike('trade_primary', `%${trade}%`);
    }

    const { data: dbWorkers } = await query.limit(30);

    if (dbWorkers && dbWorkers.length > 0) {
      return dbWorkers.map((w: Record<string, unknown>) => {
        const name = String((w.users as Record<string, unknown>)?.name || 'Worker');
        const tradeName = String(w.trade_primary || 'technician').toLowerCase();
        const workerLat = Number(w.latitude || lat + (Math.random() - 0.5) * 0.02);
        const workerLng = Number(w.longitude || lng + (Math.random() - 0.5) * 0.02);
        const distance = haversine(lat, lng, workerLat, workerLng);
        const eta = Math.round(distance * 6 + 3);
        const ks = Number(w.kaizy_score || 500);
        const rating = Number(w.avg_rating || 4.0);
        const jobs = Number(w.total_jobs || 0);
        const matchScore = Math.round(
          (rating / 5) * 30 + (1 - Math.min(distance / radiusKm, 1)) * 25 +
          (ks / 800) * 20 + (w.aadhaar_verified ? 15 : 0) + Math.min(jobs / 500, 1) * 10
        );
        return {
          id: String(w.id), name,
          initials: name.split(' ').map((s: string) => s[0]).join('').toUpperCase().slice(0, 2),
          trade: tradeName, tradeIcon: tradeIcons[tradeName] || '🔧',
          rating, jobs, distance: Math.round(distance * 100) / 100, eta,
          kaizyScore: ks, verified: Boolean(w.aadhaar_verified),
          color: tradeColors[tradeName] || '#FF6B00',
          lat: workerLat, lng: workerLng, matchScore,
        };
      })
      .filter((w: WorkerMatch) => w.distance <= radiusKm)
      .sort((a: WorkerMatch, b: WorkerMatch) => b.matchScore - a.matchScore)
      .slice(0, limit);
    }
  } catch (e) { console.error('[dispatch worker query]', e); }
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const supabase = getSupabase();

    // ── START DISPATCH ──
    if (action === 'start') {
      const {
        jobId, trade,
        hirerLat = 11.0168, hirerLng = 76.9558,
        urgency = 'normal', estimatedPrice = 500,
        hirerName = '', address = '',
      } = body;

      if (!jobId) {
        return NextResponse.json({ success: false, error: 'jobId required' }, { status: 400 });
      }

      const round = 1;
      const radiusKm = (urgency === 'emergency' ? 10 : 5) * round;
      const workers = await findNearbyWorkers(trade, hirerLat, hirerLng, radiusKm, 5);
      const expiresAt = new Date(Date.now() + 45_000).toISOString();
      const sessionExpiresAt = new Date(Date.now() + 15 * 60_000).toISOString();

      // Upsert dispatch session in DB (handles restart scenario)
      await supabase.from('dispatch_sessions').upsert({
        job_id: jobId,
        trade,
        urgency,
        estimated_price: estimatedPrice,
        hirer_lat: hirerLat,
        hirer_lng: hirerLng,
        hirer_name: hirerName,
        address,
        round,
        price_bump: 0,
        status: 'searching',
        accepted_by: null,
        created_at: new Date().toISOString(),
        expires_at: sessionExpiresAt,
      }, { onConflict: 'job_id' });

      // Insert job alerts for each worker
      if (workers.length > 0) {
        await supabase.from('job_alerts').insert(
          workers.map(w => ({
            job_id: jobId,
            worker_id: w.id,
            status: 'pending',
            round,
            expires_at: expiresAt,
          }))
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          jobId, round, status: 'dispatching',
          workersNotified: workers.length,
          workers: workers.map(w => ({
            id: w.id, name: w.name, initials: w.initials,
            trade: w.trade, tradeIcon: w.tradeIcon,
            rating: w.rating, jobs: w.jobs, distance: w.distance, eta: w.eta,
            kaizyScore: w.kaizyScore, verified: w.verified, color: w.color, matchScore: w.matchScore,
          })),
          expiresAt,
          radiusKm,
          message: `Notifying ${workers.length} nearby workers...`,
        },
      });
    }

    // ── WORKER ACCEPTS ──
    if (action === 'accept') {
      const { jobId, workerId } = body;

      // Auth: if caller is authenticated as a worker, their ID must match
      const caller = await getUserFromRequest(request.cookies);
      const effectiveWorkerId = caller?.userType === 'worker' ? caller.sub : workerId;

      // Check session
      const { data: session } = await supabase
        .from('dispatch_sessions')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (!session) {
        return NextResponse.json({ success: false, error: 'Dispatch not found' }, { status: 404 });
      }
      if (session.accepted_by) {
        return NextResponse.json({ success: false, error: 'already_taken', message: 'Another worker already accepted this job' }, { status: 409 });
      }

      // Check this worker's alert
      const { data: alert } = await supabase
        .from('job_alerts')
        .select('*')
        .eq('job_id', jobId)
        .eq('worker_id', effectiveWorkerId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!alert) {
        return NextResponse.json({ success: false, error: 'alert_expired', message: 'This alert has expired' }, { status: 410 });
      }

      // Race-safe accept: update session only if still not accepted
      const { data: updated } = await supabase
        .from('dispatch_sessions')
        .update({ accepted_by: effectiveWorkerId, status: 'accepted' })
        .eq('job_id', jobId)
        .is('accepted_by', null)
        .select()
        .single();

      if (!updated) {
        return NextResponse.json({ success: false, error: 'already_taken', message: 'Another worker just accepted' }, { status: 409 });
      }

      // Mark this alert as accepted, expire others
      await supabase.from('job_alerts').update({ status: 'accepted' }).eq('id', alert.id);
      await supabase.from('job_alerts')
        .update({ status: 'expired' })
        .eq('job_id', jobId)
        .neq('worker_id', effectiveWorkerId)
        .eq('status', 'pending');

      // Fetch worker profile
      const { data: wp } = await supabase
        .from('worker_profiles')
        .select('*, users(name)')
        .eq('id', effectiveWorkerId)
        .single();

      const workerName = String((wp?.users as Record<string, unknown>)?.name || 'Worker');
      const workerRating = Number(wp?.avg_rating || 4.5);
      const workerTrade = String(wp?.trade_primary || 'technician');
      const workerLat = Number(wp?.latitude || session.hirer_lat);
      const workerLng = Number(wp?.longitude || session.hirer_lng);
      const otp = String(Math.floor(1000 + Math.random() * 9000));
      const bookingId = `BKG-${Date.now()}`;

      return NextResponse.json({
        success: true,
        data: {
          bookingId, jobId, workerId: effectiveWorkerId,
          workerName, workerRating, workerTrade, otp,
          eta: Math.round(haversine(session.hirer_lat, session.hirer_lng, workerLat, workerLng) * 6 + 3),
          status: 'accepted',
          message: `${workerName} has accepted your job!`,
        },
      });
    }

    // ── WORKER DECLINES ──
    if (action === 'decline') {
      const { jobId, workerId } = body;
      const caller = await getUserFromRequest(request.cookies);
      const effectiveWorkerId = caller?.userType === 'worker' ? caller.sub : workerId;

      await supabase
        .from('job_alerts')
        .update({ status: 'declined' })
        .eq('job_id', jobId)
        .eq('worker_id', effectiveWorkerId);

      return NextResponse.json({ success: true, message: 'Declined' });
    }

    // ── CHECK STATUS ──
    if (action === 'status') {
      const { jobId } = body;

      const { data: session } = await supabase
        .from('dispatch_sessions')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (!session) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }

      const { data: alerts } = await supabase
        .from('job_alerts')
        .select('status, round')
        .eq('job_id', jobId);

      const allAlerts = alerts || [];
      const pending = allAlerts.filter(a => a.status === 'pending').length;
      const declined = allAlerts.filter(a => a.status === 'declined').length;
      const expired = allAlerts.filter(a => a.status === 'expired').length;
      const started = new Date(session.created_at).getTime();

      return NextResponse.json({
        success: true,
        data: {
          jobId,
          round: session.round,
          acceptedBy: session.accepted_by,
          status: session.accepted_by ? 'accepted' : pending > 0 ? 'waiting' : 'round_complete',
          pending, declined, expired,
          totalNotified: allAlerts.length,
          priceBump: session.price_bump,
          elapsedSeconds: Math.round((Date.now() - started) / 1000),
        },
      });
    }

    // ── NEXT ROUND (expand radius + bump price) ──
    if (action === 'next_round') {
      const { jobId, trade, hirerLat = 11.0168, hirerLng = 76.9558, urgency = 'normal' } = body;

      const { data: session } = await supabase
        .from('dispatch_sessions')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (!session) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }
      if (session.round >= 3) {
        return NextResponse.json({
          success: false,
          error: 'max_rounds_reached',
          message: 'No workers available. Try again later or change your requirements.',
        }, { status: 200 });
      }

      const newRound = session.round + 1;
      const newPriceBump = session.price_bump + 10;
      const radiusKm = (urgency === 'emergency' ? 10 : 5) * newRound;

      // Get worker IDs already alerted
      const { data: prevAlerts } = await supabase
        .from('job_alerts')
        .select('worker_id')
        .eq('job_id', jobId);
      const prevWorkerIds = (prevAlerts || []).map(a => a.worker_id);

      const allWorkers = await findNearbyWorkers(trade || session.trade, hirerLat, hirerLng, radiusKm, 15);
      const newWorkers = allWorkers.filter(w => !prevWorkerIds.includes(w.id));

      const expiresAt = new Date(Date.now() + 45_000).toISOString();

      // Update session round + price bump
      await supabase
        .from('dispatch_sessions')
        .update({ round: newRound, price_bump: newPriceBump })
        .eq('job_id', jobId);

      // Insert new alerts
      if (newWorkers.length > 0) {
        await supabase.from('job_alerts').insert(
          newWorkers.map(w => ({
            job_id: jobId,
            worker_id: w.id,
            status: 'pending',
            round: newRound,
            expires_at: expiresAt,
          }))
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          jobId, round: newRound, status: 'dispatching',
          newWorkersNotified: newWorkers.length,
          radiusKm,
          priceBump: `+${newPriceBump}%`,
          workers: newWorkers,
          expiresAt,
          message: `Round ${newRound}: Searching ${radiusKm}km radius, +${newPriceBump}% price bump`,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('[dispatch error]', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// GET: Check dispatch status for a jobId
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ success: false, error: 'jobId required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const { data: session } = await supabase
      .from('dispatch_sessions')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const { data: alerts } = await supabase
      .from('job_alerts')
      .select('worker_id, status, round')
      .eq('job_id', jobId);

    return NextResponse.json({
      success: true,
      data: {
        jobId: session.job_id,
        round: session.round,
        acceptedBy: session.accepted_by,
        status: session.status,
        totalAlerts: (alerts || []).length,
        priceBump: session.price_bump,
      },
    });
  } catch (e) {
    console.error('[dispatch/GET error]', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
