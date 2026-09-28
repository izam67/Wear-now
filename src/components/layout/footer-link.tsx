import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Footer links. External links get the rel/aria treatment and an arrow, and
 * every link is explicitly typed as `next/link` so client-side navigation keeps
 * working across the site.
 */
export function FooterLink({
  href,
  external,
  children,
  className,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const base = cn(
    "inline-block text-[0.875rem] text-graphite underline-offset-4 transition-colors hover:text-ink hover:underline",
    className,
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn(base, "group")}>
        {children}
        <span className="ml-1 text-mist transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden>
          ↗
        </span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={base}>
      {children}
    </Link>
  );
}
