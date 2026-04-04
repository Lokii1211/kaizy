"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ============================================================
// AUTH PROVIDER — Eliminates role flash bug
// Reads localStorage synchronously on mount, verifies with API
// ============================================================

interface AuthUser {
  id: string;
  name: string;
  phone: string;
  user_type: "worker" | "hirer";
  trade?: string;
  kaizy_score?: number;
  verified?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  userType: "worker" | "hirer" | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  setUserType: (type: "worker" | "hirer") => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, userType: null, loading: true, isAuthenticated: false,
  login: () => {}, logout: () => {}, setUserType: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // Read from localStorage SYNCHRONOUSLY on first render (no flash)
  const [userType, setUserTypeState] = useState<"worker" | "hirer" | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("kaizy_user_type");
      if (stored === "worker" || stored === "hirer") return stored;
    } catch {}
    // Fallback: check cookie
    try {
      const cookies = document.cookie.split(';').reduce((acc, c) => {
        const [k, v] = c.trim().split('=');
        if (k && v) acc[k] = v;
        return acc;
      }, {} as Record<string, string>);
      if (cookies.kaizy_user_type === "worker" || cookies.kaizy_user_type === "hirer")
        return cookies.kaizy_user_type as "worker" | "hirer";
    } catch {}
    return null;
  });

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Verify with backend in background
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success && json.data) {
          const apiUser: AuthUser = {
            id: json.data.id,
            name: json.data.name || json.data.phone?.replace('+91', '') || 'User',
            phone: json.data.phone || '',
            user_type: json.data.user_type || json.data.userType || userType || 'hirer',
            trade: json.data.trade,
            kaizy_score: json.data.kaizy_score,
            verified: json.data.verified,
          };
          setUser(apiUser);
          // Sync role if different from stored
          if (apiUser.user_type !== userType) {
            setUserTypeState(apiUser.user_type);
            try {
              localStorage.setItem("kaizy_user_type", apiUser.user_type);
              document.cookie = `kaizy_user_type=${apiUser.user_type};path=/;max-age=31536000`;
            } catch {}
          }
        }
      } catch {}
      finally { setLoading(false); }
    };
    verifyAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = (u: AuthUser) => {
    setUser(u);
    setUserTypeState(u.user_type);
    try {
      localStorage.setItem("kaizy_user_type", u.user_type);
      localStorage.setItem("kaizy_user_phone", u.phone);
      localStorage.setItem("kaizy_user_name", u.name);
      document.cookie = `kaizy_user_type=${u.user_type};path=/;max-age=31536000`;
    } catch {}
  };

  const logout = () => {
    setUser(null);
    setUserTypeState(null);
    try {
      localStorage.removeItem("kaizy_user_type");
      localStorage.removeItem("kaizy_user_phone");
      localStorage.removeItem("kaizy_user_name");
      document.cookie = "kaizy_user_type=;path=/;max-age=0";
      document.cookie = "kaizy_token=;path=/;max-age=0";
    } catch {}
  };

  const setUserType = (type: "worker" | "hirer") => {
    setUserTypeState(type);
    try {
      localStorage.setItem("kaizy_user_type", type);
      document.cookie = `kaizy_user_type=${type};path=/;max-age=31536000`;
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user, userType, loading,
      isAuthenticated: !!user || !!userType,
      login, logout, setUserType,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// ============================================================
// SKELETON LOADER — Shows while role is being determined
// Never shows wrong dashboard content
// ============================================================
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
      {/* Top bar shimmer */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="skeleton h-3 w-20 rounded-full mb-2" />
            <div className="skeleton h-6 w-40 rounded-full" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton w-9 h-9 rounded-xl" />
            <div className="skeleton w-9 h-9 rounded-xl" />
          </div>
        </div>
        {/* Toggle shimmer */}
        <div className="skeleton h-16 w-full rounded-[20px]" />
      </div>

      {/* Stats shimmer */}
      <div className="grid grid-cols-3 gap-2.5 px-5 mb-5">
        <div className="skeleton h-20 rounded-[16px]" />
        <div className="skeleton h-20 rounded-[16px]" />
        <div className="skeleton h-20 rounded-[16px]" />
      </div>

      {/* Quick actions shimmer */}
      <div className="px-5 mb-5">
        <div className="skeleton h-3 w-24 rounded-full mb-3" />
        <div className="grid grid-cols-3 gap-2.5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton h-16 rounded-[14px]" />
          ))}
        </div>
      </div>

      {/* Alert cards shimmer */}
      <div className="px-5 space-y-2">
        <div className="skeleton h-3 w-20 rounded-full mb-3" />
        <div className="skeleton h-20 rounded-[18px]" />
        <div className="skeleton h-20 rounded-[18px]" />
      </div>

      {/* Bottom nav shimmer */}
      <div className="fixed bottom-0 left-0 right-0 h-[72px] skeleton" />
    </div>
  );
}
