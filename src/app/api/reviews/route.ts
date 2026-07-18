import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { rateLimits, getClientIP } from "@/lib/rateLimit";

// GET /api/reviews?workerId=xxx&limit=5 — Fetch reviews for a worker
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!workerId) {
      return NextResponse.json({ success: false, error: "workerId required" }, { status: 400 });
    }

    // Get bookings for this worker to find their reviews
    const { data: bookings } = await supabase
      .from("bookings")
      .select("job_id")
      .eq("worker_id", workerId);

    const jobIds = (bookings || []).map(b => b.job_id).filter(Boolean);

    let reviews: { rating: number; comment: string; created_at: string; reviewer_id: string; job_id: string }[] = [];
    if (jobIds.length > 0) {
      const { data } = await supabase
        .from("reviews")
        .select("rating, comment, created_at, reviewer_id, job_id")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false })
        .limit(limit);
      reviews = data || [];
    }

    // Enrich with reviewer names
    const enriched = await Promise.all(
      reviews.map(async (r) => {
        let reviewerName = "Customer";
        let area = "";
        if (r.reviewer_id) {
          const { data: reviewer } = await supabase
            .from("users")
            .select("name")
            .eq("id", r.reviewer_id)
            .single();
          if (reviewer?.name) reviewerName = reviewer.name;
        }
        // Get area from booking if available
        if (r.job_id) {
          const { data: booking } = await supabase
            .from("bookings")
            .select("address")
            .eq("job_id", r.job_id)
            .single();
          if (booking?.address) area = booking.address;
        }
        return {
          name: reviewerName,
          area: area || "Local",
          rating: r.rating,
          comment: r.comment || "",
          created_at: r.created_at,
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("[reviews GET]", error);
    return NextResponse.json({ success: true, data: [] });
  }
}

// POST /api/reviews — Submit a review after job completion
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 reviews per minute per IP
    const ip = getClientIP(request.headers);
    const rl = rateLimits.review(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json();
    const { job_id, booking_id, rating, tags, comment, tip_amount, positive_tags, negative_tags } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Invalid rating" }, { status: 400 });
    }

    // Get user from auth cookie
    const tokenCookie = request.cookies.get("kaizy_token");
    let userId = "";
    try {
      if (tokenCookie?.value) {
        const payload = JSON.parse(atob(tokenCookie.value.split(".")[1]));
        userId = payload.sub || payload.userId || "";
      }
    } catch {}

    // Save review — resolve worker_id from booking_id if available
    let resolvedWorkerId: string | null = null;
    let resolvedJobId = job_id || null;
    if (booking_id && !resolvedJobId) {
      const { data: bk } = await supabase.from("bookings").select("job_id, worker_id").eq("id", booking_id).single();
      if (bk) { resolvedJobId = bk.job_id || null; resolvedWorkerId = bk.worker_id || null; }
    }

    const { error } = await supabase.from("reviews").insert({
      job_id: resolvedJobId || null,
      booking_id: booking_id || null,
      reviewer_id: userId || null,
      worker_id: resolvedWorkerId || null,
      rating,
      tags: [...(tags || []), ...(positive_tags || []), ...(negative_tags || [])],
      comment: comment || "",
      tip_amount: tip_amount || 0,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[review insert]", error);
      // Still return success even if table doesn't exist yet
    }

    // Update worker's average rating if we have job_id or already resolved worker_id
    if (resolvedJobId || resolvedWorkerId) {
      try {
        const { data: booking } = resolvedWorkerId
          ? { data: { worker_id: resolvedWorkerId } }
          : await supabase.from("bookings").select("worker_id").eq("job_id", resolvedJobId).single();

        if (booking?.worker_id) {
          // Recalculate avg_rating from all reviews for this worker
          const { data: allReviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("worker_id", booking.worker_id);

          // Also get reviews by job_ids for this worker (legacy reviews stored by job_id)
          const { data: jobReviews } = await supabase
            .from("reviews")
            .select("rating")
            .in("job_id", (await supabase.from("bookings").select("job_id").eq("worker_id", booking.worker_id).then(r => r.data?.map(b => b.job_id).filter(Boolean) || [])));

          const combined = [...(allReviews || []), ...(jobReviews || [])];
          if (combined.length > 0) {
            const avgRating = combined.reduce((sum, r) => sum + r.rating, 0) / combined.length;
            await supabase
              .from("worker_profiles")
              .update({ avg_rating: Math.round(avgRating * 100) / 100 })
              .eq("id", booking.worker_id);
          }

          // KaizyScore adjustment based on rating
          const { data: wp } = await supabase
            .from("worker_profiles")
            .select("kaizy_score")
            .eq("id", booking.worker_id)
            .single();

          if (wp) {
            let scoreDelta = 0;
            if (rating === 5) scoreDelta = 5;
            else if (rating === 4) scoreDelta = 2;
            else if (rating <= 3) scoreDelta = -5;

            if (scoreDelta !== 0) {
              await supabase.from("worker_profiles").update({
                kaizy_score: Math.max(0, Math.min(1000, (wp.kaizy_score || 300) + scoreDelta)),
              }).eq("id", booking.worker_id);
            }
          }
        }
      } catch (e) {
        console.error("[rating update]", e);
      }
    }

    return NextResponse.json({ success: true, message: "Review submitted" });
  } catch (error) {
    console.error("[review]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
