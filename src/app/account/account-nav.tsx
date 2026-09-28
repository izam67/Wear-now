"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Account sidebar.
 *
 * A client component only because the active link depends on the pathname.
 * The nav itself is data, so every section reuses the same markup.
 */
export function AccountNav({
  items,
}: {
  items: { href: string; label: string; count?: number }[];
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-32 lg:self-start">
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          // `/account` must not stay highlighted while on `/account/orders`.
          const active =
            pathname === item.href ||
            (item.href !== "/account" && pathname.startsWith(`${item.href}/`));

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[0.8125rem] transition-colors",
                  active ? "bg-ink text-paper" : "text-graphite hover:bg-sand hover:text-ink",
                )}
              >
                {item.label}
                {item.count ? (
                  <span
                    className={cn(
                      "text-[0.6875rem] tabular-nums",
                      active ? "opacity-70" : "text-mist",
                    )}
                  >
                    {item.count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
