import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════════════════════
// GET /api/auth/me
// Returns current authenticated user from JWT
// Includes worker_profile if user is a worker
// ═══════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    // Verify JWT from cookie
    const jwtPayload = await getUserFromRequest(req.cookies);

    if (!jwtPayload) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch full user from database
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
        profile_photo: user.profile_photo,
        language: user.language,
        created_at: user.created_at,
        is_active: user.is_active,
        // Worker-specific
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
