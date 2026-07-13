import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════════════════════
// Kaizy — GPS TRACKING API (Supabase-persisted)
// All tracking state lives in tracking_sessions table.
// Workers POST location updates; hirers GET via this API
// or subscribe directly via Supabase Realtime.
// ═══════════════════════════════════════════════════════

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateHeading(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(toLat * Math.PI / 180);
  const x = Math.cos(fromLat * Math.PI / 180) * Math.sin(toLat * Math.PI / 180) -
            Math.sin(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request.cookies);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;
    const supabase = getSupabase();

    // ── START TRACKING SESSION ──
    if (action === 'start') {
      const {
        bookingId,
        workerLat = 11.022, workerLng = 76.960,
        destLat = 11.0168, destLng = 76.9558,
      } = body;

      if (!bookingId) {
        return NextResponse.json({ success: false, error: 'bookingId required' }, { status: 400 });
      }

      // Worker must be authenticated — use their actual ID
      const workerId = user.userType === 'worker' ? user.sub : body.workerId;

      const dist = haversine(workerLat, workerLng, destLat, destLng);
      const eta = Math.round(dist * 6 + 3);
      const heading = calculateHeading(workerLat, workerLng, destLat, destLng);
      const otp = String(Math.floor(1000 + Math.random() * 9000));

      const { data, error } = await supabase
        .from('tracking_sessions')
        .upsert({
          booking_id: bookingId,
          worker_id: workerId,
          status: 'en_route',
          worker_lat: workerLat,
          worker_lng: workerLng,
          dest_lat: destLat,
          dest_lng: destLng,
          heading,
          speed_kmh: 0,
          eta_minutes: eta,
          otp,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'booking_id' })
        .select()
        .single();

      if (error) {
        console.error('[tracking/start]', error);
        return NextResponse.json({ success: false, error: 'Failed to start tracking' }, { status: 500 });
      }

      // Also store OTP on the booking for verify_otp step
      await supabase.from('bookings').update({ otp }).eq('id', bookingId);

      return NextResponse.json({
        success: true,
        data: {
          bookingId, status: 'en_route',
          worker: { id: workerId, lat: workerLat, lng: workerLng },
          destination: { lat: destLat, lng: destLng },
          heading, speed: 0, eta, otp,
          distanceKm: Math.round(dist * 100) / 100,
          startedAt: data.started_at,
        },
      });
    }

    // ── UPDATE WORKER GPS LOCATION ──
    if (action === 'update') {
      const { bookingId, lat, lng, speed = 0 } = body;
      if (!bookingId || lat == null || lng == null) {
        return NextResponse.json({ success: false, error: 'bookingId, lat, lng required' }, { status: 400 });
      }

      const { data: session, error: fetchErr } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (fetchErr || !session) {
        return NextResponse.json({ success: false, error: 'Tracking session not found' }, { status: 404 });
      }
      if (session.status !== 'en_route') {
        return NextResponse.json({ success: true, data: { status: session.status, message: 'Not en route' } });
      }

      const dist = haversine(lat, lng, session.dest_lat, session.dest_lng);
      const eta = Math.max(1, Math.round(dist * 6 + 1));
      const heading = calculateHeading(session.worker_lat, session.worker_lng, lat, lng);
      const arrived = dist < 0.05; // < 50 metres

      const { error: updateErr } = await supabase
        .from('tracking_sessions')
        .update({
          worker_lat: lat,
          worker_lng: lng,
          heading,
          speed_kmh: speed,
          eta_minutes: arrived ? 0 : eta,
          status: arrived ? 'arrived' : 'en_route',
          arrived_at: arrived ? new Date().toISOString() : session.arrived_at,
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);

      if (updateErr) console.error('[tracking/update]', updateErr);

      return NextResponse.json({
        success: true,
        data: {
          bookingId, status: arrived ? 'arrived' : 'en_route',
          worker: { lat, lng, heading, speed: Math.round(speed) },
          eta: arrived ? 0 : eta,
          distanceKm: Math.round(dist * 100) / 100,
          arrived,
        },
      });
    }

    // ── VERIFY JOB-START OTP ──
    if (action === 'verify_otp') {
      const { bookingId, otp } = body;

      const { data: session } = await supabase
        .from('tracking_sessions')
        .select('otp, status')
        .eq('booking_id', bookingId)
        .single();

      if (!session) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
      }
      if (session.otp !== String(otp)) {
        return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
      }

      await supabase
        .from('tracking_sessions')
        .update({ status: 'working', updated_at: new Date().toISOString() })
        .eq('booking_id', bookingId);

      return NextResponse.json({
        success: true,
        data: { bookingId, status: 'working', message: 'OTP verified. Job started!' },
      });
    }

    // ── MARK JOB COMPLETE ──
    if (action === 'complete') {
      const { bookingId } = body;

      await supabase
        .from('tracking_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('booking_id', bookingId);

      // Update booking status
      await supabase
        .from('bookings')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', bookingId);

      return NextResponse.json({
        success: true,
        data: { bookingId, status: 'completed', message: 'Job complete! Please review and release payment.' },
      });
    }

    // ── CHANGE STATUS (en_route → arrived → working, etc.) ──
    if (action === 'status') {
      const { bookingId, status } = body;
      const validStatuses = ['en_route', 'arrived', 'working', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }

      await supabase
        .from('tracking_sessions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('booking_id', bookingId);

      // Sync to bookings table too
      await supabase
        .from('bookings')
        .update({ status: status === 'working' ? 'in_progress' : status })
        .eq('id', bookingId);

      return NextResponse.json({ success: true, data: { bookingId, status } });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('[tracking error]', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// GET: Fetch current tracking state for a booking
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json({ success: false, error: 'bookingId required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const { data: session, error } = await supabase
      .from('tracking_sessions')
      .select('*, users!worker_id(name)')
      .eq('booking_id', bookingId)
      .single();

    if (error || !session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const dist = haversine(session.worker_lat, session.worker_lng, session.dest_lat, session.dest_lng);

    return NextResponse.json({
      success: true,
      data: {
        bookingId: session.booking_id,
        status: session.status,
        worker: {
          id: session.worker_id,
          name: session.users?.name || 'Worker',
          lat: session.worker_lat,
          lng: session.worker_lng,
          heading: session.heading,
          speed: session.speed_kmh,
        },
        destination: { lat: session.dest_lat, lng: session.dest_lng },
        eta: session.eta_minutes,
        otp: session.otp,
        distanceKm: Math.round(dist * 100) / 100,
        startedAt: session.started_at,
        arrivedAt: session.arrived_at,
        completedAt: session.completed_at,
        updatedAt: session.updated_at,
      },
    });
  } catch (e) {
    console.error('[tracking/GET error]', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
