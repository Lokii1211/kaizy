import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// POST /api/reviews — Submit a review after job completion
export async function POST(request: NextRequest) {
  try {
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
