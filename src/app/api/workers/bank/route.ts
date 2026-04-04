import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workerId, paymentMethod, upiId, bankAccount } = body;

    console.log("[worker-bank] Saving:", { workerId, paymentMethod, upiId: upiId ? "***" : undefined });

    return NextResponse.json({
      success: true,
      data: {
        workerId,
        paymentMethod,
        message: "Payment details saved successfully",
      },
    });
  } catch (error) {
    console.error("[worker-bank] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save payment info" }, { status: 500 });
  }
}
