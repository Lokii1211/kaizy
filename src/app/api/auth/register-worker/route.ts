import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════════════════════
// POST /api/auth/register-worker
// Creates worker_profile for authenticated user
// Called from worker onboarding flow
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    const body = await req.json();

    const {
      name,
      trade,
      experience = 0,
      bio = '',
      upiId = '',
      latitude,
      longitude,
      serviceRadius = 10,
      availabilityDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      availableFrom = '08:00',
      availableTo = '20:00',
      nightAvailable = false,
      pricing = [],  // Array of { trade, problem_type, price_min, price_max }
    } = body;

    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade is required' },
        { status: 400 }
      );
    }

    // Get user ID from JWT or from phone lookup
    let userId = jwt?.sub;

    if (!userId) {
      // Fallback: if not logged in but phone provided
      const phone = body.phone;
      if (phone) {
        const { data: existing } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('phone', phone.startsWith('+91') ? phone : `+91${phone}`)
          .single();
        userId = existing?.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated. Please login first.' },
        { status: 401 }
      );
    }

    // ── 1. Update user record ──
    await supabaseAdmin
      .from('users')
      .update({
        name,
        user_type: 'worker',
      })
      .eq('id', userId);

    // ── 2. Create or update worker_profile ──
    const { error: wpError } = await supabaseAdmin
      .from('worker_profiles')
      .upsert({
        id: userId,
        trade_primary: trade,
        experience_years: experience,
        bio,
        upi_id: upiId,
        latitude: latitude || null,
        longitude: longitude || null,
        service_radius_km: serviceRadius,
        availability_days: availabilityDays,
        available_from: availableFrom,
        available_to: availableTo,
        night_available: nightAvailable,
        is_online: false,
        is_available: true,
        kaizy_score: 300,
        avg_rating: 0,
        total_jobs: 0,
        updated_at: new Date().toISOString(),
      });

    if (wpError) {
      console.error('[register-worker] worker_profile error:', wpError);
      return NextResponse.json(
        { success: false, error: 'Failed to create worker profile' },
        { status: 500 }
      );
    }

    // ── 3. Save per-problem-type pricing ──
    if (pricing.length > 0) {
      // Delete existing and re-insert
      await supabaseAdmin
        .from('worker_pricing')
        .delete()
        .eq('worker_id', userId);

      const pricingRows = pricing.map((p: { trade: string; problem_type: string; price_min: number; price_max: number }) => ({
        worker_id: userId,
        trade: p.trade,
        problem_type: p.problem_type,
        price_min: p.price_min,
        price_max: p.price_max,
      }));

      const { error: priceError } = await supabaseAdmin
        .from('worker_pricing')
        .insert(pricingRows);

      if (priceError) {
        console.error('[register-worker] pricing error:', priceError);
        // Non-fatal — profile still created
      }
    }

    return NextResponse.json({
      success: true,
      data: { userId, trade, pricingSaved: pricing.length },
    });
  } catch (error) {
    console.error('[register-worker] error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
