"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ============================================================
// Kaizy — REAL-TIME BOOKING STORE (v8.0)
// PRODUCTION: Every status change writes to Supabase
// No fake data. No auto-accept. Real bookings only.
// ============================================================

export interface NearbyWorker {
  id: string; name: string; initials: string; trade: string; tradeIcon: string;
  rating: number; jobs: number; dist: number; price: number; color: string;
  verified: boolean; online: boolean; eta: number; lat: number; lng: number;
  experience: string; KaizyScore: number; phone?: string;
}

export interface BookingState {
  status: "idle" | "searching" | "matching" | "matched" | "accepted" | "en_route" | 
          "arrived" | "working" | "completed" | "reviewing" | "paid";
  selectedCategory: string;
  selectedProblem: string;
  nearbyWorkers: NearbyWorker[];
  matchedWorkers: NearbyWorker[];
  selectedWorker: NearbyWorker | null;
  pricing: PricingBreakdown | null;
  otp: string;
  eta: number;
  workerLocation: { lat: number; lng: number };
  userLocation: { lat: number; lng: number };
  bookingId: string | null;
  jobId: string | null;
  messages: ChatMessage[];
}

export interface PricingBreakdown {
  base: number; distanceFee: number; urgencyMultiplier: number;
  peakMultiplier: number; total: number; platformFee: number;
  insurance: number; grandTotal: number; workerPayout: number;
}

export interface ChatMessage {
  id: string; sender: "user" | "worker" | "system"; text: string;
  timestamp: number; read: boolean;
}

interface BookingCtx {
  state: BookingState;
  startSearch: (category: string, problem: string) => void;
  selectWorker: (worker: NearbyWorker) => void;
  confirmBooking: () => void;
  workerAccepted: () => void;
  updateWorkerLocation: (lat: number, lng: number) => void;
  workerArrived: () => void;
  jobStarted: () => void;
  jobCompleted: () => void;
  confirmPayment: (method: string, amount: number) => void;
  submitReview: (rating: number, tags: string[], text?: string) => void;
  sendMessage: (text: string) => void;
  cancelBooking: () => void;
  resetBooking: () => void;
  calculatePricing: (base: number, distance: number, urgency: "normal" | "now" | "sos") => PricingBreakdown;
}

const defaultState: BookingState = {
  status: "idle", selectedCategory: "", selectedProblem: "",
  nearbyWorkers: [], matchedWorkers: [], selectedWorker: null,
  pricing: null, otp: "", eta: 0,
  workerLocation: { lat: 11.0168, lng: 76.9558 },
  userLocation: { lat: 11.0168, lng: 76.9558 },
  bookingId: null, jobId: null, messages: [],
};

const BookingContext = createContext<BookingCtx>({} as BookingCtx);

const TRADE_API_MAP: Record<string, string> = {
  "Electrician": "electrician", "Plumber": "plumber", "Mechanic": "mechanic",
  "AC Repair": "ac_repair", "Carpenter": "carpenter", "Painter": "painter",
  "Mason": "mason", "Puncture": "mechanic", "All": "",
};
const TRADE_COLORS: Record<string, string> = {
  electrician: "#FF6B00", plumber: "#3B82F6", mechanic: "#8B5CF6",
  ac_repair: "#06B6D4", carpenter: "#F59E0B", painter: "#10B981", mason: "#6366F1",
};
const TRADE_ICONS: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};
const BASE_RATES: Record<string, number> = {
  "Electrician": 400, "Plumber": 350, "Mechanic": 500, "AC Repair": 600,
  "Carpenter": 400, "Painter": 300, "Mason": 450, "Puncture": 150,
};

// ── Helper: Get user ID from auth cookie ──
function getUserId(): string | null {
  try {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('kaizy_token='));
    if (tokenCookie) {
      const token = tokenCookie.split('=')[1];
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId || null;
    }
  } catch {}
  return null;
}

// ── Helper: Update booking status in database ──
async function updateBookingDB(bookingId: string, status: string, extra: Record<string, unknown> = {}) {
  try {
    await fetch('/api/bookings/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, status, ...extra }),
    });
  } catch (e) {
    console.error('[booking DB update error]', e);
  }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(defaultState);
  const etaTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const moveTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const bookingChannelRef = useRef<RealtimeChannel | undefined>(undefined);

  // ── Restore booking state from sessionStorage on mount ──
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('kaizy_booking_state');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<BookingState>;
        if (parsed.status && parsed.status !== 'idle') {
          setState(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch {}
  }, []);

  // ── Persist booking state to sessionStorage on active state changes ──
  useEffect(() => {
    const ACTIVE_STATUSES = ['searching', 'matching', 'matched', 'accepted', 'en_route', 'arrived', 'working', 'completed'];
    if (ACTIVE_STATUSES.includes(state.status)) {
      try {
        sessionStorage.setItem('kaizy_booking_state', JSON.stringify(state));
      } catch {}
    }
  }, [state.status, state.bookingId, state.jobId, state.selectedWorker, state.otp, state.eta, state.pricing]);

  // ── Cleanup all timers on unmount ──
  useEffect(() => {
    return () => {
      clearInterval(etaTimerRef.current);
      clearInterval(moveTimerRef.current);
      clearInterval(pollRef.current);
      clearTimeout(timeoutRef.current);
      if (bookingChannelRef.current && supabase) {
        supabase.removeChannel(bookingChannelRef.current);
        bookingChannelRef.current = undefined;
      }
    };
  }, []);

  // ── PRICING ──
  const calculatePricing = useCallback((base: number, distance: number, urgency: "normal" | "now" | "sos"): PricingBreakdown => {
    const distanceFee = Math.round(distance * 10);
    const urgencyMultiplier = urgency === "sos" ? 1.5 : 1.0;
    const peakMultiplier = 1.0;
    const subtotal = Math.round((base + distanceFee) * urgencyMultiplier);
    const platformFee = 0;
    const insurance = 0;
    const grandTotal = subtotal;
    const workerPayout = Math.round(subtotal * 0.90);
    return { base, distanceFee, urgencyMultiplier, peakMultiplier, total: subtotal, platformFee, insurance, grandTotal, workerPayout };
  }, []);

  // ── SEARCH: Fetch REAL workers from Supabase via API ──
  const startSearch = useCallback(async (category: string, problem: string) => {
    setState(prev => ({ ...prev, status: "searching", selectedCategory: category, selectedProblem: problem }));
    
    try {
      const trade = TRADE_API_MAP[category] || category.toLowerCase();
      let lat = 11.0168, lng = 76.9558;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {}
      setState(prev => ({ ...prev, userLocation: { lat, lng } }));
      const res = await fetch(`/api/workers/nearby?trade=${trade}&lat=${lat}&lng=${lng}&radius=10&limit=8`);
      const json = await res.json();

      if (json.success && json.data?.workers?.length > 0) {
        const matched: NearbyWorker[] = json.data.workers.map((w: Record<string, unknown>) => ({
          id: w.id as string,
          name: w.name as string,
          initials: ((w.name as string)?.[0] || "?"),
          trade: w.trade as string,
          tradeIcon: TRADE_ICONS[(w.trade as string)] || "🔧",
          rating: Number(w.rating),
          jobs: Number(w.totalJobs),
          dist: Number(w.distance),
          price: Number(w.rate),
          color: TRADE_COLORS[(w.trade as string)] || "#FF6B00",
          verified: Boolean(w.verified),
          online: true,
          eta: Number(w.eta),
          lat: Number(w.lat),
          lng: Number(w.lng),
          experience: `${w.experience}yr`,
          KaizyScore: Number(w.kaizyScore),
        }));

        setState(prev => ({
          ...prev, status: "matching",
          nearbyWorkers: matched, matchedWorkers: matched.slice(0, 5),
        }));
      } else {
        setState(prev => ({ ...prev, status: "matching", matchedWorkers: [], nearbyWorkers: [] }));
      }
    } catch (e) {
      console.error("[search error]", e);
      setState(prev => ({ ...prev, status: "matching", matchedWorkers: [], nearbyWorkers: [] }));
    }
  }, []);

  // ── SELECT WORKER ──
  const selectWorker = useCallback((worker: NearbyWorker) => {
    const pricing = calculatePricing(
      Number(worker.price) || BASE_RATES[worker.trade] || 400,
      worker.dist, "normal"
    );
    setState(prev => ({ ...prev, selectedWorker: worker, pricing }));
  }, [calculatePricing]);

  // ── CONFIRM BOOKING: Create REAL job in Supabase ──
  const confirmBooking = useCallback(async () => {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    setState(prev => ({
      ...prev, status: "matched", otp,
      messages: [{ id: "sys-1", sender: "system", text: "Booking confirmed! Sending to workers...", timestamp: Date.now(), read: true }],
    }));

    try {
      const trade = TRADE_API_MAP[state.selectedCategory] || state.selectedCategory.toLowerCase();
      let jobLat = state.userLocation.lat || 11.0168;
      let jobLng = state.userLocation.lng || 76.9558;

      // Get real GPS
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
          );
          jobLat = pos.coords.latitude;
          jobLng = pos.coords.longitude;
        } catch {}
      }

      const hirerId = getUserId();

      // Get verified address
      let verifiedAddress = '';
      try {
        const loc = sessionStorage.getItem('kaizy_verified_location');
        if (loc) {
          const parsed = JSON.parse(loc);
          verifiedAddress = parsed.address || '';
          if (parsed.lat && parsed.lng) { jobLat = parsed.lat; jobLng = parsed.lng; }
        }
      } catch {}

      // Create REAL job in database
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade,
          problemType: state.selectedProblem.toLowerCase().replace(/\s+/g, '_'),
          lat: jobLat, lng: jobLng,
          address: verifiedAddress || `GPS: ${jobLat.toFixed(4)}, ${jobLng.toFixed(4)}`,
          description: `${state.selectedCategory}: ${state.selectedProblem}`,
          isEmergency: state.selectedProblem.includes("SOS"),
          hirerId,
        }),
      });
      const json = await res.json();

      if (json.success && json.data?.jobId) {
        const realJobId = json.data.jobId;

        // Store job ID
        setState(prev => ({ ...prev, jobId: realJobId }));

        // Store worker info for tracking page
        try {
          sessionStorage.setItem('kaizy_booked_worker', JSON.stringify({
            name: state.selectedWorker?.name,
            trade: state.selectedWorker?.trade,
            rating: state.selectedWorker?.rating,
            kaizyScore: state.selectedWorker?.KaizyScore,
            lat: state.selectedWorker?.lat,
            lng: state.selectedWorker?.lng,
            phone: state.selectedWorker?.phone || "",
          }));
          sessionStorage.setItem('kaizy_active_job', JSON.stringify({
            jobId: realJobId,
            bookingId: null,
            trade, problem: state.selectedProblem,
            pricing: state.pricing,
          }));
          // Save user location for tracking page map
          sessionStorage.setItem('kaizy_booking_location', JSON.stringify({
            lat: jobLat, lng: jobLng,
            address: verifiedAddress,
          }));
        } catch {}

        // ── Shared "worker accepted" handler — called by either the realtime
        // INSERT event (fast path) or the polling fallback (safety net) ──
        let acceptanceHandled = false;
        const handleAcceptance = (realBookingId: string | undefined) => {
          if (acceptanceHandled) return;
          acceptanceHandled = true;

          clearInterval(pollRef.current);
          clearTimeout(timeoutRef.current);
          pollRef.current = undefined;
          timeoutRef.current = undefined;
          if (bookingChannelRef.current && supabase) {
            supabase.removeChannel(bookingChannelRef.current);
            bookingChannelRef.current = undefined;
          }

          setState(prev => ({
            ...prev,
            status: "accepted",
            bookingId: realBookingId || prev.bookingId,
            eta: prev.selectedWorker?.eta || 8,
            messages: [
              ...prev.messages,
              { id: "sys-2", sender: "system", text: `${prev.selectedWorker?.name || 'Worker'} accepted your booking!`, timestamp: Date.now(), read: true },
            ],
          }));

          // Store booking ID
          try {
            const existing = sessionStorage.getItem('kaizy_active_job');
            if (existing) {
              const parsed = JSON.parse(existing);
              parsed.bookingId = realBookingId;
              sessionStorage.setItem('kaizy_active_job', JSON.stringify(parsed));
            }
          } catch {}

          // Move to en_route after 1 second
          setTimeout(() => { setState(prev => ({ ...prev, status: "en_route" })); }, 1000);
        };

        // Realtime: primary fast-path — listen for the booking row being
        // INSERTed for this job (fires the instant a worker accepts).
        // Falls back to the poll below if Realtime isn't enabled on the
        // user's Supabase project (Database → Replication).
        if (supabase) {
          bookingChannelRef.current = supabase
            .channel(`booking-accept-${realJobId}`)
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'bookings', filter: `job_id=eq.${realJobId}` },
              (payload) => {
                const row = payload.new as { id?: string; booking_id?: string; status?: string } | null;
                if (!row) return;
                handleAcceptance(row.id || row.booking_id);
              }
            )
            .subscribe();
        }

        // Poll for worker acceptance (real DB polling) — fallback safety net,
        // slightly longer interval now that realtime is the primary path.
        pollRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/bookings/status?jobId=${realJobId}`);
            const statusJson = await statusRes.json();
            if (statusJson.success && statusJson.data?.status === 'accepted') {
              const realBookingId = statusJson.data.id || statusJson.data.booking_id;
              handleAcceptance(realBookingId);
            }
          } catch {}
        }, 8000);

        // 5-minute timeout: if no worker accepts, reset to idle
        timeoutRef.current = setTimeout(() => {
          clearInterval(pollRef.current);
          pollRef.current = undefined;
          if (bookingChannelRef.current && supabase) {
            supabase.removeChannel(bookingChannelRef.current);
            bookingChannelRef.current = undefined;
          }
          setState(prev => {
            if (prev.status === 'matching' || prev.status === 'matched') {
              return {
                ...prev, status: 'idle',
                messages: [...prev.messages, {
                  id: 'sys-timeout', sender: 'system',
                  text: 'No workers available right now. Please try again.',
                  timestamp: Date.now(), read: true,
                }],
              };
            }
            return prev;
          });
        }, 300000);
      } else {
        // Job creation failed
        setState(prev => ({
          ...prev, status: 'idle',
          messages: [{ id: 'sys-err', sender: 'system', text: json.data?.message || 'No workers available right now. Try again.', timestamp: Date.now(), read: true }],
        }));
      }
    } catch (e) {
      console.error("[booking error]", e);
      setState(prev => ({ ...prev, status: 'idle' }));
    }
  }, [state.selectedCategory, state.selectedProblem, state.selectedWorker, state.pricing, state.userLocation]);

  const workerAccepted = useCallback(() => {
    setState(prev => ({ ...prev, status: "accepted" }));
  }, []);

  // ── STATUS CHANGES — All write to database ──

  useEffect(() => {
    if (state.status === "en_route" && state.selectedWorker) {
      // Update DB
      if (state.bookingId) updateBookingDB(state.bookingId, 'en_route');

      // ETA countdown (real minute countdown)
      etaTimerRef.current = setInterval(() => {
        setState(prev => {
          const newEta = Math.max(0, prev.eta - 1);
          if (newEta === 0) {
            clearInterval(etaTimerRef.current);
            return { ...prev, eta: 0, status: "arrived" };
          }
          return { ...prev, eta: newEta };
        });
      }, 60000);

      // Smooth position interpolation (visual only)
      moveTimerRef.current = setInterval(() => {
        setState(prev => {
          const dx = (prev.userLocation.lat - prev.workerLocation.lat) * 0.12;
          const dy = (prev.userLocation.lng - prev.workerLocation.lng) * 0.12;
          return { ...prev, workerLocation: { lat: prev.workerLocation.lat + dx, lng: prev.workerLocation.lng + dy } };
        });
      }, 3000);

      return () => {
        clearInterval(etaTimerRef.current);
        clearInterval(moveTimerRef.current);
      };
    }
  }, [state.status, state.selectedWorker, state.bookingId]);

  const updateWorkerLocation = useCallback((lat: number, lng: number) => {
    setState(prev => ({ ...prev, workerLocation: { lat, lng } }));
  }, []);

  const workerArrived = useCallback(() => {
    if (state.bookingId) updateBookingDB(state.bookingId, 'arrived');
    setState(prev => ({
      ...prev, status: "arrived", eta: 0,
      messages: [...prev.messages, { id: `sys-${Date.now()}`, sender: "system", text: "Worker has arrived! Share OTP to start job.", timestamp: Date.now(), read: true }],
    }));
  }, [state.bookingId]);

  const jobStarted = useCallback(() => {
    if (state.bookingId) updateBookingDB(state.bookingId, 'in_progress');
    setState(prev => ({
      ...prev, status: "working",
      messages: [...prev.messages, { id: `sys-${Date.now()}`, sender: "system", text: "Job started! Worker is now working.", timestamp: Date.now(), read: true }],
    }));
  }, [state.bookingId]);

  const jobCompleted = useCallback(() => {
    if (state.bookingId) updateBookingDB(state.bookingId, 'completed');
    setState(prev => ({
      ...prev, status: "completed",
      messages: [...prev.messages, { id: `sys-${Date.now()}`, sender: "system", text: "Job completed! Please confirm payment and review.", timestamp: Date.now(), read: true }],
    }));
  }, [state.bookingId]);

  // ── CASH PAYMENT CONFIRMATION (new!) ──
  const confirmPayment = useCallback(async (method: string, amount: number) => {
    if (state.bookingId) {
      await updateBookingDB(state.bookingId, 'paid', {
        paymentMethod: method,
        paymentAmount: amount,
        workerId: state.selectedWorker?.id,
      });
    }
    setState(prev => ({
      ...prev, status: "reviewing",
      messages: [...prev.messages, { id: `sys-${Date.now()}`, sender: "system", text: `💰 ₹${amount} payment confirmed (${method}). Please leave a review!`, timestamp: Date.now(), read: true }],
    }));
  }, [state.bookingId, state.selectedWorker]);

  // ── REVIEW — Writes to Supabase ──
  const submitReview = useCallback(async (rating: number, tags: string[], text?: string) => {
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: state.bookingId,
          reviewerId: getUserId(),
          revieweeId: state.selectedWorker?.id,
          rating, tags,
          comment: text || '',
          reviewerType: 'hirer',
        }),
      });
    } catch (e) {
      console.error('[review submit error]', e);
    }
    setState(prev => ({ ...prev, status: "paid" }));
  }, [state.bookingId, state.selectedWorker]);

  const sendMessage = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, { id: `user-${Date.now()}`, sender: "user", text, timestamp: Date.now(), read: true }],
    }));
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, senderType: 'user', bookingId: state.bookingId }),
    }).catch(() => {});
  }, [state.bookingId]);

  const cancelBooking = useCallback(() => {
    clearInterval(etaTimerRef.current);
    clearInterval(moveTimerRef.current);
    clearInterval(pollRef.current);
    clearTimeout(timeoutRef.current);
    etaTimerRef.current = undefined;
    moveTimerRef.current = undefined;
    pollRef.current = undefined;
    timeoutRef.current = undefined;
    if (bookingChannelRef.current && supabase) {
      supabase.removeChannel(bookingChannelRef.current);
      bookingChannelRef.current = undefined;
    }
    try { sessionStorage.removeItem('kaizy_booking_state'); } catch {}
    if (state.bookingId) updateBookingDB(state.bookingId, 'cancelled');
    if (state.jobId) {
      fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: state.bookingId, jobId: state.jobId }),
      }).catch(() => {});
    }
    setState(prev => ({
      ...defaultState,
      messages: [{ id: `sys-${Date.now()}`, sender: "system", text: "Booking cancelled.", timestamp: Date.now(), read: true }],
    }));
  }, [state.bookingId, state.jobId]);

  const resetBooking = useCallback(() => {
    clearInterval(etaTimerRef.current);
    clearInterval(moveTimerRef.current);
    clearInterval(pollRef.current);
    clearTimeout(timeoutRef.current);
    etaTimerRef.current = undefined;
    moveTimerRef.current = undefined;
    pollRef.current = undefined;
    timeoutRef.current = undefined;
    if (bookingChannelRef.current && supabase) {
      supabase.removeChannel(bookingChannelRef.current);
      bookingChannelRef.current = undefined;
    }
    try { sessionStorage.removeItem('kaizy_booking_state'); } catch {}
    setState(defaultState);
  }, []);

  return (
    <BookingContext.Provider value={{
      state, startSearch, selectWorker, confirmBooking, workerAccepted,
      updateWorkerLocation, workerArrived, jobStarted, jobCompleted,
      confirmPayment, submitReview, sendMessage, cancelBooking, resetBooking, calculatePricing,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => useContext(BookingContext);
