import { NextRequest, NextResponse } from "next/server";
import { createEscrowOrder, verifyPaymentSignature, calculateEscrow, initiateWorkerPayout } from "@/lib/razorpay";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// POST /api/payments — Create order, verify payment, release payout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Missing 'action'" }, { status: 400 });
    }

    // ========== CREATE ESCROW ORDER ==========
    if (action === "create_order") {
      const { bookingId, amount, workerName, hirerName, description } = body;

      if (!bookingId || !amount) {
        return NextResponse.json({ success: false, error: "bookingId and amount required" }, { status: 400 });
      }

      const escrow = calculateEscrow(amount);
      const order = await createEscrowOrder({
        bookingId,
        amount: escrow.totalPayable,
        workerName: workerName || "Worker",
        hirerName: hirerName || "Hirer",
        description: description || "Service booking",
      });

      return NextResponse.json({
        success: true,
        data: {
          order,
          escrowBreakdown: escrow,
        },
      });
    }

    // ========== VERIFY PAYMENT ==========
    if (action === "verify_payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ success: false, error: "Payment verification params required" }, { status: 400 });
      }

      const isValid = verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

      if (!isValid) {
        return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 });
      }

      // In production: Update booking escrow_status → 'funded' in Supabase
      console.log(`[Payment] Verified for booking ${bookingId}: ${razorpay_payment_id}`);

      // Send WhatsApp confirmation to hirer
      await sendWhatsAppMessage({
        to: body.hirerPhone || "+919876500001",
        template: "booking_confirmed",
        params: {
          workerName: body.workerName || "Worker",
          service: body.service || "Service",
          date: body.date || "Today",
          amount: String(body.amount || 0),
          workerPhone: body.workerPhone || "",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully. Funds held in escrow.",
        data: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          escrowStatus: "funded",
          bookingId,
        },
      });
    }

    // ========== RELEASE PAYOUT TO WORKER ==========
    if (action === "release_payout") {
      const { bookingId, workerId, amount, upiId } = body;

      if (!bookingId || !workerId || !amount || !upiId) {
        return NextResponse.json({ success: false, error: "bookingId, workerId, amount, upiId required" }, { status: 400 });
      }

      const payout = await initiateWorkerPayout({ workerId, amount, upiId, bookingId });

      // Send WhatsApp payment notification to worker
      await sendWhatsAppMessage({
        to: body.workerPhone || "+919876543210",
        template: "payment_received",
        params: {
          amount: String(amount),
          upiId,
          jobTitle: body.jobTitle || "Service",
          rating: String(body.rating || "5.0"),
          score: String(body.konnectScore || "780"),
        },
      });

      return NextResponse.json({
        success: true,
        message: `₹${amount} payout initiated to ${upiId}`,
        data: payout,
      });
    }

    // ========== CALCULATE ESCROW ==========
    if (action === "calculate") {
      const { amount } = body;
      if (!amount) {
        return NextResponse.json({ success: false, error: "amount required" }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: calculateEscrow(amount) });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
