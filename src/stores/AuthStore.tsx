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
      const r = cookies.kaizy_role || cookies.kaizy_user_type;
      if (r === "worker" || r === "hirer") return r as "worker" | "hirer";
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
            user_type: (json.data.user_type || json.data.userType || userType) as "worker" | "hirer",
            trade: json.data.trade,
            kaizy_score: json.data.kaizy_score,
            verified: json.data.verified,
          };
          setUser(apiUser);
          try {
            localStorage.setItem("kaizy_user_id", apiUser.id);
          } catch {}
          // Sync role if different from stored
          if (apiUser.user_type !== userType) {
            setUserTypeState(apiUser.user_type);
            try {
              localStorage.setItem("kaizy_user_type", apiUser.user_type);
              document.cookie = `kaizy_user_type=${apiUser.user_type};path=/;max-age=31536000`;
              document.cookie = `kaizy_role=${apiUser.user_type};path=/;max-age=31536000`;
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
      localStorage.setItem("kaizy_user_id", u.id);
      localStorage.setItem("kaizy_user_type", u.user_type);
      localStorage.setItem("kaizy_user_phone", u.phone);
      localStorage.setItem("kaizy_user_name", u.name);
      document.cookie = `kaizy_user_type=${u.user_type};path=/;max-age=31536000`;
      document.cookie = `kaizy_role=${u.user_type};path=/;max-age=31536000`;
    } catch {}
  };

  const logout = () => {
    setUser(null);
    setUserTypeState(null);
    try {
      localStorage.removeItem("kaizy_user_id");
      localStorage.removeItem("kaizy_user_type");
      localStorage.removeItem("kaizy_user_phone");
      localStorage.removeItem("kaizy_user_name");
      document.cookie = "kaizy_user_type=;path=/;max-age=0";
      document.cookie = "kaizy_role=;path=/;max-age=0";
      document.cookie = "kaizy_token=;path=/;max-age=0";
    } catch {}
  };

  const setUserType = (type: "worker" | "hirer") => {
    setUserTypeState(type);
    try {
      localStorage.setItem("kaizy_user_type", type);
      document.cookie = `kaizy_user_type=${type};path=/;max-age=31536000`;
      document.cookie = `kaizy_role=${type};path=/;max-age=31536000`;
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user, userType, loading,
      isAuthenticated: !!user,
      login, logout, setUserType,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import LoadingShell from "@/components/LoadingShell";

// ============================================================
// SKELETON LOADER — Shows while role is being determined
// Zero content, 3 shimmer bars + bottom nav skeleton
// ============================================================
export function DashboardSkeleton() {
  return <LoadingShell />;
}
