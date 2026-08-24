import { NextRequest, NextResponse } from "next/server";
import { getSupabase, calculateDistance } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { createEscrowOrder } from "@/lib/razorpay";
import { sendPushNotification } from "@/lib/push-server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

// ═══════════════════════════════════════════════════════
// POST /api/dispatch/later
// Scheduled "Later" Booking Creation + Conflict Check + Razorpay Deposit + Worker FCM/WhatsApp
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      workerId,
      lat = 11.0168,
      lng = 76.9558,
      address = "Hirer Address",
      landmark = "",
      trade = "electrician",
      problemType = "General Inspection",
      description = "",
      photos = [],
      scheduledFor,
    } = body;

    if (!workerId || !scheduledFor) {
      return NextResponse.json(
        { success: false, error: "workerId and scheduledFor are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    let hirerId = body.hirerId;
    if (!hirerId) {
      const jwt = await getUserFromRequest(req.cookies);
      if (jwt?.sub) hirerId = jwt.sub;
    }

    // 1. Conflict Check: check if worker has booking within ±2 hours of scheduledFor
    const startTime = new Date(new Date(scheduledFor).getTime() - 2 * 3600000).toISOString();
    const endTime = new Date(new Date(scheduledFor).getTime() + 2 * 3600000).toISOString();

    const { count: conflictCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("worker_id", workerId)
      .not("status", "in", '("cancelled","refunded")')
      .gte("scheduled_for", startTime)
      .lte("scheduled_for", endTime);

    if (conflictCount && conflictCount > 0) {
      return NextResponse.json(
        { success: false, error: "slot_unavailable", message: "Worker already has a booking within this 2-hour window" },
        { status: 409 }
      );
    }

    // 2. Fetch worker info for distance & visit charge
    const { data: worker } = await supabase
      .from("worker_profiles")
      .select("*, users(name, phone)")
      .eq("id", workerId)
      .single();

    let distance = 1.8;
    if (worker?.latitude && worker?.longitude) {
      distance = calculateDistance(lat, lng, Number(worker.latitude), Number(worker.longitude));
    }

    // Zone logic: <3km -> 49, 3-7km -> 79, 7+km -> 119
    let visitCharge = 49;
    if (distance > 7) visitCharge = 119;
    else if (distance >= 3) visitCharge = 79;

    // 3. Create Job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        hirer_id: hirerId || null,
        trade,
        problem_type: problemType,
        description: description || `Scheduled booking: ${problemType}`,
        latitude: lat,
        longitude: lng,
        address: landmark ? `${address} (Near ${landmark})` : address,
        landmark,
        job_type: "later",
        scheduled_for: scheduledFor,
        estimated_price: body.estimatedMin || 299,
        photos,
        status: "matched",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError || !job) {
      return NextResponse.json({ success: false, error: "Failed to create scheduled job" }, { status: 500 });
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));

    // 4. Create Booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        job_id: job.id,
        hirer_id: hirerId || null,
        worker_id: workerId,
        status: "accepted",
        scheduled_for: scheduledFor,
        otp,
        visit_charge: visitCharge,
        hirer_price: body.estimatedMin || 299,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ success: false, error: "Failed to create booking" }, { status: 500 });
    }

    // 5. Create Razorpay order for visit_charge amount
    let orderId = `KON-${booking.id.slice(0, 8)}`;
    try {
      const order = await createEscrowOrder({
        bookingId: booking.id,
        amount: visitCharge,
        workerName: worker?.users?.name || "Kaizy Captain",
        hirerName: "Hirer",
        description: `Visit charge deposit for ${problemType}`,
      });
      if (order?.orderId) orderId = order.orderId;
    } catch {}

    const formattedDate = new Date(scheduledFor).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 6. Send FCM to Worker
    sendPushNotification(
      workerId,
      "📅 New Scheduled Booking",
      `New booking for ${problemType} on ${formattedDate}. Visit deposit ₹${visitCharge} reserved.`,
      `/active-job`
    ).catch(() => {});

    // 7. Send WhatsApp to Worker
    if (worker?.users?.phone) {
      sendWhatsAppNotification({
        to: worker.users.phone,
        template: "worker_assigned",
        params: {
          hirerName: "Customer",
          task: problemType,
          location: address.slice(0, 30),
          amount: String(body.estimatedMin || 299),
          date: formattedDate,
          trackingLink: `https://kaizy.app/active-job`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      orderId,
      amount: visitCharge,
      scheduledFor,
    });
  } catch (error) {
    console.error("[dispatch/later error]", error);
    return NextResponse.json({ success: false, error: "Scheduling failed" }, { status: 500 });
  }
}
