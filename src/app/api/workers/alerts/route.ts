import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// ═══════════════════════════════════════════════════════
// GET /api/workers/alerts
// Returns pending job alerts for the authenticated worker.
// Workers poll this every 8s to receive new job assignments.
// ═══════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.cookies);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (user.userType !== "worker") return NextResponse.json({ success: false, error: "Workers only" }, { status: 403 });

    const workerId = user.sub;
    const supabase = getSupabase();

    // Fetch pending job alerts for this worker that haven't expired
    const { data: alerts, error } = await supabase
      .from("job_alerts")
      .select(`
        id,
        job_id,
        status,
        round,
        expires_at,
        jobs (
          id,
          trade,
          problem_type,
          description,
          address,
          latitude,
          longitude,
          urgency,
          estimated_price,
          hirer_id,
          users:hirer_id (name, avg_rating)
        ),
        dispatch_sessions!job_id (
          hirer_lat,
          hirer_lng,
          hirer_name,
          address,
          estimated_price,
          price_bump
        )
      `)
      .eq("worker_id", workerId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[worker alerts]", error);
      return NextResponse.json({ success: true, data: null });
    }

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    const alert = alerts[0];
    const job = alert.jobs as unknown as Record<string, unknown> | null;
    const session = Array.isArray(alert.dispatch_sessions) ? alert.dispatch_sessions[0] : alert.dispatch_sessions as Record<string, unknown> | null;
    const hirerUser = job?.users as Record<string, unknown> | null;

    const tradeIcons: Record<string, string> = {
      electrician: "⚡", plumber: "🔧", mechanic: "🚗",
      ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
    };
    const trade = String(job?.trade || "technician").toLowerCase();

    // Get worker's current location for distance calc
    const { data: wp } = await supabase
      .from("worker_profiles")
      .select("latitude, longitude")
      .eq("id", workerId)
      .single();

    const wLat = Number(wp?.latitude || session?.hirer_lat || 11.0168);
    const wLng = Number(wp?.longitude || session?.hirer_lng || 76.9558);
    const hLat = Number(session?.hirer_lat || job?.latitude || 11.0168);
    const hLng = Number(session?.hirer_lng || job?.longitude || 76.9558);

    // Haversine distance
    const R = 6371;
    const dLat = (hLat - wLat) * Math.PI / 180;
    const dLon = (hLng - wLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(wLat * Math.PI / 180) * Math.cos(hLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const eta = Math.round(distance * 6 + 3);

    const basePrice = Number(session?.estimated_price || job?.estimated_price || 400);
    const priceBump = Number(session?.price_bump || 0);
    const earnings = Math.round(basePrice * (1 + priceBump / 100) * 0.9); // 90% worker payout

    const expiresAt = new Date(alert.expires_at).getTime();
    const secondsLeft = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));

    return NextResponse.json({
      success: true,
      data: {
        id: alert.id,
        jobId: alert.job_id,
        trade,
        tradeIcon: tradeIcons[trade] || "🔧",
        problem: String(job?.problem_type || job?.description || "Service requested").replace(/_/g, " "),
        distance: Math.round(distance * 10) / 10,
        eta,
        earnings,
        hirerRating: Number(hirerUser?.avg_rating || 4.5),
        hirerName: String(session?.hirer_name || hirerUser?.name || "Customer"),
        duration: "45-60 min",
        isEmergency: job?.urgency === "sos" || String(job?.problem_type || "").includes("emergency"),
        address: String(session?.address || job?.address || "Customer location"),
        secondsLeft,
        workerLat: wLat,
        workerLng: wLng,
        hirerLat: hLat,
        hirerLng: hLng,
      },
    });
  } catch (e) {
    console.error("[worker alerts error]", e);
    return NextResponse.json({ success: true, data: null });
  }
}
