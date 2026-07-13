import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════════════════════
// GET /api/auth/me
// Returns current authenticated user from JWT
// Includes worker_profile if user is a worker
// ═══════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const jwtPayload = await getUserFromRequest(req.cookies);

    if (!jwtPayload) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabase();

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', jwtPayload.sub)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // If worker, also fetch worker profile
    let workerProfile = null;
    if (user.user_type === 'worker') {
      const { data: wp } = await supabaseAdmin
        .from('worker_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      workerProfile = wp;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        user_type: user.user_type,
        userType: user.user_type,
        profile_photo: user.profile_photo,
        language: user.language,
        created_at: user.created_at,
        is_active: user.is_active,
        // Top-level worker fields for easy access by AuthStore
        trade: workerProfile?.trade_primary || null,
        kaizy_score: workerProfile?.kaizy_score || null,
        verified: workerProfile?.aadhaar_verified || false,
        // Worker-specific nested profile
        worker_profile: workerProfile ? {
          trade_primary: workerProfile.trade_primary,
          experience_years: workerProfile.experience_years,
          is_online: workerProfile.is_online,
          avg_rating: workerProfile.avg_rating,
          total_jobs: workerProfile.total_jobs,
          kaizy_score: workerProfile.kaizy_score,
          aadhaar_verified: workerProfile.aadhaar_verified,
          upi_id: workerProfile.upi_id,
          completion_rate: workerProfile.completion_rate,
          availability_days: workerProfile.availability_days,
          available_from: workerProfile.available_from,
          available_to: workerProfile.available_to,
          night_available: workerProfile.night_available,
        } : null,
      },
    });
  } catch (error) {
    console.error('[auth/me error]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════
// PATCH /api/auth/me
// Update profile: name, email, company, language, city
// Also updates worker_profile fields when relevant
// ═══════════════════════════════════════════════════════
export async function PATCH(req: NextRequest) {
  try {
    const jwtPayload = await getUserFromRequest(req.cookies);
    if (!jwtPayload?.sub) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, email, company_name, language, city,
      // Worker-specific
      upi_id, phone_secondary,
    } = body;

    const supabaseAdmin = getSupabase();
    const userId = jwtPayload.sub;

    // Build users table update
    const userUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) userUpdate.name = name.trim() || null;
    if (email !== undefined) userUpdate.email = email.trim() || null;
    if (company_name !== undefined) userUpdate.company_name = company_name.trim() || null;
    if (language !== undefined) userUpdate.language = language;
    if (city !== undefined) userUpdate.city = city.trim() || null;
    if (phone_secondary !== undefined) userUpdate.phone_secondary = phone_secondary.trim() || null;

    if (Object.keys(userUpdate).length > 1) {
      const { error: userErr } = await supabaseAdmin
        .from('users')
        .update(userUpdate)
        .eq('id', userId);
      if (userErr) {
        console.error('[profile PATCH] users update error:', userErr);
        return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
      }
    }

    // Worker-specific updates
    if (jwtPayload.userType === 'worker' && upi_id !== undefined) {
      await supabaseAdmin
        .from('worker_profiles')
        .update({ upi_id: upi_id.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('[auth/me PATCH error]', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
