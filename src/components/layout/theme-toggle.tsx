"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme, type ThemeChoice } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
  { value: "system", label: "System", icon: <SystemIcon /> },
];

/**
 * Theme picker.
 *
 * A cycling icon in the header, with the full three-way choice in a popover —
 * the toggle is for the common case, the menu is for people who actually want
 * "follow my system". Closes on Escape, outside click and focus loss.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { choice, resolved, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = OPTIONS.find((o) => o.value === choice)!;
  const isSystem = choice === "system";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Theme: ${active.label}${isSystem ? ` (currently ${resolved})` : ""}. Change theme`}
        className="grid size-10 place-items-center rounded-full transition-colors hover:bg-sand"
      >
        {/* The system option shows the OS icon, but tinted by what it resolves to. */}
        {choice === "dark" ? <MoonIcon /> : choice === "light" ? <SunIcon /> : <SystemIcon />}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Colour theme"
          className="animate-scale-in absolute right-0 z-50 mt-2 w-52 origin-top-right overflow-hidden rounded-lg border border-line bg-paper p-1.5 shadow-[0_18px_40px_-20px_rgb(var(--shadow-color)/0.35)]"
        >
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={option.value === choice}
              onClick={() => {
                setTheme(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[0.8125rem] transition-colors",
                option.value === choice
                  ? "bg-sand text-ink"
                  : "text-graphite hover:bg-sand/60 hover:text-ink",
              )}
            >
              <span aria-hidden className="text-stone">
                {option.icon}
              </span>
              {option.label}
              {option.value === choice ? (
                <span aria-hidden className="ml-auto text-[0.75rem] text-clay">
                  ✓
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z" strokeLinejoin="round" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16.5V20" strokeLinecap="round" />
    </svg>
  );
}
