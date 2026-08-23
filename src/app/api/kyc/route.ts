import { NextRequest, NextResponse } from "next/server";
import { initiateAadhaarOTP, verifyAadhaarOTP, pullDigiLockerCerts, verifyFaceMatch } from "@/lib/aadhaar";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/kyc — Aadhaar verification, DigiLocker certs, face match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Missing 'action'" }, { status: 400 });
    }

    // ========== INITIATE AADHAAR OTP ==========
    if (action === "initiate_aadhaar") {
      const { aadhaarNumber } = body;
      if (!aadhaarNumber) {
        return NextResponse.json({ success: false, error: "aadhaarNumber required" }, { status: 400 });
      }

      const result = await initiateAadhaarOTP(aadhaarNumber);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "OTP sent to Aadhaar-linked mobile number",
        data: { requestId: result.requestId },
      });
    }

    // ========== VERIFY AADHAAR OTP ==========
    if (action === "verify_aadhaar") {
      const { requestId, otp } = body;
      if (!requestId || !otp) {
        return NextResponse.json({ success: false, error: "requestId and otp required" }, { status: 400 });
      }

      const result = await verifyAadhaarOTP(requestId, otp);
      if (!result.verified) {
        return NextResponse.json({ success: false, error: result.error || "Verification failed" }, { status: 400 });
      }

      // Persist verification to database if user is authenticated
      const jwtUser = await getUserFromRequest(request.cookies);
      if (jwtUser?.sub) {
        await supabaseAdmin.from('worker_profiles').update({
          aadhaar_verified: true,
          aadhaar_number: result.maskedAadhaar,
        }).eq('id', jwtUser.sub);

        await supabaseAdmin.from('users').update({
          verified: true,
        }).eq('id', jwtUser.sub);
      }

      return NextResponse.json({
        success: true,
        message: "Aadhaar verified successfully ✅",
        data: {
          verified: true,
          name: result.name,
          maskedAadhaar: result.maskedAadhaar,
          address: result.address,
        },
      });
    }

    // ========== PULL DIGILOCKER CERTIFICATES ==========
    if (action === "pull_certificates") {
      const { accessToken } = body;
      const result = await pullDigiLockerCerts(accessToken || "mock_token");

      return NextResponse.json({
        success: true,
        message: `Found ${result.certificates.length} certificate(s)`,
        data: { certificates: result.certificates },
      });
    }

    // ========== FACE MATCH ==========
    if (action === "face_match") {
      const { selfieBase64, aadhaarPhotoBase64 } = body;
      if (!selfieBase64) {
        return NextResponse.json({ success: false, error: "selfieBase64 required" }, { status: 400 });
      }

      const result = await verifyFaceMatch(selfieBase64, aadhaarPhotoBase64 || "");

      return NextResponse.json({
        success: true,
        data: {
          matched: result.matched,
          matchScore: result.matchScore,
          message: result.matched ? "Face match successful ✅" : "Face match failed. Please try again.",
        },
      });
    }

    // ========== WEEKLY LIVENESS RECORD ==========
    if (action === "weekly_liveness" || body.type === "weekly_liveness") {
      const jwtUser = await getUserFromRequest(request.cookies);
      const targetWorkerId = jwtUser?.sub || body.workerId;

      if (targetWorkerId) {
        await supabaseAdmin.from('worker_profiles').update({
          last_liveness_verified_at: new Date().toISOString(),
        }).eq('id', targetWorkerId);
      }

      return NextResponse.json({
        success: true,
        message: "Weekly liveness verified successfully ✅",
        data: { verifiedAt: new Date().toISOString() },
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
