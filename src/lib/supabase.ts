import { createClient } from "@supabase/supabase-js";

// ============================================================
// Kaizy — SUPABASE REAL-TIME CLIENT
// Production-grade: typed, singleton, auto-reconnect
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

// Public client (used in browser — respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Admin client (used in API routes only — bypasses RLS)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : supabase;

// ── TYPE DEFINITIONS ──

export interface User {
  id: string;
  phone: string;
  user_type: "worker" | "hirer" | "both" | "contractor";
  name: string | null;
  profile_photo: string | null;
  language: string;
  fcm_token: string | null;
  whatsapp_optin: boolean;
  aadhaar_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerProfile {
  id: string;
  trade_primary: string;
  trade_secondary: string[];
  bio: string | null;
  rate_base: number;
  rate_per_km: number;
  rate_night_mult: number;
  rate_emergency_mult: number;
  rate_holiday_mult: number;
  experience_years: number;
  verification_level: number;
  is_online: boolean;
  is_available: boolean;
  service_radius_km: number;
  avg_rating: number;
  total_jobs: number;
  total_earnings: number;
  completion_rate: number;
  response_rate: number;
  avg_response_secs: number;
  kaizy_score: number;
  kaizy_score_band: string;
  loan_eligible: boolean;
  max_loan_amount: number;
  vehicle_type: string | null;
  has_vehicle: boolean;
  last_online_at: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  hirer_id: string;
  title: string | null;
  description: string | null;
  trade_required: string;
  problem_type: string | null;
  skills_required: string[];
  address_text: string | null;
  address_landmark: string | null;
  city: string | null;
  job_type: "instant" | "scheduled" | "project" | "emergency";
  urgency: "emergency" | "urgent" | "normal";
  status: "open" | "matching" | "booked" | "in_progress" | "completed" | "cancelled" | "expired";
  estimated_price: number | null;
  min_price: number | null;
  max_price: number | null;
  final_price: number | null;
  scheduled_at: string | null;
  expires_at: string;
  photos: string[];
  voice_note_url: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  job_id: string;
  hirer_id: string;
  worker_id: string;
  status: "pending" | "accepted" | "worker_en_route" | "worker_arrived" |
          "in_progress" | "completed" | "disputed" | "resolved" |
          "cancelled_hirer" | "cancelled_worker" | "expired" | "refunded";
  price_breakdown: PriceBreakdown;
  worker_rate: number;
  distance_km: number;
  distance_charge: number;
  night_surcharge: number;
  emergency_surcharge: number;
  rain_surcharge: number;
  demand_surcharge: number;
  platform_fee: number;
  platform_fee_pct: number;
  insurance_fee: number;
  gst_amount: number;
  total_amount: number;
  net_to_worker: number;
  worker_accepted_at: string | null;
  worker_departed_at: string | null;
  worker_arrived_at: string | null;
  job_started_at: string | null;
  job_completed_at: string | null;
  estimated_arrival_mins: number | null;
  actual_arrival_mins: number | null;
  hirer_confirmed: boolean;
  auto_release_at: string | null;
  cancellation_reason: string | null;
  cancellation_fee: number;
  created_at: string;
}

export interface PriceBreakdown {
  basePrice: number;
  distanceKm: number;
  distanceCharge: number;
  workerCharge: number;
  platformFee: number;
  gst: number;
  insurance: number;
  totalAmount: number;
  netToWorker: number;
  surcharges: { name: string; mult: number }[];
  estimatedDuration: number;
  priceRange: { min: number; max: number };
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_type: "hirer" | "worker" | "system" | "ops";
  message_type: "text" | "voice" | "image" | "quick_reply" | "system" | "location";
  content: string | null;
  media_url: string | null;
  quick_replies: string[] | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  title_hi: string | null;
  body_hi: string | null;
  data: Record<string, unknown>;
  channel: string[];
  status: "pending" | "sent" | "delivered" | "failed" | "read";
  priority: "low" | "normal" | "high" | "critical";
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  tags: string[];
  comment: string | null;
  voice_url: string | null;
  photos: string[];
  reply_text: string | null;
  created_at: string;
}

export interface JobAlert {
  id: string;
  job_id: string;
  worker_id: string;
  status: "sent" | "viewed" | "accepted" | "declined" | "expired";
  sent_at: string;
  expires_at: string;
  responded_at: string | null;
  decline_reason: string | null;
  priority_rank: number;
}

export interface WorkerLocation {
  id: string;
  worker_id: string;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  booking_id: string | null;
  lat: number;
  lng: number;
  recorded_at: string;
}

export interface PricingRule {
  id: string;
  trade_category: string;
  problem_type: string;
  city_code: string;
  base_price: number;
  price_per_km: number;
  min_price: number;
  max_price: number;
  duration_mins: number;
  night_mult: number;
  emergency_mult: number;
  rain_mult: number;
  holiday_mult: number;
  demand_surge_mult: number;
  is_active: boolean;
}

// ── REAL-TIME SUBSCRIPTIONS ──

export function subscribeToBooking(bookingId: string, callback: (booking: Booking) => void) {
  return supabase
    .channel(`booking:${bookingId}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "bookings",
      filter: `id=eq.${bookingId}`,
    }, (payload) => callback(payload.new as Booking))
    .subscribe();
}

export function subscribeToWorkerLocation(bookingId: string, callback: (loc: WorkerLocation) => void) {
  return supabase
    .channel(`tracking:${bookingId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "worker_locations",
      filter: `booking_id=eq.${bookingId}`,
    }, (payload) => callback(payload.new as WorkerLocation))
    .subscribe();
}

export function subscribeToMessages(bookingId: string, callback: (msg: Message) => void) {
  return supabase
    .channel(`chat:${bookingId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `booking_id=eq.${bookingId}`,
    }, (payload) => callback(payload.new as Message))
    .subscribe();
}

export function subscribeToJobAlerts(workerId: string, callback: (alert: JobAlert) => void) {
  return supabase
    .channel(`alerts:${workerId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "job_alerts",
      filter: `worker_id=eq.${workerId}`,
    }, (payload) => callback(payload.new as JobAlert))
    .subscribe();
}

export function subscribeToNotifications(userId: string, callback: (notif: Notification) => void) {
  return supabase
    .channel(`notif:${userId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${userId}`,
    }, (payload) => callback(payload.new as Notification))
    .subscribe();
}

// ── HELPER: Remove channel ──
export function unsubscribe(channelName: string) {
  const channel = supabase.channel(channelName);
  supabase.removeChannel(channel);
}
