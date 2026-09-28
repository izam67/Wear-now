"use client";

import { useSyncExternalStore } from "react";

/**
 * Theme preference.
 *
 * The <html> class is already correct before React boots (see `theme-script.js`),
 * so this component never needs to *apply* the theme — it only mirrors whatever
 * the DOM says and writes changes back. Reading it through
 * `useSyncExternalStore` means light/dark toggles stay in sync across every
 * `useSyncExternalStore` consumer and multiple open tabs, with no effect and
 * therefore no flash.
 *
 * The three-state model matters: `system` is not the same as "currently light".
 * Someone whose OS is dark may deliberately choose light, and that preference
 * has to survive a reload.
 */
export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "wn.theme.v1";
const EVENT = "wearnow:themechange";

function systemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readChoice(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  // Following the OS live is only meaningful while the choice is `system`.
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    mq.removeEventListener("change", listener);
  };
}

function apply(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

/**
 * The choice is intentionally read from storage rather than derived from the
 * class: knowing that someone picked "dark" lets us show three options instead
 * of a two-state switch.
 */
function getSnapshot(): ThemeChoice {
  return readChoice();
}

function getServerSnapshot(): ThemeChoice {
  return "system";
}

export function useTheme() {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const resolved = choice === "system" ? systemTheme() : choice;

  const setTheme = (next: ThemeChoice) => {
    if (next === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
      apply(systemTheme());
    } else {
      window.localStorage.setItem(STORAGE_KEY, next);
      apply(next);
    }
    window.dispatchEvent(new Event(EVENT));
  };

  const toggle = () => setTheme(resolved === "dark" ? "light" : "dark");

  return { choice, resolved, setTheme, toggle };
}
