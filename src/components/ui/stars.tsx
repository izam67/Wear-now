import { cn } from "@/lib/utils";

/**
 * Star rating.
 *
 * Ratings are whole numbers everywhere in the system, so this is a partial-fill
 * design rather than a true fractional one. The visual is decorative; the
 * numeric value is always exposed to assistive tech so the rating is never
 * conveyed by shape alone.
 */
export function Stars({
  rating,
  size = 14,
  count,
  tone = "default",
  showValue = false,
  className,
}: {
  rating: number;
  size?: number;
  count?: number;
  tone?: "default" | "light";
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  const filled = Math.max(0, Math.min(5, Math.round(rating * 2) / 2));

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span aria-hidden className="inline-flex items-center gap-px">
        {[1, 2, 3, 4, 5].map((position) => {
          const state = position <= filled ? "full" : position - 0.5 === filled ? "half" : "empty";
          return (
            <svg
              key={position}
              width={size}
              height={size}
              viewBox="0 0 20 20"
              className={cn(
                state === "empty" && "text-line",
                state !== "empty" && (tone === "light" ? "text-paper" : "text-clay"),
              )}
            >
              <defs>
                <linearGradient id={`half-${tone}-${position}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M10 1.6l2.47 5.28 5.53.72-4.06 3.9 1.03 5.6L10 14.4l-4.97 2.7 1.03-5.6L2 7.6l5.53-.72L10 1.6Z"
                fill={state === "half" ? `url(#half-${tone}-${position})` : "currentColor"}
                opacity={state === "empty" ? 0.35 : 1}
              />
            </svg>
          );
        })}
      </span>

      {showValue ? (
        <span
          className={cn(
            "text-[0.8125rem] tabular-nums",
            tone === "light" ? "text-paper/70" : "text-stone",
          )}
        >
          {rounded.toFixed(1)}
          {count !== undefined ? (
            <span className={tone === "light" ? "text-paper/45" : "text-mist"}> ({count})</span>
          ) : null}
        </span>
      ) : null}

      <span className="sr-only">
        Rated {rounded} out of 5{count !== undefined ? ` from ${count} reviews` : ""}.
      </span>
    </span>
  );
}

/** Compact histogram of rating distribution, used on product pages. */
export function RatingBars({
  breakdown,
  total,
  className,
}: {
  breakdown: Record<number, { count: number }>;
  total: number;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = breakdown[star]?.count ?? 0;
        const percent = total > 0 ? (count / total) * 100 : 0;
        return (
          <li key={star} className="flex items-center gap-2.5 text-[0.75rem]">
            <span className="w-8 shrink-0 tabular-nums text-stone">{star}★</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-sand">
              <span
                className="block h-full rounded-pill bg-clay transition-[width] duration-700"
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="w-6 shrink-0 text-right tabular-nums text-mist">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}
