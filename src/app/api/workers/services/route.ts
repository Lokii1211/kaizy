import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workerId, trade, services } = body;

    // In production, save to Supabase workers_services table
    // For now, log and return success
    console.log("[worker-services] Saving:", { workerId, trade, servicesCount: services?.length });

    return NextResponse.json({
      success: true,
      data: {
        workerId,
        trade,
        servicesCount: services?.length || 0,
        message: "Services saved successfully",
      },
    });
  } catch (error) {
    console.error("[worker-services] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save services" }, { status: 500 });
  }
}
