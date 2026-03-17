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

// ── NEARBY WORKERS MOCK DATABASE ──
const WORKERS_DB: NearbyWorker[] = [
  { id: "W001", name: "Raju Kumar", initials: "R", trade: "Electrician", tradeIcon: "⚡", rating: 4.9, jobs: 312, dist: 1.2, price: 500, color: "#FF6B00", verified: true, online: true, eta: 8, lat: 11.019, lng: 76.952, experience: "10yr", KaizyScore: 742 },
  { id: "W002", name: "Meena D.", initials: "M", trade: "Plumber", tradeIcon: "🔧", rating: 4.7, jobs: 189, dist: 0.8, price: 400, color: "#3B8BFF", verified: true, online: true, eta: 5, lat: 11.015, lng: 76.958, experience: "8yr", KaizyScore: 680 },
  { id: "W003", name: "Suresh M.", initials: "S", trade: "Mechanic", tradeIcon: "🚗", rating: 4.8, jobs: 256, dist: 2.1, price: 600, color: "#8B5CF6", verified: true, online: true, eta: 12, lat: 11.022, lng: 76.960, experience: "15yr", KaizyScore: 790 },
  { id: "W004", name: "Priya S.", initials: "P", trade: "AC Repair", tradeIcon: "❄️", rating: 4.6, jobs: 145, dist: 1.5, price: 700, color: "#06B6D4", verified: true, online: false, eta: 10, lat: 11.012, lng: 76.950, experience: "6yr", KaizyScore: 620 },
  { id: "W005", name: "Anand R.", initials: "A", trade: "Carpenter", tradeIcon: "🪚", rating: 4.5, jobs: 98, dist: 3.2, price: 450, color: "#10B981", verified: false, online: true, eta: 18, lat: 11.025, lng: 76.965, experience: "12yr", KaizyScore: 590 },
  { id: "W006", name: "Lakshmi R.", initials: "L", trade: "Painter", tradeIcon: "🎨", rating: 4.4, jobs: 67, dist: 2.8, price: 350, color: "#F59E0B", verified: true, online: true, eta: 15, lat: 11.020, lng: 76.945, experience: "5yr", KaizyScore: 540 },
  { id: "W007", name: "Gopal V.", initials: "G", trade: "Mason", tradeIcon: "⚒️", rating: 4.6, jobs: 203, dist: 4.1, price: 550, color: "#6366F1", verified: true, online: true, eta: 22, lat: 11.028, lng: 76.970, experience: "20yr", KaizyScore: 710 },
  { id: "W008", name: "Kavitha P.", initials: "K", trade: "Electrician", tradeIcon: "⚡", rating: 4.7, jobs: 134, dist: 1.9, price: 480, color: "#FF6B00", verified: true, online: true, eta: 11, lat: 11.018, lng: 76.962, experience: "7yr", KaizyScore: 660 },
  { id: "W009", name: "Venkat S.", initials: "V", trade: "Puncture", tradeIcon: "🛞", rating: 4.3, jobs: 412, dist: 0.5, price: 150, color: "#EC4899", verified: true, online: true, eta: 3, lat: 11.017, lng: 76.956, experience: "8yr", KaizyScore: 580 },
  { id: "W010", name: "Deepa K.", initials: "D", trade: "AC Repair", tradeIcon: "❄️", rating: 4.8, jobs: 178, dist: 1.1, price: 650, color: "#06B6D4", verified: true, online: true, eta: 7, lat: 11.014, lng: 76.953, experience: "9yr", KaizyScore: 720 },
];

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
    const workerPayout = subtotal - Math.round(subtotal * 0.05); // Worker gets 95% of subtotal

    return { base, distanceFee, urgencyMultiplier, peakMultiplier, total: subtotal, platformFee, insurance, grandTotal, workerPayout };
  }, []);

  // ── SEARCH: Find nearby workers ──
  const startSearch = useCallback((category: string, problem: string) => {
    setState(prev => ({ ...prev, status: "searching", selectedCategory: category, selectedProblem: problem }));
    
    // Simulate 2s search delay (like Uber spinning)
    setTimeout(() => {
      const matched = WORKERS_DB
        .filter(w => w.online && (category === "All" || w.trade === category))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5);

      setState(prev => ({
        ...prev,
        status: "matching",
        nearbyWorkers: WORKERS_DB.filter(w => w.online),
        matchedWorkers: matched.map(w => ({
          ...w,
          price: Math.round((BASE_RATES[w.trade] || 400) * (w.rating > 4.7 ? 1.1 : 1.0)),
        })),
      }));
    }, 2000);
  }, []);

  // ── SELECT WORKER + CALC PRICE ──
  const selectWorker = useCallback((worker: NearbyWorker) => {
    const pricing = calculatePricing(
      BASE_RATES[worker.trade] || 400,
      worker.dist,
      state.selectedProblem.includes("SOS") ? "sos" : "now"
    );
    setState(prev => ({ ...prev, selectedWorker: worker, pricing }));
  }, [calculatePricing, state.selectedProblem]);

  // ── CONFIRM BOOKING ──
  const confirmBooking = useCallback(() => {
    const bookingId = `BKG-${Date.now()}`;
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    setState(prev => ({
      ...prev,
      status: "matched",
      bookingId,
      otp,
      messages: [
        { id: "sys-1", sender: "system", text: "Booking confirmed! Waiting for worker to accept...", timestamp: Date.now(), read: true },
      ],
    }));

    // Simulate worker accept after 3s (like Uber)
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        status: "accepted",
        eta: prev.selectedWorker?.eta || 8,
        messages: [
          ...prev.messages,
          { id: "sys-2", sender: "system", text: `${prev.selectedWorker?.name} accepted your booking!`, timestamp: Date.now(), read: true },
          { id: "worker-1", sender: "worker", text: "Hello! I'm on my way. Will reach soon 🏍️", timestamp: Date.now() + 100, read: false },
        ],
      }));

      // Start en_route after 1s
      setTimeout(() => {
        setState(prev => ({ ...prev, status: "en_route" }));
      }, 1000);
    }, 3000);
  }, []);

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
