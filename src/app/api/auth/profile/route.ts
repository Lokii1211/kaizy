import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/auth/profile — Update user profile (onboarding completion)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, preferred_services, location_type, address, landmark, emergency_preference, notify_nearby,
            availability_days, available_from, available_to, night_available } = body;

    const jwt = await getUserFromRequest(request.cookies);
    if (!jwt?.sub) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    const userId = jwt.sub;

    // Update user profile
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (preferred_services) updateData.preferred_services = preferred_services;
    if (emergency_preference) updateData.emergency_preference = emergency_preference;
    if (notify_nearby !== undefined) updateData.notify_nearby = notify_nearby;

    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin.from("users").update(updateData).eq("id", userId);
    }

    // Save address if provided
    if (address) {
      await supabaseAdmin.from("saved_locations").upsert({
        user_id: userId,
        label: landmark || "Home",
        address: address,
        landmark: landmark || "",
        location_types: location_type || [],
        is_primary: true,
      }, { onConflict: "user_id,label" });
    }

    // Update worker schedule if provided
    if (availability_days || available_from || available_to || night_available !== undefined) {
      const scheduleData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (availability_days) scheduleData.availability_days = availability_days;
      if (available_from) scheduleData.available_from = available_from;
      if (available_to) scheduleData.available_to = available_to;
      if (night_available !== undefined) scheduleData.night_available = night_available;

      const { error: wpError } = await supabaseAdmin
        .from("worker_profiles")
        .update(scheduleData)
        .eq("id", userId);

      if (wpError) {
        console.error("[profile update] worker schedule error:", wpError);
        return NextResponse.json({ success: false, error: "Failed to update schedule" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error) {
    console.error("[profile update]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
