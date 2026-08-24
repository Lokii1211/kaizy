import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ═══════════════════════════════════════════════════════
// POST /api/dispatch/expand
// Expands dispatch search radius to 15km if no captain accepted
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. Fetch Job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    // 2. Fetch existing alerted worker IDs
    const { data: existingAlerts } = await supabase
      .from("job_alerts")
      .select("worker_id")
      .eq("job_id", jobId);

    const alreadyAlerted = new Set((existingAlerts || []).map(a => a.worker_id));

    // 3. Query wider radius (15km)
    const { data: widerWorkers } = await supabase.rpc("get_nearby_workers", {
      user_lat: Number(job.latitude) || 11.0168,
      user_lng: Number(job.longitude) || 76.9558,
      trade_filter: job.trade,
      radius_km: 15,
    });

    const newCandidates = (widerWorkers || []).filter((w: { id: string }) => !alreadyAlerted.has(w.id));

    if (newCandidates.length === 0) {
      return NextResponse.json({
        success: true,
        newlyNotified: 0,
        totalNotified: alreadyAlerted.size,
        message: "No additional captains found in 15km radius",
      });
    }

    const newExpiresAt = new Date(Date.now() + 45000).toISOString();

    const newAlerts = newCandidates.slice(0, 5).map((w: { id: string; distance_km?: number; starting_price?: number }) => ({
      job_id: jobId,
      worker_id: w.id,
      distance_km: w.distance_km || 4.2,
      payout_amount: Math.round(Number(w.starting_price || 350) * 1.3),
      expires_at: newExpiresAt,
      status: "sent",
      created_at: new Date().toISOString(),
    }));

    await supabase.from("job_alerts").insert(newAlerts);

    // Update job expires_at
    await supabase.from("jobs").update({ expires_at: newExpiresAt }).eq("id", jobId);

    return NextResponse.json({
      success: true,
      newlyNotified: newAlerts.length,
      totalNotified: alreadyAlerted.size + newAlerts.length,
      expiresAt: newExpiresAt,
    });
  } catch (error) {
    console.error("[dispatch/expand error]", error);
    return NextResponse.json({ success: false, error: "Expansion failed" }, { status: 500 });
  }
}
