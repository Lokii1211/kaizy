import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// GET /api/workers/commission — Get worker's commission ledger
export async function GET(request: NextRequest) {
  try {
    const tokenCookie = request.cookies.get("kaizy_token");
    let userId = "";
    try {
      if (tokenCookie?.value) {
        const payload = JSON.parse(atob(tokenCookie.value.split(".")[1]));
        userId = payload.sub || payload.userId || "";
      }
    } catch {}

    if (!userId) {
      // Return mock data for demo
      return NextResponse.json({
        success: true,
        data: {
          pending_amount: 19,
          paid_amount: 36,
          total_jobs: 6,
          is_blocked: false,
          entries: [
            { id: "c1", job_id: "J-4821", trade: "electrician", date: "Today, 2:30 PM", job_amount: 600, commission: 12, status: "pending" },
            { id: "c2", job_id: "J-4820", trade: "electrician", date: "Today, 11:00 AM", job_amount: 350, commission: 7, status: "pending" },
            { id: "c3", job_id: "J-4819", trade: "electrician", date: "Yesterday", job_amount: 200, commission: 5, status: "paid" },
            { id: "c4", job_id: "J-4818", trade: "electrician", date: "Yesterday", job_amount: 500, commission: 10, status: "paid" },
            { id: "c5", job_id: "J-4817", trade: "electrician", date: "28 Mar", job_amount: 800, commission: 16, status: "paid" },
            { id: "c6", job_id: "J-4816", trade: "electrician", date: "27 Mar", job_amount: 250, commission: 5, status: "paid" },
          ],
        },
      });
    }

    // Real data from Supabase
    const { data: commissions, error } = await supabase
      .from("commission_ledger")
      .select("*")
      .eq("worker_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[commission fetch]", error);
      return NextResponse.json({ success: true, data: { pending_amount: 0, paid_amount: 0, total_jobs: 0, is_blocked: false, entries: [] } });
    }

    const entries = (commissions || []).map(c => ({
      id: c.id,
      job_id: c.job_id || `J-${c.id.slice(0, 4)}`,
      trade: c.trade || "electrician",
      date: new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      job_amount: c.job_amount || 0,
      commission: c.commission_amount || 0,
      status: c.paid ? "paid" : "pending",
    }));

    const pendingAmount = entries.filter(e => e.status === "pending").reduce((s, e) => s + e.commission, 0);
    const paidAmount = entries.filter(e => e.status === "paid").reduce((s, e) => s + e.commission, 0);

    return NextResponse.json({
      success: true,
      data: {
        pending_amount: pendingAmount,
        paid_amount: paidAmount,
        total_jobs: entries.length,
        is_blocked: pendingAmount >= 50,
        entries,
      },
    });
  } catch (error) {
    console.error("[commission]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/workers/commission — Pay pending commission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "pay") {
      // In production: create Razorpay order for commission payment
      // For now: mark all pending as paid
      const tokenCookie = request.cookies.get("kaizy_token");
      let userId = "";
      try {
        if (tokenCookie?.value) {
          const payload = JSON.parse(atob(tokenCookie.value.split(".")[1]));
          userId = payload.sub || payload.userId || "";
        }
      } catch {}

      if (userId) {
        await supabase
          .from("commission_ledger")
          .update({ paid: true, paid_at: new Date().toISOString() })
          .eq("worker_id", userId)
          .eq("paid", false);
      }

      return NextResponse.json({ success: true, message: "Commission paid" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[commission pay]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
