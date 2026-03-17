import { NextRequest, NextResponse } from "next/server";

// ============================================================
// Kaizy — UBER-QUALITY LIVE GPS TRACKING v2
// Worker movement · ETA · Direction · Booking lifecycle
// ============================================================

interface TrackingSession {
  bookingId: string;
  workerId: string;
  workerName: string;
  status: "created" | "en_route" | "arrived" | "working" | "completed";
  workerLat: number;
  workerLng: number;
  destLat: number;
  destLng: number;
  heading: number;
  speed: number;
  eta: number;
  otp: string;
  startedAt: string;
  arrivedAt: string | null;
  completedAt: string | null;
  locationHistory: { lat: number; lng: number; heading: number; speed: number; ts: string }[];
}

const sessions = new Map<string, TrackingSession>();

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateHeading(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(toLat * Math.PI / 180);
  const x = Math.cos(fromLat * Math.PI / 180) * Math.sin(toLat * Math.PI / 180) -
            Math.sin(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── START TRACKING ──
    if (action === "start") {
      const { bookingId, workerId = "W003", workerName = "Worker",
              workerLat = 11.022, workerLng = 76.960,
              destLat = 11.0168, destLng = 76.9558 } = body;

      const dist = haversine(workerLat, workerLng, destLat, destLng);
      const eta = Math.round(dist * 6 + 3);
      const otp = String(Math.floor(1000 + Math.random() * 9000));

      const session: TrackingSession = {
        bookingId, workerId, workerName,
        status: "en_route",
        workerLat, workerLng, destLat, destLng,
        heading: calculateHeading(workerLat, workerLng, destLat, destLng),
        speed: 25 + Math.random() * 15,
        eta, otp,
        startedAt: new Date().toISOString(),
        arrivedAt: null, completedAt: null,
        locationHistory: [{ lat: workerLat, lng: workerLng, heading: 0, speed: 0, ts: new Date().toISOString() }],
      };

      sessions.set(bookingId, session);

      return NextResponse.json({
        success: true,
        data: {
          bookingId, status: "en_route",
          worker: { id: workerId, name: workerName, lat: workerLat, lng: workerLng },
          destination: { lat: destLat, lng: destLng },
          heading: session.heading, speed: session.speed,
          eta, otp,
          distanceKm: Math.round(dist * 100) / 100,
          startedAt: session.startedAt,
        },
      });
    }

    // ── UPDATE LOCATION (simulate movement) ──
    if (action === "update") {
      const { bookingId } = body;
      const session = sessions.get(bookingId);
      if (!session) return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });

      if (session.status !== "en_route") {
        return NextResponse.json({ success: true, data: { status: session.status, message: "Not en route" } });
      }

      // Simulate realistic GPS movement toward destination
      const progress = 0.12 + Math.random() * 0.08; // 12-20% closer each update
      const jitter = (Math.random() - 0.5) * 0.0003; // Slight GPS jitter

      const newLat = session.workerLat + (session.destLat - session.workerLat) * progress + jitter;
      const newLng = session.workerLng + (session.destLng - session.workerLng) * progress + jitter;
      const newHeading = calculateHeading(session.workerLat, session.workerLng, newLat, newLng);
      const speed = 20 + Math.random() * 20; // 20-40 km/h city traffic

      session.workerLat = newLat;
      session.workerLng = newLng;
      session.heading = newHeading;
      session.speed = speed;

      const dist = haversine(newLat, newLng, session.destLat, session.destLng);
      session.eta = Math.max(1, Math.round(dist * 6 + 1));

      session.locationHistory.push({
        lat: newLat, lng: newLng, heading: newHeading, speed, ts: new Date().toISOString(),
      });

      // Auto-arrive if very close
      if (dist < 0.05) { // < 50 meters
        session.status = "arrived";
        session.arrivedAt = new Date().toISOString();
        session.eta = 0;
      }

      return NextResponse.json({
        success: true,
        data: {
          bookingId, status: session.status,
          worker: { lat: newLat, lng: newLng, heading: newHeading, speed: Math.round(speed) },
          eta: session.eta,
          distanceKm: Math.round(dist * 100) / 100,
          totalUpdates: session.locationHistory.length,
          arrived: session.status === "arrived",
        },
      });
    }

    // ── VERIFY OTP (start job) ──
    if (action === "verify_otp") {
      const { bookingId, otp } = body;
      const session = sessions.get(bookingId);
      if (!session) return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });

      if (session.otp !== otp) {
        return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 });
      }

      session.status = "working";
      return NextResponse.json({
        success: true,
        data: { bookingId, status: "working", message: "OTP verified. Job started!", startedAt: new Date().toISOString() },
      });
    }

    // ── COMPLETE JOB ──
    if (action === "complete") {
      const { bookingId } = body;
      const session = sessions.get(bookingId);
      if (!session) return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });

      session.status = "completed";
      session.completedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        data: {
          bookingId, status: "completed",
          completedAt: session.completedAt,
          totalLocations: session.locationHistory.length,
          message: "Job complete! Please review and release payment.",
        },
      });
    }

    // ── GET ROUTE (for rendering on map) ──
    if (action === "route") {
      const { bookingId } = body;
      const session = sessions.get(bookingId);
      if (!session) return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });

      return NextResponse.json({
        success: true,
        data: {
          route: session.locationHistory.map(l => [l.lng, l.lat]),
          worker: { lat: session.workerLat, lng: session.workerLng },
          destination: { lat: session.destLat, lng: session.destLng },
        },
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// GET: Fetch current tracking status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");

  if (!bookingId) {
    return NextResponse.json({ success: true, data: { activeSessions: sessions.size } });
  }

  const session = sessions.get(bookingId);
  if (!session) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({
    success: true,
    data: {
      bookingId: session.bookingId,
      status: session.status,
      worker: { id: session.workerId, name: session.workerName, lat: session.workerLat, lng: session.workerLng, heading: session.heading, speed: session.speed },
      destination: { lat: session.destLat, lng: session.destLng },
      eta: session.eta,
      otp: session.otp,
      distanceKm: Math.round(haversine(session.workerLat, session.workerLng, session.destLat, session.destLng) * 100) / 100,
      startedAt: session.startedAt,
      arrivedAt: session.arrivedAt,
      completedAt: session.completedAt,
      locationUpdates: session.locationHistory.length,
    },
  });
}
