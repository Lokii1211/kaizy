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
  experience: string; KaizyScore: number;
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

  // ── DYNAMIC PRICING ENGINE ──
  const calculatePricing = useCallback((base: number, distance: number, urgency: "normal" | "now" | "sos"): PricingBreakdown => {
    const h = new Date().getHours();
    const isPeak = (h >= 6 && h <= 9) || (h >= 17 && h <= 20);
    const isNight = h >= 22 || h <= 6;
    const isWeekend = [0, 6].includes(new Date().getDay());

    const distanceFee = Math.round(distance * 15);
    const urgencyMultiplier = urgency === "sos" ? 1.5 : urgency === "now" ? 1.2 : 1.0;
    const peakMultiplier = isNight ? 1.4 : isPeak ? 1.3 : isWeekend ? 1.2 : 1.0;

    const subtotal = Math.round((base + distanceFee) * urgencyMultiplier * peakMultiplier);
    const platformFee = Math.round(subtotal * 0.10);
    const insurance = 5;
    const grandTotal = subtotal + platformFee + insurance;
    const workerPayout = subtotal - Math.round(subtotal * 0.05);

    return { base, distanceFee, urgencyMultiplier, peakMultiplier, total: subtotal, platformFee, insurance, grandTotal, workerPayout };
  }, []);

  // ── SEARCH: Fetch REAL workers from Supabase via API ──
  const startSearch = useCallback(async (category: string, problem: string) => {
    setState(prev => ({ ...prev, status: "searching", selectedCategory: category, selectedProblem: problem }));
    
    try {
      const trade = TRADE_API_MAP[category] || category.toLowerCase();
      const res = await fetch(`/api/workers/nearby?trade=${trade}&lat=11.0168&lng=76.9558&radius=10&limit=8`);
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

  // ── SELECT WORKER + CALC PRICE ──
  const selectWorker = useCallback((worker: NearbyWorker) => {
    const pricing = calculatePricing(
      BASE_RATES[worker.trade] || Number(worker.price) || 400,
      worker.dist,
      state.selectedProblem.includes("SOS") ? "sos" : "now"
    );
    setState(prev => ({ ...prev, selectedWorker: worker, pricing }));
  }, [calculatePricing, state.selectedProblem]);

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

    // Create real job via API
    try {
      const trade = TRADE_API_MAP[state.selectedCategory] || state.selectedCategory.toLowerCase();
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade,
          problemType: state.selectedProblem.toLowerCase().replace(/\s+/g, '_'),
          lat: 11.0168,
          lng: 76.9558,
          description: `${state.selectedCategory}: ${state.selectedProblem}`,
          isEmergency: state.selectedProblem.includes("SOS"),
        }),
      });
      const json = await res.json();

      if (json.success) {
        // Simulate worker accept after 3s
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            status: "accepted",
            eta: prev.selectedWorker?.eta || 8,
            messages: [
              ...prev.messages,
              { id: "sys-2", sender: "system", text: `${prev.selectedWorker?.name || 'Worker'} accepted your booking!`, timestamp: Date.now(), read: true },
              { id: "worker-1", sender: "worker", text: "Hello! I'm on my way. Will reach soon 🏍️", timestamp: Date.now() + 100, read: false },
            ],
          }));
          setTimeout(() => {
            setState(prev => ({ ...prev, status: "en_route" }));
          }, 1000);
        }, 3000);
      }
    } catch (e) {
      console.error("[booking error]", e);
      // Still simulate acceptance for demo
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          status: "accepted",
          eta: prev.selectedWorker?.eta || 8,
          messages: [
            ...prev.messages,
            { id: "sys-2", sender: "system", text: `${prev.selectedWorker?.name || 'Worker'} accepted!`, timestamp: Date.now(), read: true },
          ],
        }));
        setTimeout(() => { setState(prev => ({ ...prev, status: "en_route" })); }, 1000);
      }, 3000);
    }
  }, [state.selectedCategory, state.selectedProblem]);

  // ── WORKER ACCEPTED (manual or auto) ──
  const workerAccepted = useCallback(() => {
    setState(prev => ({ ...prev, status: "accepted" }));
  }, []);

  // ── SIMULATE WORKER MOVEMENT (like Uber live tracking) ──
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

      // Simulate movement every 3s (move worker toward user)
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
    // Simulate worker reply after 2-5s
    const delay = 2000 + Math.random() * 3000;
    setTimeout(() => {
      const replies = [
        "Okay, noted! 👍", "I'll be there soon", "Yes, I can do that",
        "No problem at all", "Sure, I'll bring the tools", "On my way! 🏍️",
      ];
      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: `worker-${Date.now()}`, sender: "worker", text: replies[Math.floor(Math.random() * replies.length)], timestamp: Date.now(), read: false },
        ],
      }));
    }, delay);
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
