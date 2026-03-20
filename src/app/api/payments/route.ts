import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ════════════════════════════════════════════════════════════
// PAYMENTS API — Cash on Hand (primary) + UPI + Future Online
// No Razorpay for now — direct cash/UPI between hirer & worker
// ════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Missing 'action'" }, { status: 400 });
    }

    // ═══ GET PAYMENT METHODS ═══
    if (action === "get_methods") {
      return NextResponse.json({
        success: true,
        data: {
          methods: [
            { id: "cash", name: "Cash on Hand", icon: "💵", description: "Pay the worker directly after job completion", available: true, default: true },
            { id: "upi", name: "UPI / Google Pay", icon: "📱", description: "Pay via UPI to worker's number", available: true, default: false },
            { id: "online", name: "Online Payment", icon: "💳", description: "Card / Net Banking (coming soon)", available: false, default: false },
          ],
          defaultMethod: "cash",
        },
      });
    }

    // ═══ PAY WITH CASH ═══
    if (action === "pay_cash") {
      const { bookingId, amount, workerPaid = true } = body;

      if (!bookingId || !amount) {
        return NextResponse.json({ success: false, error: "bookingId and amount required" }, { status: 400 });
      }

      // Update booking payment status in database
      await supabaseAdmin
        .from("bookings")
        .update({
          payment_method: "cash",
          payment_status: workerPaid ? "paid" : "pending",
          hirer_price: amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      return NextResponse.json({
        success: true,
        message: workerPaid
          ? `₹${amount} paid in cash to worker`
          : `₹${amount} payment pending — pay worker on completion`,
        data: {
          bookingId,
          amount,
          method: "cash",
          status: workerPaid ? "paid" : "pending",
          timestamp: new Date().toISOString(),
          receipt: `KZ-CASH-${Date.now().toString(36).toUpperCase()}`,
        },
      });
    }

    // ═══ PAY VIA UPI ═══
    if (action === "pay_upi") {
      const { bookingId, amount, workerUpi } = body;

      if (!bookingId || !amount) {
        return NextResponse.json({ success: false, error: "bookingId and amount required" }, { status: 400 });
      }

      // Generate UPI deep link
      const upiLink = `upi://pay?pa=${workerUpi || "worker@upi"}&pn=Kaizy Worker&am=${amount}&cu=INR&tn=Kaizy Job ${bookingId}`;

      await supabaseAdmin
        .from("bookings")
        .update({
          payment_method: "upi",
          payment_status: "pending",
          hirer_price: amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      return NextResponse.json({
        success: true,
        message: "UPI payment link generated",
        data: {
          bookingId, amount, method: "upi", upiLink,
          status: "pending",
          receipt: `KZ-UPI-${Date.now().toString(36).toUpperCase()}`,
        },
      });
    }

    // ═══ CONFIRM PAYMENT (worker marks as received) ═══
    if (action === "confirm_received") {
      const { bookingId } = body;

      if (!bookingId) {
        return NextResponse.json({ success: false, error: "bookingId required" }, { status: 400 });
      }

      await supabaseAdmin
        .from("bookings")
        .update({ payment_status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", bookingId);

      return NextResponse.json({
        success: true,
        message: "Payment confirmed by worker",
        data: { bookingId, status: "confirmed", confirmedAt: new Date().toISOString() },
      });
    }

    // ═══ CALCULATE PRICE BREAKDOWN ═══
    if (action === "calculate") {
      const { amount } = body;
      if (!amount) {
        return NextResponse.json({ success: false, error: "amount required" }, { status: 400 });
      }

      const platformFee = 0; // Free during launch — will introduce later
      const workerEarnings = amount - platformFee;

      return NextResponse.json({
        success: true,
        data: {
          basePrice: amount,
          platformFee,
          platformFeePercent: 0,
          workerEarnings,
          total: amount,
          note: "No platform fee during launch period! 🎉",
        },
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
