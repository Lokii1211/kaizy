import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id && id !== 'latest') {
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('status, worker_id')
        .eq('id', id)
        .single();

      return NextResponse.json({ success: true, data: data || { status: 'pending' } });
    }

    // Get latest booking
    const { data } = await supabaseAdmin
      .from('bookings')
      .select('id, status, worker_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ success: true, data: data || { status: 'pending' } });
  } catch {
    return NextResponse.json({ success: true, data: { status: 'pending' } });
  }
}

// POST — Worker updates job status through lifecycle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { job_id, booking_id, status } = body;

    const validStatuses = ["accepted", "en_route", "arrived", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const id = booking_id || job_id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Job ID required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      status,
      [`${status}_at`]: new Date().toISOString(),
    };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();

      // Calculate commission: ₹5 flat or 2% whichever higher, free under ₹250
      try {
        const { data: booking } = await supabaseAdmin
          .from("bookings")
          .select("worker_id, hirer_price, worker_price")
          .eq("id", id)
          .single();

        if (booking) {
          const jobAmount = booking.worker_price || booking.hirer_price || 0;
          let commission = 0;
          if (jobAmount >= 250) {
            commission = Math.max(5, Math.round(jobAmount * 0.02));
          }

          if (commission > 0 && booking.worker_id) {
            await supabaseAdmin.from("commission_ledger").insert({
              worker_id: booking.worker_id,
              booking_id: id,
              job_amount: jobAmount,
              commission_amount: commission,
              paid: false,
              created_at: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.error("[commission calc]", e);
      }
    }

    const { error } = await supabaseAdmin
      .from("bookings")
      .update(updateData)
      .eq("id", id);

    if (error) console.error("[status update]", error);

    return NextResponse.json({ success: true, status, message: `Status → ${status}` });
  } catch (error) {
    console.error("[booking status POST]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
