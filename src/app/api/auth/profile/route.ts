import { NextResponse, NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// ═══════════════════════════════════════════════════════
// POST /api/auth/profile
// Updates hirer / worker profile, saves locations, completes onboarding
// ═══════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      name,
      profile_photo,
      onboarding_complete,
      preferred_services,
      location_type,
      address,
      landmark,
      lat,
      lng,
      label,
      emergency_preference,
      notify_nearby,
      availability_days,
      available_from,
      available_to,
      night_available,
    } = body;

    const jwt = await getUserFromRequest(request.cookies);
    if (!jwt?.sub) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    const userId = jwt.sub;
    const supabase = getSupabase();

    // 1. Update user profile fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateData.name = name;
    if (profile_photo !== undefined) updateData.profile_photo = profile_photo;
    if (onboarding_complete !== undefined) updateData.onboarding_complete = onboarding_complete;
    if (preferred_services !== undefined) updateData.preferred_services = preferred_services;
    if (emergency_preference !== undefined) updateData.emergency_preference = emergency_preference;
    if (notify_nearby !== undefined) updateData.notify_nearby = notify_nearby;

    if (Object.keys(updateData).length > 1) {
      const { error: userError } = await supabase.from("users").update(updateData).eq("id", userId);
      if (userError) {
        console.error("[profile update user error]", userError);
      }
    }

    // 2. Save address to saved_locations table if provided
    if (address) {
      const locationLabel = label || "Home";
      const { error: locError } = await supabase.from("saved_locations").upsert(
        {
          user_id: userId,
          label: locationLabel,
          address: address,
          landmark: landmark || "",
          latitude: lat ? Number(lat) : null,
          longitude: lng ? Number(lng) : null,
          is_primary: true,
          is_default: true,
        },
        { onConflict: "user_id,label" }
      );
      if (locError) {
        console.error("[profile save location error]", locError);
      }
    }

    // 3. Update worker schedule if provided
    if (availability_days || available_from || available_to || night_available !== undefined) {
      const scheduleData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (availability_days) scheduleData.availability_days = availability_days;
      if (available_from) scheduleData.available_from = available_from;
      if (available_to) scheduleData.available_to = available_to;
      if (night_available !== undefined) scheduleData.night_available = night_available;

      await supabase.from("worker_profiles").update(scheduleData).eq("id", userId);
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        userId,
        name,
        profile_photo,
        onboarding_complete,
      },
    });
  } catch (error) {
    console.error("[profile update exception]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
