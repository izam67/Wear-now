"use client";

import { useEffect, useState } from "react";
import { ANNOUNCEMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Rotating announcement bar. Crossfades between messages rather than sliding,
 * and pauses entirely once the user has interacted with the page for a while —
 * an endlessly moving element is a distraction, not a feature.
 */
export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ANNOUNCEMENTS.length);
    }, 5200);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const onActivity = () => setPaused(true);
    const id = setTimeout(() => {
      window.addEventListener("pointerdown", onActivity, { once: true });
      window.addEventListener("keydown", onActivity, { once: true });
    }, 20000);
    return () => {
      clearTimeout(id);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, []);

  return (
    <div className="relative z-50 h-9 overflow-hidden bg-ink text-paper">
      <div
        className="container-page flex h-9 items-center justify-center"
        aria-live="polite"
        aria-atomic="true"
      >
        {ANNOUNCEMENTS.map((message, i) => (
          <p
            key={message}
            className={cn(
              "absolute text-[0.6875rem] font-medium tracking-[0.16em] uppercase transition-opacity duration-700",
              i === index ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {message}
          </p>
        ))}
      </div>
    </div>
  );
}
