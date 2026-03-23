// Kaizy API Client — Central data fetching utilities
// Used across all pages for consistent API communication

const API_BASE = "/api";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========== GENERIC FETCH ==========
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[Kaizy API] ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// ========== AUTH (Real Supabase OTP) ==========
export const authApi = {
  sendOtp: async (phone: string) => {
    const cleanPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
    return apiFetch<{ expires_in: number; debug_otp?: string; fallback_otp?: string; sms_sent?: boolean }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone: cleanPhone }),
    });
  },

  verifyOtp: async (phone: string, otp: string, userType: "worker" | "hirer") => {
    const cleanPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
    return apiFetch<{ user: { id: string; name: string; userType: string }; token: string; isNewUser: boolean }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone: cleanPhone, otp, userType }),
    });
  },

  me: () => apiFetch<{ id: string; name: string; user_type: string }>("/auth/me"),

  logout: async () => {
    document.cookie = 'kaizy_token=; Max-Age=0; path=/';
    return { success: true };
  },
};

// ========== WORKERS ==========
export interface Worker {
  id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  skills: string[];
  specializations: string[];
  experience: string;
  rating: number;
  jobsCompleted: number;
  konnectScore: number;
  verified: boolean;
  available: boolean;
  languages: string[];
  rate: { min: number; max: number };
  createdAt: string;
}

export const workersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<Worker[]>(`/workers${query}`);
  },

  search: (q: string) =>
    apiFetch<Worker[]>(`/workers?q=${encodeURIComponent(q)}`),

  register: (data: {
    name: string;
    phone: string;
    city: string;
    skills: string[];
    experience?: string;
    language?: string;
  }) =>
    apiFetch<Worker>("/workers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ========== JOBS ==========
export interface Job {
  id: string;
  title: string;
  description: string;
  hirerId: string;
  hirerName: string;
  skillRequired: string;
  specializations: string[];
  city: string;
  locality: string;
  amount: number;
  status: string;
  urgency: string;
  duration: string;
  postedAt: string;
}

export const jobsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<Job[]>(`/jobs${query}`);
  },

  create: (data: {
    title: string;
    skillRequired: string;
    city: string;
    amount: number;
    description?: string;
    locality?: string;
    urgency?: string;
    duration?: string;
  }) =>
    apiFetch<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ========== BOOKINGS ==========
export interface Booking {
  id: string;
  jobId: string;
  workerId: string;
  hirerId: string;
  workerName: string;
  hirerName: string;
  skill: string;
  task: string;
  amount: number;
  platformFee: number;
  workerPayout: number;
  escrowStatus: string;
  paymentMethod: string;
  scheduledDate: string;
  completedAt: string | null;
  rating: number | null;
  review: string | null;
}

export const bookingsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<Booking[]>(`/bookings${query}`);
  },

  create: (data: {
    jobId: string;
    workerId: string;
    hirerId: string;
    amount: number;
    scheduledDate?: string;
    upiId?: string;
  }) =>
    apiFetch<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (bookingId: string, action: string, rating?: number, review?: string) =>
    apiFetch<Booking>("/bookings", {
      method: "PATCH",
      body: JSON.stringify({ bookingId, action, rating, review }),
    }),
};

// ========== AI MATCH ==========
export interface MatchResult {
  workerId: string;
  workerName: string;
  skill: string;
  matchScore: number;
  matchReasons: string[];
  rating: number;
  konnectScore: number;
  rate: { min: number; max: number };
  distance: string;
  available: boolean;
  verified: boolean;
}

export const matchApi = {
  search: (query: string, options?: { city?: string; maxBudget?: number; requireVerified?: boolean }) =>
    apiFetch<{ matches: MatchResult[]; total: number }>("/match", {
      method: "POST",
      body: JSON.stringify({ query, ...options }),
    }),

  findWorkers: (data: { trade?: string; lat?: number; lng?: number; maxDistance?: number; onlineOnly?: boolean; sortBy?: "smart" | "distance" | "rating" | "price"; limit?: number }) =>
    apiFetch("/match", { method: "POST", body: JSON.stringify(data) }),

  quickSearch: (trade: string, lat?: number, lng?: number) =>
    apiFetch(`/match?trade=${trade}&lat=${lat || 11.0168}&lng=${lng || 76.9558}`),
};

// ========== ANALYTICS ==========
export const analyticsApi = {
  get: (period?: string) =>
    apiFetch(`/analytics${period ? `?period=${period}` : ""}`),
};

// ========== PAYMENTS (Razorpay Escrow) ==========
export const paymentsApi = {
  createOrder: (data: { bookingId: string; amount: number; workerName?: string; hirerName?: string; description?: string }) =>
    apiFetch("/payments", { method: "POST", body: JSON.stringify({ action: "create_order", ...data }) }),

  verifyPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; bookingId: string }) =>
    apiFetch("/payments", { method: "POST", body: JSON.stringify({ action: "verify_payment", ...data }) }),

  releasePayout: (data: { bookingId: string; workerId: string; amount: number; upiId: string }) =>
    apiFetch("/payments", { method: "POST", body: JSON.stringify({ action: "release_payout", ...data }) }),

  calculate: (amount: number) =>
    apiFetch("/payments", { method: "POST", body: JSON.stringify({ action: "calculate", amount }) }),
};

// ========== KYC (Aadhaar + DigiLocker) ==========
export const kycApi = {
  initiateAadhaar: (aadhaarNumber: string) =>
    apiFetch("/kyc", { method: "POST", body: JSON.stringify({ action: "initiate_aadhaar", aadhaarNumber }) }),

  verifyAadhaar: (requestId: string, otp: string) =>
    apiFetch("/kyc", { method: "POST", body: JSON.stringify({ action: "verify_aadhaar", requestId, otp }) }),

  pullCertificates: (accessToken?: string) =>
    apiFetch("/kyc", { method: "POST", body: JSON.stringify({ action: "pull_certificates", accessToken }) }),

  faceMatch: (selfieBase64: string) =>
    apiFetch("/kyc", { method: "POST", body: JSON.stringify({ action: "face_match", selfieBase64 }) }),
};

// ========== WHATSAPP ==========
export const whatsappApi = {
  sendJobAlert: (data: { workerPhones: string[]; jobTitle: string; location: string; amount: number; timing?: string }) =>
    apiFetch("/whatsapp", { method: "POST", body: JSON.stringify({ action: "job_alert", ...data }) }),

  sendEmergencyAlert: (data: { workerPhones: string[]; category: string; location: string; hirerName: string; amount: number }) =>
    apiFetch("/whatsapp", { method: "POST", body: JSON.stringify({ action: "emergency_alert", ...data }) }),
};

// ========== DYNAMIC PRICING ==========
export const pricingApi = {
  calculate: (data: { trade: string; distance?: number; urgency?: "normal" | "now" | "sos"; complexity?: number; scheduledTime?: string }) =>
    apiFetch("/pricing", { method: "POST", body: JSON.stringify(data) }),
};

// ========== LIVE TRACKING ==========
export const trackingApi = {
  start: (data: { bookingId: string; workerId?: string; workerName?: string; destLat?: number; destLng?: number }) =>
    apiFetch("/tracking", { method: "POST", body: JSON.stringify({ action: "start", ...data }) }),

  update: (bookingId: string) =>
    apiFetch("/tracking", { method: "POST", body: JSON.stringify({ action: "update", bookingId }) }),

  getStatus: (bookingId: string) =>
    apiFetch(`/tracking?bookingId=${bookingId}`),

  verifyOtp: (bookingId: string, otp: string) =>
    apiFetch("/tracking", { method: "POST", body: JSON.stringify({ action: "verify_otp", bookingId, otp }) }),

  complete: (bookingId: string) =>
    apiFetch("/tracking", { method: "POST", body: JSON.stringify({ action: "complete", bookingId }) }),
};

// ========== REAL-TIME CHAT ==========
export const chatApi = {
  send: (bookingId: string, text: string, sender: "hirer" | "worker" = "hirer") =>
    apiFetch("/chat", { method: "POST", body: JSON.stringify({ action: "send", bookingId, text, sender }) }),

  history: (bookingId: string) =>
    apiFetch(`/chat?bookingId=${bookingId}`),

  markRead: (bookingId: string) =>
    apiFetch("/chat", { method: "POST", body: JSON.stringify({ action: "mark_read", bookingId }) }),
};

// ========== DISPATCH ENGINE ==========
export const dispatchApi = {
  start: (data: { jobId: string; trade: string; hirerLat?: number; hirerLng?: number; urgency?: string; estimatedPrice?: number; address?: string }) =>
    apiFetch("/dispatch", { method: "POST", body: JSON.stringify({ action: "start", ...data }) }),

  accept: (jobId: string, workerId: string) =>
    apiFetch("/dispatch", { method: "POST", body: JSON.stringify({ action: "accept", jobId, workerId }) }),

  decline: (jobId: string, workerId: string, reason?: string) =>
    apiFetch("/dispatch", { method: "POST", body: JSON.stringify({ action: "decline", jobId, workerId, reason }) }),

  status: (jobId: string) =>
    apiFetch("/dispatch", { method: "POST", body: JSON.stringify({ action: "status", jobId }) }),

  nextRound: (jobId: string, trade: string) =>
    apiFetch("/dispatch", { method: "POST", body: JSON.stringify({ action: "next_round", jobId, trade }) }),
};

// ========== NOTIFICATIONS ==========
export const notificationApi = {
  send: (userId: string, type: string, data: Record<string, unknown>) =>
    apiFetch("/notifications", { method: "POST", body: JSON.stringify({ action: "send", userId, type, data }) }),

  list: (userId: string, limit?: number) =>
    apiFetch(`/notifications?userId=${userId}&limit=${limit || 20}`),

  markRead: (userId: string, notificationId: string) =>
    apiFetch("/notifications", { method: "POST", body: JSON.stringify({ action: "mark_read", userId, notificationId }) }),

  markAllRead: (userId: string) =>
    apiFetch("/notifications", { method: "POST", body: JSON.stringify({ action: "mark_all_read", userId }) }),
};

// ========== HELPERS ==========
export const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString("en-IN")}`;

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase();

