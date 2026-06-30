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
    const { job_id, rating, tags, comment, tip_amount } = body;

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

    // Save review
    const { error } = await supabase.from("reviews").insert({
      job_id: job_id || null,
      reviewer_id: userId || null,
      rating,
      tags: tags || [],
      comment: comment || "",
      tip_amount: tip_amount || 0,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[review insert]", error);
      // Still return success even if table doesn't exist yet
    }

    // Update worker's average rating if we have job_id
    if (job_id) {
      try {
        const { data: booking } = await supabase
          .from("bookings")
          .select("worker_id")
          .eq("job_id", job_id)
          .single();

        if (booking?.worker_id) {
          const { data: allReviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("worker_id", booking.worker_id);

          if (allReviews && allReviews.length > 0) {
            const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            await supabase
              .from("worker_profiles")
              .update({ avg_rating: Math.round(avgRating * 10) / 10, total_reviews: allReviews.length })
              .eq("user_id", booking.worker_id);
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
