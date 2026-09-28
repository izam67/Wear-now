import Link from "next/link";

export function Wordmark({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const scale = {
    sm: "text-[0.9375rem] tracking-[0.3em]",
    md: "text-[1.0625rem] tracking-[0.3em]",
    lg: "text-[1.375rem] tracking-[0.32em]",
  }[size];

  return (
    <Link
      href="/"
      aria-label="Wear Now — home"
      className={`inline-flex shrink-0 items-center font-display leading-none font-medium tracking-normal ${scale} ${className}`}
    >
      <span className="sr-only">Wear Now</span>
      <span aria-hidden className="block">
        WEAR&nbsp;NOW
      </span>
    </Link>
  );
}
