"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { IMG } from "@/lib/images";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Reduced motion
 *
 * `prefers-reduced-motion` is an external system React should subscribe to
 * rather than a value mirrored into state from an effect. `getServerSnapshot`
 * returns `false` so the server and the first client render agree; the real
 * value arrives on the first commit, before anything animates.
 * ------------------------------------------------------------------ */

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(listener: () => void) {
  const mq = window.matchMedia(MOTION_QUERY);
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

const readMotion = () => window.matchMedia(MOTION_QUERY).matches;

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeMotion, readMotion, () => false);
}

/**
 * Homepage hero.
 *
 * A slow crossfade between editorial frames rather than a carousel: no dots, no
 * autoplay controls to fight with, and the copy rotates with the image so the
 * page never has a headline sitting on top of an unrelated photo. Reduced-motion
 * users get the first frame only.
 */
const FRAMES = [
  {
    eyebrow: "Autumn / Winter 2026",
    title: "The season,\nconsidered.",
    body: "A wardrobe of 40 pieces that work harder than 400. Cut for movement, chosen to last.",
    cta: { label: "Shop new arrivals", href: "/new-arrivals" },
    secondary: { label: "The tailoring edit", href: "/category/women?type=blazer" },
    image: "photo-1490481651871-ab68de25d43d",
  },
  {
    eyebrow: "Made to be worn",
    title: "Cashmere,\nunhurried.",
    body: "Grade-A Mongolian cashmere, knitted in Italy and washed soft before it ever reaches you.",
    cta: { label: "Explore knitwear", href: "/category/women?type=knitwear" },
    secondary: { label: "Leather goods", href: "/category/bags" },
    image: "photo-1515886657613-9f3515b0c78f",
  },
  {
    eyebrow: "Foundations",
    title: "Shoes that\noutlast trends.",
    body: "Hand-finished leather, Blake-stitched and resolable. Buy them once, keep them a decade.",
    cta: { label: "Shop shoes", href: "/category/shoes" },
    secondary: { label: "Size guide", href: "/help/size-guide" },
    image: "photo-1549298916-b41d501d3772",
  },
] as const;

export function Hero() {
  const [index, setIndex] = useState(0);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % FRAMES.length), 7000);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const frame = FRAMES[index]!;

  return (
    <section className="relative isolate overflow-hidden bg-ink">
      {/* Frames */}
      <div className="relative h-[78svh] min-h-540px w-full">
        {FRAMES.map((f, i) => (
          <Image
            key={f.image}
            src={IMG.hero(f.image)}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            aria-hidden
            className={cn(
              "object-cover transition-opacity duration-1000 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
              i === index ? "opacity-100" : "opacity-0",
              reduceMotion && "transition-none",
            )}
          />
        ))}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/45 to-ink/10"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent"
        />

        {/* Copy */}
        <div className="absolute inset-0 flex items-end">
          <div className="container-page pb-16 md:pb-24">
            <div key={frame.image} className="animate-fade-up max-w-xl text-paper">
              <p className="eyebrow text-paper/70">{frame.eyebrow}</p>
              <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.05] tracking-tight">
                {frame.title.split("\n").map((line, i) => (
                  <span key={line} className="block">
                    {i === frame.title.split("\n").length - 1 ? <em>{line}</em> : line}
                  </span>
                ))}
              </h1>
              <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-paper/80 sm:text-base">
                {frame.body}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href={frame.cta.href}
                  className="rounded-pill bg-paper px-7 py-3.5 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-sand"
                >
                  {frame.cta.label}
                </Link>
                <Link
                  href={frame.secondary.href}
                  className="rounded-pill border border-paper/40 px-7 py-3.5 text-[0.8125rem] font-medium text-paper transition-colors hover:border-paper hover:bg-paper/10"
                >
                  {frame.secondary.label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frame indicators */}
      {!reduceMotion && FRAMES.length > 1 ? (
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
          {FRAMES.map((f, i) => (
            <button
              key={f.image}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}: ${f.eyebrow}`}
              aria-current={i === index}
              className="group grid h-6 w-8 place-items-center"
            >
              <span
                className={cn(
                  "block h-0.5 rounded-pill transition-all duration-500",
                  i === index ? "w-8 bg-paper" : "w-4 bg-paper/40 group-hover:bg-paper/70",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
