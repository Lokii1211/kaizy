import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendPushNotification } from "@/lib/push-server";

// ═══════════════════════════════════════════════════════
// POST /api/dispatch/quote
// Worker On-Site Diagnosis Quote Submission & Price Calculation
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      bookingId,
      workerQuote = 0,
      partsCost = 0,
      diagnosisNote = "",
      beforePhotos = [],
    } = body;

    if (!bookingId || !workerQuote) {
      return NextResponse.json(
        { success: false, error: "bookingId and workerQuote are required" },
        { status: 400 }
      );
    }

    const quoteNum = Number(workerQuote);
    const partsNum = Number(partsCost) || 0;

    // Exact required calculations:
    // platformFee = Math.round((workerQuote + partsCost) * 0.10)
    // kaizyContribution = 5
    // totalAmount = workerQuote + partsCost + platformFee + 5 + 5
    // netToWorker = workerQuote + partsCost - kaizyContribution
    const platformFee = Math.round((quoteNum + partsNum) * 0.10);
    const kaizyContribution = 5;
    const totalAmount = quoteNum + partsNum + platformFee + 5 + 5;
    const netToWorker = quoteNum + partsNum - kaizyContribution;

    const supabase = getSupabase();

    // Update bookings table
    const { data: booking, error: updateErr } = await supabase
      .from("bookings")
      .update({
        worker_quote: quoteNum,
        parts_cost: partsNum,
        platform_fee: platformFee,
        total_amount: totalAmount,
        net_to_worker: netToWorker,
        worker_diagnosis: diagnosisNote,
        diagnosis_note: diagnosisNote,
        before_photos: beforePhotos,
        status: "quote_sent",
        quote_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select("*, jobs(hirer_id), worker:worker_id(name)")
      .single();

    if (updateErr || !booking) {
      console.error("[dispatch/quote error]", updateErr);
      return NextResponse.json({ success: false, error: "Failed to save quote" }, { status: 500 });
    }

    const hirerUserId = booking.hirer_id || booking.jobs?.hirer_id;
    const workerName = booking.worker?.name || "Kaizy Captain";

    // Notify hirer via FCM
    if (hirerUserId) {
      sendPushNotification(
        hirerUserId,
        `📋 ${workerName} sent an on-site quote: ₹${totalAmount}`,
        `Diagnosis: ${diagnosisNote || "Work breakdown ready"}. Tap to review and authorize.`,
        `/hirer/tracking/${bookingId}`
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      totalAmount,
      netToWorker,
      platformFee,
      workerQuote: quoteNum,
      partsCost: partsNum,
    });
  } catch (error) {
    console.error("[dispatch/quote exception]", error);
    return NextResponse.json({ success: false, error: "Quote submission failed" }, { status: 500 });
  }
}
