import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    if (!jwt?.sub) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { upiId } = body;

    if (!upiId || !upiId.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid UPI ID required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("worker_profiles")
      .update({ upi_id: upiId, updated_at: new Date().toISOString() })
      .eq("id", jwt.sub);

    if (error) {
      console.error("[worker-bank]", error);
      return NextResponse.json({ success: false, error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { message: "Payment details saved successfully" },
    });
  } catch (error) {
    console.error("[worker-bank]", error);
    return NextResponse.json({ success: false, error: "Failed to save payment info" }, { status: 500 });
  }
}
