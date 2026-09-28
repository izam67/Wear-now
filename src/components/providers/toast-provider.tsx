"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "error";

interface Toast {
  id: number;
  message: string;
  tone: Tone;
  /** Optional single action, e.g. "View bag". */
  action?: { label: string; href: string };
}

interface ToastContextValue {
  toast: (message: string, opts?: { tone?: Tone; action?: Toast["action"]; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    (message, opts) => {
      const id = nextId.current++;
      const entry: Toast = { id, message, tone: opts?.tone ?? "success", action: opts?.action };
      // Keep the stack shallow — a burst of add-to-bag taps shouldn't bury the screen.
      setToasts((current) => [...current.slice(-2), entry]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), opts?.duration ?? 3600),
      );
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-8"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-pill border py-2.5 pr-2.5 pl-4 shadow-[0_18px_40px_-20px_rgba(18,17,16,0.5)]",
              t.tone === "success" && "border-ink/10 bg-ink text-paper",
              t.tone === "info" && "border-line bg-paper text-ink",
              t.tone === "error" && "border-clay/20 bg-clay-soft text-clay",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full",
                t.tone === "success" && "bg-paper/15",
                t.tone === "info" && "bg-sand",
                t.tone === "error" && "bg-clay/15",
              )}
            >
              {t.tone === "error" ? <Info size={12} /> : <Check size={12} />}
            </span>
            <p className="flex-1 text-[0.8125rem] leading-snug">{t.message}</p>
            {t.action ? (
              <a
                href={t.action.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.14em] underline-offset-4 hover:underline",
                  t.tone === "success" ? "hover:bg-paper/12" : "hover:bg-sand",
                )}
              >
                {t.action.label}
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="grid size-7 shrink-0 place-items-center rounded-full opacity-55 transition-opacity hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
