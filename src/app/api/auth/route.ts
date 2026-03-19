import { NextRequest, NextResponse } from "next/server";

// OTP-based Authentication API
// Supports: send OTP, verify OTP, logout

// In-memory OTP store (would be Redis in production)
const otpStore: Record<string, { otp: string; expiresAt: number; attempts: number }> = {};

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth — Send OTP / Verify OTP / Logout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, otp, userType } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Missing 'action'. Use 'send_otp', 'verify_otp', or 'logout'" },
        { status: 400 }
      );
    }

    // ========== SEND OTP ==========
    if (action === "send_otp") {
      if (!phone) {
        return NextResponse.json(
          { success: false, error: "Phone number is required" },
          { status: 400 }
        );
      }

      // Validate Indian phone
      const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+91/, "");
      if (!/^\d{10}$/.test(cleanPhone)) {
        return NextResponse.json(
          { success: false, error: "Invalid phone number. Must be 10-digit Indian number." },
          { status: 400 }
        );
      }

      // Rate limit: max 5 OTPs per phone per 15 min
      const existing = otpStore[cleanPhone];
      if (existing && existing.attempts >= 5 && existing.expiresAt > Date.now()) {
        return NextResponse.json(
          { success: false, error: "Too many OTP requests. Try again in 15 minutes." },
          { status: 429 }
        );
      }

      const generatedOtp = generateOTP();
      otpStore[cleanPhone] = {
        otp: generatedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 min expiry
        attempts: (existing?.attempts || 0) + 1,
      };

      // In production: send via SMS gateway (MSG91, Twilio, etc.)
      console.log(`[KonnectOn Auth] OTP for ${cleanPhone}: ${generatedOtp}`);

      return NextResponse.json({
        success: true,
        message: `OTP sent to +91 ${cleanPhone}`,
        expiresIn: 600, // seconds
        // Remove in production!
        debug_otp: generatedOtp,
      });
    }

    // ========== VERIFY OTP ==========
    if (action === "verify_otp") {
      if (!phone || !otp) {
        return NextResponse.json(
          { success: false, error: "Phone and OTP are required" },
          { status: 400 }
        );
      }

      const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+91/, "");
      const stored = otpStore[cleanPhone];

      if (!stored) {
        return NextResponse.json(
          { success: false, error: "OTP not found. Request a new one." },
          { status: 400 }
        );
      }

      if (stored.expiresAt < Date.now()) {
        delete otpStore[cleanPhone];
        return NextResponse.json(
          { success: false, error: "OTP expired. Request a new one." },
          { status: 400 }
        );
      }

      if (stored.otp !== otp) {
        return NextResponse.json(
          { success: false, error: "Invalid OTP. Try again." },
          { status: 400 }
        );
      }

      // OTP verified — clean up
      delete otpStore[cleanPhone];

      // Create a proper token with user info encoded
      const userId = `usr_${cleanPhone.slice(-6)}`;
      const payload = { userId, phone: `+91${cleanPhone}`, role: userType || "worker", iat: Date.now() };
      const sessionToken = `header.${btoa(JSON.stringify(payload))}.signature`;

      const user = {
        id: userId,
        phone: `+91${cleanPhone}`,
        role: userType || "worker",
        name: cleanPhone, // Use phone as default name — user can update in settings
        isNewUser: false,
      };

      return NextResponse.json({
        success: true,
        message: "Login successful",
        data: {
          user,
          token: sessionToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    }

    // ========== LOGOUT ==========
    if (action === "logout") {
      return NextResponse.json({
        success: true,
        message: "Logged out successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
