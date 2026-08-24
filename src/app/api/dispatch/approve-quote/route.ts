import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { createEscrowOrder } from "@/lib/razorpay";
import { sendPushNotification } from "@/lib/push-server";

// ═══════════════════════════════════════════════════════
// POST /api/dispatch/approve-quote
// Hirer Authorizes Quote -> Generates Razorpay Order for Remaining Balance
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "bookingId is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. Fetch booking total_amount and visit_charge
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("*, worker:worker_id(name), jobs(trade)")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const totalAmount = Number(booking.total_amount) || Number(booking.total_quoted) || 350;
    const visitCharge = Number(booking.visit_charge) || 49;
    const remaining = Math.max(0, totalAmount - visitCharge);

    // 2. Create Razorpay order for remaining balance
    let orderId = `KON-REM-${booking.id.slice(0, 8)}`;
    try {
      const order = await createEscrowOrder({
        bookingId: booking.id,
        amount: remaining,
        workerName: booking.worker?.name || "Kaizy Captain",
        hirerName: "Customer",
        description: `Remaining balance for ${booking.jobs?.trade || "service"}`,
      });
      if (order?.orderId) orderId = order.orderId;
    } catch {}

    const nowIso = new Date().toISOString();

    // 3. Update bookings record
    await supabase
      .from("bookings")
      .update({
        status: "quote_approved",
        quote_approved_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", bookingId);

    // 4. Notify Worker that quote has been approved & work can begin
    if (booking.worker_id) {
      sendPushNotification(
        booking.worker_id,
        `✅ Quote Approved by Customer!`,
        `The customer approved your ₹${totalAmount} quote. You can now begin work.`,
        `/active-job`
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount: remaining,
      totalAmount,
      visitCharge,
    });
  } catch (error) {
    console.error("[dispatch/approve-quote error]", error);
    return NextResponse.json({ success: false, error: "Approval failed" }, { status: 500 });
  }
}
