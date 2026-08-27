"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; tone: "neutral" | "success" | "critical" };
type ToastContextValue = {
  notify: (message: string, tone?: Toast["tone"]) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((message: string, tone: Toast["tone"] = "neutral") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      4_500
    );
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(92vw,380px)] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "critical" ? "alert" : "status"}
            className={`pointer-events-auto border p-4 text-sm shadow-xl ${
              toast.tone === "critical"
                ? "border-[#8e4a43]/30 bg-[#f1dedb]"
                : toast.tone === "success"
                  ? "border-[#557863]/30 bg-[#dfe9e1]"
                  : "border-[var(--bare-rule-strong)] bg-paper"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
