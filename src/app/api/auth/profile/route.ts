import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// POST /api/auth/profile — Update user profile (onboarding completion)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, preferred_services, location_type, address, landmark, emergency_preference, notify_nearby } = body;

    // Get user from auth cookie
    const tokenCookie = request.cookies.get("kaizy_token");
    if (!tokenCookie?.value) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    let userId = "";
    try {
      const payload = JSON.parse(atob(tokenCookie.value.split(".")[1]));
      userId = payload.sub || payload.userId || "";
    } catch {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "No user ID in token" }, { status: 401 });
    }

    // Update user profile
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (preferred_services) updateData.preferred_services = preferred_services;
    if (emergency_preference) updateData.emergency_preference = emergency_preference;
    if (notify_nearby !== undefined) updateData.notify_nearby = notify_nearby;

    if (Object.keys(updateData).length > 0) {
      await supabase.from("users").update(updateData).eq("id", userId);
    }

    // Save address if provided
    if (address) {
      await supabase.from("saved_locations").upsert({
        user_id: userId,
        label: "Home",
        address: address,
        landmark: landmark || "",
        location_types: location_type || [],
        is_primary: true,
      }, { onConflict: "user_id,label" });
    }

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error) {
    console.error("[profile update]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
