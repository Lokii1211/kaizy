import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// ═══════════════════════════════════════════════════════
// POST /api/dispatch/sos
// Emergency instant dispatch to nearest online captains
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      lat = 11.0168,
      lng = 76.9558,
      address = "Emergency Location",
      problemType = "power_failure",
      trade = "electrician",
    } = body;

    const supabase = getSupabase();

    // Get current hirer ID from JWT or body
    let hirerId = body.hirerId;
    if (!hirerId) {
      const jwt = await getUserFromRequest(req.cookies);
      if (jwt?.sub) hirerId = jwt.sub;
    }

    const expiresAt = new Date(Date.now() + 45000).toISOString(); // 45s countdown

    // 1. Insert Emergency Job into `jobs` table
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        hirer_id: hirerId || null,
        trade: trade,
        problem_type: problemType,
        description: `EMERGENCY SOS: ${problemType.replace(/_/g, " ")}`,
        latitude: lat,
        longitude: lng,
        address: address,
        job_type: "sos",
        urgency: "emergency",
        status: "searching",
        estimated_price: 350,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error("[dispatch/sos create job error]", jobError);
      return NextResponse.json(
        { success: false, error: "Failed to create emergency dispatch" },
        { status: 500 }
      );
    }

    // 2. Query nearest online workers
    const { data: rpcWorkers } = await supabase.rpc("get_nearby_workers", {
      user_lat: lat,
      user_lng: lng,
      trade_filter: trade,
      radius_km: 8,
    });

    let targetWorkers = rpcWorkers || [];

    // Fallback if RPC returns nothing
    if (targetWorkers.length === 0) {
      const { data: fallbackWorkers } = await supabase
        .from("worker_profiles")
        .select("id, latitude, longitude, rate_hourly, is_online")
        .eq("is_online", true)
        .or(`trade_primary.eq.${trade},trade.eq.${trade}`)
        .limit(5);

      if (fallbackWorkers && fallbackWorkers.length > 0) {
        targetWorkers = fallbackWorkers.map(w => ({
          id: w.id,
          distance_km: 2.1,
          starting_price: w.rate_hourly || 350,
        }));
      }
    }

    // 3. Handle No Workers Found
    if (targetWorkers.length === 0) {
      await supabase
        .from("jobs")
        .update({ status: "no_workers" })
        .eq("id", job.id);

      return NextResponse.json({
        success: true,
        jobId: job.id,
        workersNotified: 0,
        status: "no_workers",
      });
    }

    // 4. Create job_alerts for top matched workers
    const alertRows = targetWorkers.slice(0, 5).map((w: { id: string; distance_km?: number; starting_price?: number }) => ({
      job_id: job.id,
      worker_id: w.id,
      distance_km: w.distance_km || 1.8,
      payout_amount: Math.round(Number(w.starting_price || 350) * 1.25), // Emergency premium
      expires_at: expiresAt,
      status: "sent",
      created_at: new Date().toISOString(),
    }));

    const { error: alertError } = await supabase.from("job_alerts").insert(alertRows);
    if (alertError) {
      console.error("[dispatch/sos job_alerts error]", alertError);
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      workersNotified: alertRows.length,
      status: "searching",
      expiresAt,
    });
  } catch (error) {
    console.error("[dispatch/sos error]", error);
    return NextResponse.json(
      { success: false, error: "Internal dispatch error" },
      { status: 500 }
    );
  }
}
