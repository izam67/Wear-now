"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/components/providers/store-provider";

/**
 * Thumb-reachable navigation for phones. The five destinations here are the
 * ones people reach for mid-shop; everything else lives behind the menu.
 */
export function MobileTabBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();
  const { openCart, count } = useStore();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        <Tab href="/" label="Home" active={isActive("/")}>
          <HomeIcon />
        </Tab>

        <Tab href="/new-arrivals" label="New In" active={isActive("/new-arrivals")}>
          <SparkIcon />
        </Tab>

        <li>
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex w-full flex-col items-center gap-1 py-2.5 text-stone transition-colors active:text-ink"
          >
            <SearchIcon />
            <span className="text-[0.625rem] tracking-wide">Search</span>
          </button>
        </li>

        <Tab href="/wishlist" label="Saved" active={isActive("/wishlist")}>
          <HeartIcon />
        </Tab>

        <li>
          <button
            type="button"
            onClick={openCart}
            className="relative flex w-full flex-col items-center gap-1 py-2.5 text-stone transition-colors active:text-ink"
          >
            <span className="relative">
              <BagIcon />
              {count > 0 ? (
                <span className="absolute -top-1 -right-2 grid min-w-4 place-items-center rounded-full bg-clay px-1 text-[0.5625rem] font-medium leading-4 text-paper tabular-nums">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </span>
            <span className="text-[0.625rem] tracking-wide">Bag</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

function Tab({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex w-full flex-col items-center gap-1 py-2.5 transition-colors",
          active ? "text-ink" : "text-stone",
        )}
      >
        {children}
        <span className="text-[0.625rem] tracking-wide">{label}</span>
      </Link>
    </li>
  );
}

function HomeIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20h-5v-5.5H9V20H4v-9.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 3.5 13.9 9l5.6 1.9-5.6 2L12 18.5 10.1 12.9 4.5 11 10.1 9 12 3.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 20s-7.5-4.6-7.5-9.5A4.25 4.25 0 0 1 12 7.7a4.25 4.25 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" strokeLinejoin="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M5 8h14l-1 12H6L5 8Z" strokeLinejoin="round" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" strokeLinecap="round" />
    </svg>
  );
}
