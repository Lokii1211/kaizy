import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { sendPushNotification } from "@/lib/push-server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

// ═══════════════════════════════════════════════════════
// POST /api/dispatch/sos
// Ultra-fast SOS Dispatch Engine (Sub-3s Execution)
// ═══════════════════════════════════════════════════════

const tradeMap: Record<string, string> = {
  power_failure: "electrician",
  switchboard_sparking: "electrician",
  fan_smoke: "electrician",
  pipe_burst: "plumber",
  water_leakage: "plumber",
  drain_overflow: "plumber",
  vehicle_breakdown: "mechanic",
  battery_dead: "mechanic",
  tyre_puncture: "mechanic",
  ac_emergency: "ac_repair",
  ac_gas_leak: "ac_repair",
  lock_broken: "locksmith",
  lockout: "locksmith",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      lat,
      lng,
      address = "Emergency Location",
      problemType = "power_failure",
      workerId = null,
    } = body;

    // 1. Validate request
    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { success: false, error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    let hirerId = body.hirerId;
    if (!hirerId) {
      const jwt = await getUserFromRequest(req.cookies);
      if (jwt?.sub) hirerId = jwt.sub;
    }

    // 2. Map problemType to trade
    const trade = body.trade || tradeMap[problemType] || "electrician";

    // 3. Get emergency pricing
    const { data: pricingData } = await supabase
      .from("market_pricing")
      .select("*")
      .eq("problem_type", problemType)
      .maybeSingle();

    const estimatedPrice = pricingData?.price_min ? Math.round(Number(pricingData.price_min) * 1.25) : 350;
    const expiresAt = new Date(Date.now() + 45000).toISOString();

    // 4. Create Job Record
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        hirer_id: hirerId || null,
        trade,
        problem_type: problemType,
        description: `EMERGENCY SOS: ${problemType.replace(/_/g, " ")}`,
        latitude: lat,
        longitude: lng,
        address,
        job_type: "sos",
        urgency: "emergency",
        status: "searching",
        estimated_price: estimatedPrice,
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

    // 5. Find nearby online workers (radius 15km for SOS)
    const { data: rpcWorkers } = await supabase.rpc("get_nearby_workers", {
      user_lat: lat,
      user_lng: lng,
      trade_filter: trade,
      radius_km: 15,
    });

    let targetWorkers = rpcWorkers || [];

    // If a specific worker was pre-selected, prioritize them
    if (workerId) {
      const specific = targetWorkers.find((w: { id: string }) => w.id === workerId);
      if (specific) {
        targetWorkers = [specific, ...targetWorkers.filter((w: { id: string }) => w.id !== workerId)];
      }
    }

    // Fallback if RPC returned 0
    if (targetWorkers.length === 0) {
      const { data: fallback } = await supabase
        .from("worker_profiles")
        .select("id, latitude, longitude, rate_hourly, is_online")
        .eq("is_online", true)
        .or(`trade_primary.eq.${trade},trade.eq.${trade}`)
        .limit(5);

      if (fallback && fallback.length > 0) {
        targetWorkers = fallback.map((w) => ({
          id: w.id,
          distance_km: 2.1,
          starting_price: w.rate_hourly || estimatedPrice,
        }));
      }
    }

    // 6. Handle no workers available
    if (targetWorkers.length === 0) {
      await supabase.from("jobs").update({ status: "no_workers" }).eq("id", job.id);
      return NextResponse.json({
        success: true,
        status: "no_workers",
        jobId: job.id,
        workersNotified: 0,
      });
    }

    // 7. Calculate visit charge by distance
    const nearestDist = targetWorkers[0]?.distance_km || 1.5;
    let visitCharge = 49;
    if (nearestDist > 7) visitCharge = 119;
    else if (nearestDist >= 3) visitCharge = 79;

    // 8. INSERT job_alerts for all workers in parallel
    const alertRows = targetWorkers.slice(0, 8).map((w: { id: string; distance_km?: number; starting_price?: number }) => ({
      job_id: job.id,
      worker_id: w.id,
      distance_km: w.distance_km || nearestDist,
      payout_amount: Math.round(Number(w.starting_price || estimatedPrice) * 1.25),
      expires_at: expiresAt,
      status: "sent",
      created_at: new Date().toISOString(),
    }));

    await supabase.from("job_alerts").insert(alertRows);

    // 9. Send FCM Push to all workers (Promise.allSettled)
    const fcmPromises = alertRows.map((a: { worker_id: string; payout_amount: number }) =>
      sendPushNotification(
        a.worker_id,
        "🚨 EMERGENCY JOB ALERT!",
        `New ${trade.toUpperCase()} request near you. Estimated Payout: ₹${a.payout_amount}. Tap to respond in 45s.`,
        `/active-job`
      )
    );
    Promise.allSettled(fcmPromises).catch(() => {});

    // 10. Send WhatsApp to first 5 workers (async, non-blocking)
    (async () => {
      try {
        const top5WorkerIds = alertRows.slice(0, 5).map((a: { worker_id: string }) => a.worker_id);
        const { data: users } = await supabase
          .from("users")
          .select("phone")
          .in("id", top5WorkerIds);

        if (users) {
          users.forEach((u) => {
            if (u.phone) {
              sendWhatsAppNotification({
                to: u.phone,
                template: "emergency_alert",
                params: {
                  category: problemType.replace(/_/g, " "),
                  location: address.slice(0, 30),
                  hirerName: "Customer",
                  amount: String(estimatedPrice),
                },
              }).catch(() => {});
            }
          });
        }
      } catch {}
    })();

    // 11. Return response
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: "searching",
      workersNotified: alertRows.length,
      estimatedWait: 45,
      visitCharge,
    });
  } catch (error) {
    console.error("[dispatch/sos error]", error);
    return NextResponse.json(
      { success: false, error: "Internal SOS dispatch error" },
      { status: 500 }
    );
  }
}
