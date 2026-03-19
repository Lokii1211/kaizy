import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// GET /api/workers — List/search workers from Supabase
// POST /api/workers — Register new worker
// ============================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const skill = searchParams.get("skill");
  const city = searchParams.get("city");
  const available = searchParams.get("available");
  const minRating = searchParams.get("minRating");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    let dbQuery = supabaseAdmin
      .from('worker_profiles')
      .select('*, users(name, phone, city)')
      .order('avg_rating', { ascending: false });

    if (skill) dbQuery = dbQuery.ilike('trade_primary', skill);
    if (available === "true") dbQuery = dbQuery.eq('is_available', true);
    if (minRating) dbQuery = dbQuery.gte('avg_rating', parseFloat(minRating));

    const { data: dbWorkers } = await dbQuery.range((page - 1) * limit, page * limit - 1);

    if (dbWorkers && dbWorkers.length > 0) {
      const workers = dbWorkers
        .filter((w: Record<string, unknown>) => {
          if (city) {
            const userCity = (w.users as Record<string, unknown>)?.city;
            return String(userCity || '').toLowerCase() === city.toLowerCase();
          }
          if (query) {
            const name = String((w.users as Record<string, unknown>)?.name || '').toLowerCase();
            const trade = String(w.trade_primary || '').toLowerCase();
            const q = query.toLowerCase();
            return name.includes(q) || trade.includes(q);
          }
          return true;
        })
        .map((w: Record<string, unknown>) => ({
          id: w.id,
          name: (w.users as Record<string, unknown>)?.name || 'Worker',
          phone: (w.users as Record<string, unknown>)?.phone || '',
          city: (w.users as Record<string, unknown>)?.city || '',
          skills: [w.trade_primary],
          experience: `${w.experience_years || 0}`,
          rating: w.avg_rating || 0,
          jobsCompleted: w.total_jobs || 0,
          konnectScore: w.kaizy_score || 0,
          verified: w.aadhaar_verified || false,
          available: w.is_available || false,
        }));

      return NextResponse.json({
        success: true,
        data: workers,
        pagination: { page, limit, total: workers.length, totalPages: 1 },
      });
    }

    return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
  } catch (error) {
    console.error('[workers API error]', error);
    return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
  }
}

// POST /api/workers — Register new worker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, city, skills, experience, language } = body;

    if (!name || !phone || !city || !skills?.length) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, phone, city, skills" },
        { status: 400 }
      );
    }

    // Create user in Supabase
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .insert({ name, phone, city, user_type: 'worker', language: language || 'hi' })
      .select()
      .single();

    if (userErr || !user) {
      return NextResponse.json({ success: false, error: userErr?.message || 'Failed to create user' }, { status: 500 });
    }

    // Create worker profile
    const { data: worker } = await supabaseAdmin
      .from('worker_profiles')
      .insert({
        id: user.id,
        trade_primary: skills[0],
        experience_years: parseInt(experience) || 0,
        is_available: true,
        kaizy_score: 300,
      })
      .select()
      .single();

    return NextResponse.json(
      { success: true, data: { id: user.id, ...worker }, message: "Worker registered successfully." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
