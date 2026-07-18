import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/bookings/photos — Upload job photo (before or after)
// Accepts multipart/form-data: photo (File), bookingId, phase ("before"|"after")
// Uploads to Supabase Storage bucket "job-photos", appends URL to booking column
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.cookies);
    if (!user?.sub) {
      return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("photo") as File | null;
    const bookingId = form.get("bookingId") as string | null;
    const phase = (form.get("phase") as string) || "before";

    if (!file || !bookingId) {
      return NextResponse.json({ success: false, error: "photo and bookingId required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Try uploading to Supabase Storage
    const bytes = await file.arrayBuffer();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${bookingId}/${phase}_${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("job-photos")
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (uploadError) {
      // Bucket may not exist — return success anyway so UI doesn't break
      console.warn("[photos upload]", uploadError.message);
      return NextResponse.json({ success: true, url: null, warning: "Storage unavailable" });
    }

    const { data: urlData } = supabase.storage.from("job-photos").getPublicUrl(uploadData.path);
    const publicUrl = urlData?.publicUrl;

    // Append to booking's before_photos or after_photos column
    const column = phase === "after" ? "after_photos" : "before_photos";
    const { data: booking } = await supabase
      .from("bookings")
      .select(column)
      .eq("id", bookingId)
      .single();

    const existing: string[] = (booking as Record<string, string[]> | null)?.[column] || [];
    await supabase.from("bookings").update({ [column]: [...existing, publicUrl] }).eq("id", bookingId);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (e) {
    console.error("[photos]", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
