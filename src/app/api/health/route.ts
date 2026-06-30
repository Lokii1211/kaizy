import { NextResponse } from 'next/server';

// ═══════════════════════════════════════
// GET /api/health — System health check
// Shows which services are configured (not values!)
// ═══════════════════════════════════════

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    version: "6.5",
    environment: process.env.NODE_ENV,
    services: {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service: !!process.env.SUPABASE_SERVICE_KEY,
      mapbox: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      fast2sms: !!process.env.FAST2SMS_API_KEY,
      claude_api: !!process.env.CLAUDE_API_KEY,
      gupshup_api: !!process.env.GUPSHUP_API_KEY,
      gupshup_app: !!process.env.GUPSHUP_APP_NAME,
      firebase_api: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      jwt_secret: !!process.env.JWT_SECRET,
    },
  };

  // Test Supabase connection
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { count, error } = await sb.from('users').select('id', { count: 'exact', head: true });
      Object.assign(checks, {
        supabase_connected: !error,
        supabase_users_count: count || 0,
        supabase_error: error?.message || null,
      });
    }
  } catch (e) {
    Object.assign(checks, { supabase_connected: false, supabase_error: String(e) });
  }

  return NextResponse.json(checks);
}
