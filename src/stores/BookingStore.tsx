"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";

// ============================================================
// Kaizy — REAL-TIME BOOKING STORE
// Like Uber: Book → Match → Track → Pay → Review
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
  bookingId: null, messages: [],
};

const BookingContext = createContext<BookingCtx>({} as BookingCtx);

// ── NEARBY WORKERS: Fetched from real Supabase via API ──

// Trade name mapping for API
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

// ── BASE RATES PER TRADE ──
const BASE_RATES: Record<string, number> = {
  "Electrician": 400, "Plumber": 350, "Mechanic": 500, "AC Repair": 600,
  "Carpenter": 400, "Painter": 300, "Mason": 450, "Puncture": 150,
};

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(defaultState);
  const etaTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const moveTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // ── PRICING: Worker sets their rate, user pays that. No hidden fees. ──
  // Platform takes 10% internally from worker payout (not shown to user)
  // Urgency only applies when user MANUALLY selects "Emergency/SOS"
  const calculatePricing = useCallback((base: number, distance: number, urgency: "normal" | "now" | "sos"): PricingBreakdown => {
    const distanceFee = Math.round(distance * 10); // ₹10/km travel
    
    // Only apply multiplier if user explicitly chose SOS/Emergency
    const urgencyMultiplier = urgency === "sos" ? 1.5 : 1.0;
    const peakMultiplier = 1.0; // No auto peak pricing

    const subtotal = Math.round((base + distanceFee) * urgencyMultiplier);
    const platformFee = 0; // Hidden from user — taken from worker payout internally
    const insurance = 0;
    const grandTotal = subtotal; // User pays exactly what's shown
    const workerPayout = Math.round(subtotal * 0.90); // Platform keeps 10% internally

    return { base, distanceFee, urgencyMultiplier, peakMultiplier, total: subtotal, platformFee, insurance, grandTotal, workerPayout };
  }, []);

  // ── SEARCH: Fetch REAL workers from Supabase via API ──
  const startSearch = useCallback(async (category: string, problem: string) => {
    setState(prev => ({ ...prev, status: "searching", selectedCategory: category, selectedProblem: problem }));
    
    try {
      const trade = TRADE_API_MAP[category] || category.toLowerCase();
      // Get real GPS coordinates
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
          ...prev,
          status: "matching",
          nearbyWorkers: matched,
          matchedWorkers: matched.slice(0, 5),
        }));
      } else {
        // No workers found
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
      worker.dist,
      "normal" // Only 'sos' if user explicitly chose emergency
    );
    setState(prev => ({ ...prev, selectedWorker: worker, pricing }));
  }, [calculatePricing]);

  // ── CONFIRM BOOKING: Create real job via API ──
  const confirmBooking = useCallback(async () => {
    const bookingId = `BKG-${Date.now()}`;
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    setState(prev => ({
      ...prev,
      status: "matched",
      bookingId,
      otp,
      messages: [
        { id: "sys-1", sender: "system", text: "Booking confirmed! Sending to workers...", timestamp: Date.now(), read: true },
      ],
    }));

    // Create real job via API — use REAL GPS
    try {
      const trade = TRADE_API_MAP[state.selectedCategory] || state.selectedCategory.toLowerCase();
      
      // Get real GPS position
      let jobLat = state.userLocation.lat || 11.0168;
      let jobLng = state.userLocation.lng || 76.9558;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
          );
          jobLat = pos.coords.latitude;
          jobLng = pos.coords.longitude;
        } catch {}
      }

      // Get hirer ID from auth cookie
      let hirerId: string | null = null;
      try {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(c => c.trim().startsWith('kaizy_token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          const payload = JSON.parse(atob(token.split('.')[1]));
          hirerId = payload.sub || payload.userId || null;
        }
      } catch {}

      // Get verified address from session storage
      let verifiedAddress = '';
      try {
        const loc = sessionStorage.getItem('kaizy_verified_location');
        if (loc) {
          const parsed = JSON.parse(loc);
          verifiedAddress = parsed.address || '';
          if (parsed.lat && parsed.lng) {
            jobLat = parsed.lat;
            jobLng = parsed.lng;
          }
        }
      } catch {}

      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade,
          problemType: state.selectedProblem.toLowerCase().replace(/\s+/g, '_'),
          lat: jobLat,
          lng: jobLng,
          address: verifiedAddress || `GPS: ${jobLat.toFixed(4)}, ${jobLng.toFixed(4)}`,
          description: `${state.selectedCategory}: ${state.selectedProblem}`,
          isEmergency: state.selectedProblem.includes("SOS"),
          hirerId,
        }),
      });
      const json = await res.json();

      if (json.success) {
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
        } catch {}

        // Poll for worker acceptance via API
        const pollId = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/bookings/status?id=${json.data?.bookingId || 'latest'}`);
            const statusJson = await statusRes.json();
            if (statusJson.success && statusJson.data?.status === 'accepted') {
              clearInterval(pollId);
              setState(prev => ({
                ...prev,
                status: "accepted",
                eta: prev.selectedWorker?.eta || 8,
                messages: [
                  ...prev.messages,
                  { id: "sys-2", sender: "system", text: `${prev.selectedWorker?.name || 'Worker'} accepted your booking!`, timestamp: Date.now(), read: true },
                ],
              }));
              setTimeout(() => { setState(prev => ({ ...prev, status: "en_route" })); }, 1000);
            }
          } catch {}
        }, 5000);

        // Auto-accept after 30s if no poll response (worker may accept via notification)
        setTimeout(() => {
          clearInterval(pollId);
          setState(prev => {
            if (prev.status === 'matching' || prev.status === 'matched') {
              return { ...prev, status: 'accepted', eta: prev.selectedWorker?.eta || 8,
                messages: [...prev.messages, { id: 'sys-auto', sender: 'system', text: 'Worker assigned! On the way.', timestamp: Date.now(), read: true }] };
            }
            return prev;
          });
          setTimeout(() => { setState(prev => ({ ...prev, status: "en_route" })); }, 1000);
        }, 30000);
      }
    } catch (e) {
      console.error("[booking error]", e);
      setState(prev => ({ ...prev, status: 'idle' }));
    }
  }, [state.selectedCategory, state.selectedProblem]);

  // ── WORKER ACCEPTED (manual or auto) ──
  const workerAccepted = useCallback(() => {
    setState(prev => ({ ...prev, status: "accepted" }));
  }, []);

  // ── TRACK WORKER MOVEMENT (ETA countdown + position updates) ──
  useEffect(() => {
    if (state.status === "en_route" && state.selectedWorker) {
      // ETA countdown
      etaTimerRef.current = setInterval(() => {
        setState(prev => {
          const newEta = Math.max(0, prev.eta - 1);
          if (newEta === 0) {
            clearInterval(etaTimerRef.current);
            return { ...prev, eta: 0, status: "arrived" };
          }
          return { ...prev, eta: newEta };
        });
      }, 60000); // Real minute countdown

      // Update worker position every 3s (poll from tracking API or interpolate)
      moveTimerRef.current = setInterval(() => {
        setState(prev => {
          const dx = (prev.userLocation.lat - prev.workerLocation.lat) * 0.15;
          const dy = (prev.userLocation.lng - prev.workerLocation.lng) * 0.15;
          return {
            ...prev,
            workerLocation: {
              lat: prev.workerLocation.lat + dx,
              lng: prev.workerLocation.lng + dy,
            },
          };
        });
      }, 3000);

      return () => {
        clearInterval(etaTimerRef.current);
        clearInterval(moveTimerRef.current);
      };
    }
  }, [state.status, state.selectedWorker]);

  const updateWorkerLocation = useCallback((lat: number, lng: number) => {
    setState(prev => ({ ...prev, workerLocation: { lat, lng } }));
  }, []);

  const workerArrived = useCallback(() => {
    setState(prev => ({
      ...prev, status: "arrived", eta: 0,
      messages: [...prev.messages, { id: `sys-${Date.now()}`, sender: "system", text: "Worker has arrived! Share OTP to start job.", timestamp: Date.now(), read: true }],
    }));
  }, []);

  const jobStarted = useCallback(() => {
    setState(prev => ({
      ...prev, status: "working",
      messages: [...prev.messages, { id: `sys-${Date.now()}`, sender: "system", text: "Job started! Worker is now working.", timestamp: Date.now(), read: true }],
    }));
  }, []);

  const jobCompleted = useCallback(() => {
    setState(prev => ({
      ...prev, status: "completed",
      messages: [...prev.messages, { id: `sys-${Date.now()}`, sender: "system", text: "Job completed! Please review and release payment.", timestamp: Date.now(), read: true }],
    }));
  }, []);

  const submitReview = useCallback((rating: number, tags: string[], text?: string) => {
    setState(prev => ({ ...prev, status: "paid" }));
  }, []);

  const sendMessage = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        { id: `user-${Date.now()}`, sender: "user", text, timestamp: Date.now(), read: true },
      ],
    }));
    // Send message to chat API
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, senderType: 'user' }),
    }).catch(() => {});
  }, []);

  const cancelBooking = useCallback(() => {
    clearInterval(etaTimerRef.current);
    clearInterval(moveTimerRef.current);
    setState(prev => ({
      ...defaultState,
      messages: [{ id: `sys-${Date.now()}`, sender: "system", text: "Booking cancelled.", timestamp: Date.now(), read: true }],
    }));
  }, []);

  const resetBooking = useCallback(() => {
    clearInterval(etaTimerRef.current);
    clearInterval(moveTimerRef.current);
    setState(defaultState);
  }, []);

  return (
    <BookingContext.Provider value={{
      state, startSearch, selectWorker, confirmBooking, workerAccepted,
      updateWorkerLocation, workerArrived, jobStarted, jobCompleted,
      submitReview, sendMessage, cancelBooking, resetBooking, calculatePricing,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => useContext(BookingContext);
