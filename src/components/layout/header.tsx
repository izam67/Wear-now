"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { POOL } from "@/lib/images";
import { Wordmark } from "./wordmark";
import { ThemeToggle } from "./theme-toggle";
import { useStore } from "@/components/providers/store-provider";

/* ------------------------------------------------------------------ *
 * Desktop mega menu
 * ------------------------------------------------------------------ */

interface MenuItem {
  label: string;
  href: string;
  image: string;
  blurb: string;
}

const MENUS: Record<string, { items: MenuItem[]; feature?: MenuItem }> = {
  Women: {
    items: [
      { label: "Dresses", href: "/category/women?type=dress", image: POOL.editorial[0], blurb: "Fluid silhouettes for every hour" },
      { label: "Tailoring", href: "/category/women?type=blazer", image: POOL.menswear[1], blurb: "Structured, shoulder-first" },
      { label: "Knitwear", href: "/category/women?type=knitwear", image: POOL.editorial[3], blurb: "Cashmere and merino" },
      { label: "Outerwear", href: "/category/women?type=outerwear", image: POOL.editorial[5], blurb: "Trenches and wool coats" },
    ],
    feature: { label: "The New Season", href: "/new-arrivals", image: POOL.editorial[6], blurb: "Autumn/Winter 2026" },
  },
  Men: {
    items: [
      { label: "Shirts", href: "/category/men?type=shirt", image: POOL.menswear[5], blurb: "Oxford, poplin, linen" },
      { label: "Tailoring", href: "/category/men?type=blazer", image: POOL.menswear[2], blurb: "Unstructured and soft" },
      { label: "Knitwear", href: "/category/men?type=knitwear", image: POOL.menswear[8], blurb: "Merino and cotton" },
      { label: "Outerwear", href: "/category/men?type=outerwear", image: POOL.menswear[16], blurb: "Coats and bombers" },
    ],
    feature: { label: "Modern Tailoring", href: "/new-arrivals?g=men", image: POOL.menswear[9], blurb: "Quietly sharp" },
  },
  Shoes: {
    items: [
      { label: "Loafers", href: "/category/shoes?type=loafer", image: POOL.shoes[1], blurb: "Hand-finished leather" },
      { label: "Heels", href: "/category/shoes?type=heel", image: POOL.shoes[5], blurb: "Sculptural shapes" },
      { label: "Boots", href: "/category/shoes?type=boot", image: POOL.shoes[9], blurb: "Chelsea and ankle" },
      { label: "Flats", href: "/category/shoes?type=flat", image: POOL.shoes[13], blurb: "Ballet and mule" },
    ],
    feature: { label: "Leather Guide", href: "/help/leather-care", image: POOL.shoes[0], blurb: "Care that lasts" },
  },
  Jewelry: {
    items: [
      { label: "Fine Jewelry", href: "/category/jewelry?type=fine", image: POOL.jewelry[0], blurb: "Solid gold and silver" },
      { label: "Earrings", href: "/category/jewelry?type=earrings", image: POOL.jewelry[2], blurb: "Hoops and drops" },
      { label: "Necklaces", href: "/category/jewelry?type=necklace", image: POOL.jewelry[5], blurb: "Layering pieces" },
      { label: "Rings & Bracelets", href: "/category/jewelry?type=rings", image: POOL.jewelry[7], blurb: "Everyday signatures" },
    ],
  },
  Accessories: {
    items: [
      { label: "Bags", href: "/category/bags", image: POOL.bags[0], blurb: "Totes, crossbody, clutches" },
      { label: "Belts", href: "/category/accessories?type=belt", image: POOL.accessories[2], blurb: "Vegetable-tanned" },
      { label: "Scarves", href: "/category/accessories?type=scarf", image: POOL.accessories[3], blurb: "Silk and cashmere" },
      { label: "Eyewear", href: "/category/accessories?type=eyewear", image: POOL.accessories[0], blurb: "Acetate frames" },
    ],
  },
};

function MegaMenu({ name }: { name: string }) {
  const menu = MENUS[name];
  if (!menu) return null;

  return (
    <div className="animate-fade-up absolute inset-x-0 top-full border-t border-line bg-paper">
      <div className="container-page grid grid-cols-12 gap-8 py-10">
        <ul className={cn("col-span-7 grid grid-cols-2 gap-x-8 gap-y-7", menu.feature && "col-span-5")}>
          {menu.items.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="group/item block">
                <p className="text-[0.9375rem] group-hover/item:underline group-hover/item:underline-offset-4">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[0.75rem] text-stone">{item.blurb}</p>
              </Link>
            </li>
          ))}
          <li className="col-span-2 border-t border-line pt-5">
            <Link
              href={`/category/${name === "Women" ? "women" : name === "Men" ? "men" : name.toLowerCase()}`}
              className="text-[0.8125rem] text-stone underline underline-offset-4 transition-colors hover:text-ink"
            >
              View all {name}
            </Link>
          </li>
        </ul>

        {menu.feature ? (
          <Link
            href={menu.feature.href}
            className="group/feature relative col-span-3 aspect-[4/5] overflow-hidden rounded-lg bg-sand"
          >
            <Image
              src={`https://images.unsplash.com/${menu.feature.image}?auto=format&fit=crop&w=700&q=72`}
              alt=""
              fill
              sizes="(min-width: 1024px) 20vw, 0px"
              className="object-cover transition-transform duration-700 group-hover/feature:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-5">
              <p className="font-display text-lg text-paper">{menu.feature.label}</p>
              <p className="text-[0.75rem] text-paper/75">{menu.feature.blurb}</p>
            </div>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Header
 * ------------------------------------------------------------------ */

export function Header({
  signedIn,
  onOpenSearch,
}: {
  signedIn: boolean;
  onOpenSearch: () => void;
}) {
  const pathname = usePathname();
  const { wishlist, count, openCart } = useStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Close every menu when the route changes. Adjusting state during render is
   * React's documented alternative to an effect here — it re-renders before
   * painting, so a stale mega menu is never visible on the new page. */
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
  }

  /* Condense the bar once the page moves. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Sticky mega menus shouldn't survive a tab-out. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenMenu(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const hoverOpen = (name: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(name);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const hoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    // A small delay makes diagonal travel from the trigger to the panel possible.
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-paper/92 backdrop-blur-md transition-[border-color,box-shadow] duration-300",
          scrolled ? "border-line shadow-[0_1px_30px_-12px_rgba(18,17,16,0.18)]" : "border-transparent",
        )}
        onMouseLeave={hoverClose}
      >
        <div
          className={cn(
            "container-page flex items-center justify-between gap-4 transition-[height] duration-300",
            scrolled ? "h-14" : "h-18",
          )}
        >
          {/* Left: menu (mobile) or nav (desktop) */}
          <nav aria-label="Primary" className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="-ml-2 mr-1 grid size-10 place-items-center rounded-full transition-colors hover:bg-sand lg:hidden"
            >
              <span className="flex flex-col gap-1.5" aria-hidden>
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-3.5 bg-current" />
              </span>
            </button>

            <ul className="hidden items-center gap-7 lg:flex">
              {[
                { label: "New Arrivals", href: "/new-arrivals" },
                { label: "Women", href: "/category/women", menu: true },
                { label: "Men", href: "/category/men", menu: true },
                { label: "Shoes", href: "/category/shoes", menu: true },
                { label: "Jewelry", href: "/category/jewelry", menu: true },
                { label: "Accessories", href: "/category/bags", menu: "Accessories" },
                { label: "Sale", href: "/sale" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onMouseEnter={() => (item.menu ? hoverOpen(String(item.menu)) : hoverClose())}
                    onFocus={() => (item.menu ? hoverOpen(String(item.menu)) : hoverClose())}
                    className={cn(
                      "relative flex items-center gap-1 py-2 text-[0.8125rem] tracking-wide transition-colors",
                      isActive(item.href) ? "text-ink" : "text-graphite hover:text-ink",
                    )}
                  >
                    {item.label}
                    {item.menu ? (
                      <ChevronDown
                        size={12}
                        strokeWidth={1.6}
                        aria-hidden
                        className={cn(
                          "text-mist transition-transform duration-300",
                          openMenu === item.menu && "rotate-180",
                        )}
                      />
                    ) : null}
                    {item.label === "Sale" ? (
                      <span className="absolute -top-0.5 -right-2.5 size-1 rounded-full bg-clay" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Center: wordmark */}
          <Wordmark size={scrolled ? "sm" : "md"} className="absolute left-1/2 -translate-x-1/2" />

          {/* Right: actions */}
          <div className="flex flex-1 items-center justify-end gap-0.5">
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search"
              className="grid size-10 place-items-center rounded-full transition-colors hover:bg-sand"
            >
              <SearchIcon />
            </button>

            <Link
              href={signedIn ? "/account" : "/login"}
              aria-label={signedIn ? "Your account" : "Sign in"}
              className="hidden size-10 place-items-center rounded-full transition-colors hover:bg-sand sm:grid"
            >
              <UserIcon />
            </Link>

            <ThemeToggle />

            <Link
              href="/wishlist"
              aria-label={wishlist.length > 0 ? `Wishlist, ${wishlist.length} items` : "Wishlist"}
              className="relative hidden size-10 place-items-center rounded-full transition-colors hover:bg-sand sm:grid"
            >
              <HeartIcon />
              {wishlist.length > 0 ? (
                <span className="absolute top-1 right-0.5 grid min-w-4.5 place-items-center rounded-full bg-ink px-1 text-[0.625rem] font-medium leading-4.5 text-paper tabular-nums">
                  {wishlist.length > 99 ? "99+" : wishlist.length}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={openCart}
              aria-label={count > 0 ? `Open bag, ${count} items` : "Open bag"}
              className="relative grid size-10 place-items-center rounded-full transition-colors hover:bg-sand"
            >
              <BagIcon />
              {count > 0 ? (
                <span className="absolute top-1 right-0.5 grid min-w-4.5 place-items-center rounded-full bg-clay px-1 text-[0.625rem] font-medium leading-4.5 text-paper tabular-nums">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Mega menu panel */}
        {openMenu ? (
          <div onMouseEnter={cancelClose} onMouseLeave={hoverClose}>
            <MegaMenu name={openMenu} />
          </div>
        ) : null}
      </header>

      {/* ---- Mobile drawer ---- */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[86] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="animate-fade-in absolute inset-0 cursor-default bg-ink/35 backdrop-blur-[3px]"
          />
          <div className="animate-slide-in absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-paper">
            <div className="flex h-18 items-center justify-between border-b border-line px-5">
              <span className="text-[0.6875rem] tracking-[0.2em] uppercase text-stone">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="-mr-2 grid size-10 place-items-center rounded-full text-stone hover:bg-sand hover:text-ink"
              >
                <CloseIcon />
              </button>
            </div>

            <nav aria-label="Mobile" className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
              <ul className="flex flex-col">
                {[
                  { label: "New Arrivals", href: "/new-arrivals" },
                  { label: "Women", href: "/category/women" },
                  { label: "Men", href: "/category/men" },
                  { label: "Shoes", href: "/category/shoes" },
                  { label: "Jewelry", href: "/category/jewelry" },
                  { label: "Bags", href: "/category/bags" },
                  { label: "Accessories", href: "/category/accessories" },
                ].map((item) => (
                  <li key={item.label} className="border-b border-line last:border-0">
                    <Link
                      href={item.href}
                      className="flex items-center justify-between py-4 font-display text-2xl"
                    >
                      {item.label}
                      <span className="text-mist" aria-hidden>→</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href="/sale"
                className="mt-6 flex items-center justify-center rounded-pill bg-clay-soft py-3.5 text-[0.8125rem] font-medium text-clay"
              >
                Sale — up to 40% off
              </Link>

              <ul className="mt-8 flex flex-col gap-4 text-[0.875rem]">
                <li>
                  <Link href={signedIn ? "/account" : "/login"}>
                    {signedIn ? "My account" : "Sign in / Register"}
                  </Link>
                </li>
                <li><Link href="/wishlist">Wishlist ({wishlist.length})</Link></li>
                <li><Link href="/account/orders">Track an order</Link></li>
                <li><Link href="/help/contact">Contact us</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ---- Inline icons keep this file self-contained and tree-shakeable ---- */

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 20s-7.5-4.6-7.5-9.5A4.25 4.25 0 0 1 12 7.7a4.25 4.25 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" strokeLinejoin="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M5 8h14l-1 12H6L5 8Z" strokeLinejoin="round" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
