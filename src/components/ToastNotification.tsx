"use client";

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from "react";

// ============================================================
// Kaizy — TOAST NOTIFICATIONS (Uber/Rapido style popups)
// Slide-down from top, auto-dismiss, action buttons
// ============================================================

interface Toast {
  id: string;
  type: "booking" | "payment" | "alert" | "success" | "info";
  title: string;
  body: string;
  icon: string;
  actions?: { label: string; onClick: () => void; primary?: boolean }[];
  duration?: number;
  actionLabel?: string;
}

interface ToastCtx {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastCtx>({} as ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    const dur = toast.duration || 5000;
    if (dur > 0) setTimeout(() => removeToast(id), dur);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ── DEMO: Auto-fire toasts to simulate real-time ──
export function ToastDemo() {
  const { addToast } = useToast();

  useEffect(() => {
    const demoToasts: Omit<Toast, "id">[] = [
      { type: "booking", icon: "📋", title: "New Job Request!", body: "MCB Panel repair at RS Puram — ₹800", duration: 8000 },
      { type: "alert", icon: "🆘", title: "SOS Alert Nearby", body: "Plumber needed urgently in Gandhipuram", duration: 10000 },
      { type: "payment", icon: "💰", title: "Payment Received", body: "₹600 credited to your Kaizy wallet", duration: 6000 },
      { type: "success", icon: "⭐", title: "New 5-Star Review!", body: "Vinod rated your work ⭐⭐⭐⭐⭐", duration: 6000 },
      { type: "info", icon: "📍", title: "Worker En Route", body: "Suresh is 3 min away from your location", duration: 7000 },
    ];

    // Fire a random toast every 12-20 seconds
    const interval = setInterval(() => {
      const t = demoToasts[Math.floor(Math.random() * demoToasts.length)];
      addToast(t);
    }, 12000 + Math.random() * 8000);

    // Fire first toast after 5s
    const first = setTimeout(() => {
      addToast(demoToasts[0]);
    }, 5000);

    return () => { clearInterval(interval); clearTimeout(first); };
  }, [addToast]);

  return null;
}

// ── Toast Container (renders at top of screen) ──
function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pt-2 px-3 pointer-events-none"
         style={{ gap: 8 }}>
      {toasts.slice(-3).map((toast, i) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} index={i} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss, index }: { toast: Toast; onDismiss: () => void; index: number }) {
  const [exiting, setExiting] = useState(false);

  const typeStyles: Record<string, { bg: string; border: string; accent: string }> = {
    booking: { bg: "var(--brand-tint)", border: "var(--brand)", accent: "var(--brand)" },
    payment: { bg: "var(--success-tint)", border: "var(--success)", accent: "var(--success)" },
    alert:   { bg: "var(--danger-tint)", border: "var(--danger)", accent: "var(--danger)" },
    success: { bg: "var(--warning-tint)", border: "var(--warning)", accent: "var(--warning)" },
    info:    { bg: "var(--info-tint)", border: "var(--info)", accent: "var(--info)" },
  };

  const style = typeStyles[toast.type] || typeStyles.info;

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className="w-full max-w-[360px] pointer-events-auto rounded-[16px] p-3 flex items-start gap-3 active:scale-[0.98] transition-all"
      onClick={handleDismiss}
      style={{
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        animation: exiting ? "slide-down 0.3s ease reverse forwards" : `slide-down 0.4s ease-out`,
        animationDelay: `${index * 0.05}s`,
        opacity: exiting ? 0 : 1,
      }}
    >
      <span className="text-[24px] shrink-0 mt-0.5">{toast.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>{toast.title}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-2)" }}>{toast.body}</p>
        {toast.actions && (
          <div className="flex gap-2 mt-2">
            {toast.actions.map(action => (
              <button key={action.label}
                      onClick={e => { e.stopPropagation(); action.onClick(); handleDismiss(); }}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-[8px] active:scale-95"
                      style={{
                        background: action.primary ? style.accent : "transparent",
                        color: action.primary ? "#fff" : style.accent,
                        border: action.primary ? "none" : `1px solid ${style.accent}`,
                      }}>
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={e => { e.stopPropagation(); handleDismiss(); }}
              className="text-[14px] shrink-0 mt-0.5 active:scale-90"
              style={{ color: "var(--text-3)" }}>✕</button>
    </div>
  );
}
