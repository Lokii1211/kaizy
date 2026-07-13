import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════
// ADMIN STATS API — Revenue, users, bookings overview
// ═══════════════════════════════════════

const ADMIN_PHONES = process.env.ADMIN_PHONES
  ? process.env.ADMIN_PHONES.split(',').map(p => p.trim()).filter(Boolean)
  : [];

export async function GET(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    if (!jwt?.sub) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (ADMIN_PHONES.length === 0 || !ADMIN_PHONES.includes(jwt.phone)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const supabaseAdmin = getSupabase();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthStart = new Date(now.getTime() - 30 * 86400000).toISOString();

    // Parallel queries
    const [
      { count: totalUsers },
      { count: totalWorkers },
      { count: totalHirers },
      { count: onlineWorkers },
      { count: totalBookings },
      { count: todayBookings },
      { count: weekBookings },
      { count: completedBookings },
      { count: pendingBookings },
      { count: cancelledBookings },
      { data: commissionData },
      { data: recentBookings },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'worker'),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'hirer'),
      supabaseAdmin.from('worker_profiles').select('*', { count: 'exact', head: true }).eq('is_online', true),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabaseAdmin.from('commissions').select('amount, status').gte('created_at', monthStart),
      supabaseAdmin.from('bookings').select('id, status, created_at, total_amount').order('created_at', { ascending: false }).limit(10),
    ]);

    // Compute commission stats
    const commissions = commissionData || [];
    const totalCommission = commissions.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const paidCommission = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const pendingCommission = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers || 0,
          workers: totalWorkers || 0,
          hirers: totalHirers || 0,
          workersOnline: onlineWorkers || 0,
        },
        bookings: {
          total: totalBookings || 0,
          today: todayBookings || 0,
          thisWeek: weekBookings || 0,
          completed: completedBookings || 0,
          pending: pendingBookings || 0,
          cancelled: cancelledBookings || 0,
        },
        revenue: {
          totalCommission,
          paidCommission,
          pendingCommission,
          commissionPerJob: 5,
          estimatedMonthly: totalCommission,
        },
        recentBookings: recentBookings || [],
        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('[admin stats error]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
