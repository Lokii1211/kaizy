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
    const { trade, services } = body;

    if (!trade || !services?.length) {
      return NextResponse.json({ success: false, error: "Trade and services required" }, { status: 400 });
    }

    await supabaseAdmin
      .from("worker_pricing")
      .delete()
      .eq("worker_id", jwt.sub)
      .eq("trade", trade);

    const rows = services.map((s: { problem_type: string; price_min: number; price_max: number }) => ({
      worker_id: jwt.sub,
      trade,
      problem_type: s.problem_type,
      price_min: s.price_min,
      price_max: s.price_max,
    }));

    const { error } = await supabaseAdmin.from("worker_pricing").insert(rows);

    if (error) {
      console.error("[worker-services]", error);
      return NextResponse.json({ success: false, error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { servicesCount: rows.length, message: "Services saved successfully" },
    });
  } catch (error) {
    console.error("[worker-services]", error);
    return NextResponse.json({ success: false, error: "Failed to save services" }, { status: 500 });
  }
}
