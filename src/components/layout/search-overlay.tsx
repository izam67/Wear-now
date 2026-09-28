"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Loader2, Search, X } from "lucide-react";
import { IMG } from "@/lib/images";
import { TRENDING_SEARCHES } from "@/lib/constants";
import { formatMoney, normalize, pluralize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface SearchResponse {
  products: Product[];
  categories: { slug: string; name: string; tagline: string; count: number }[];
  total: number;
}

const RECENT_KEY = "ma.recentSearches.v1";

function readRecent(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function writeRecent(terms: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(terms.slice(0, 6)));
  } catch {
    /* storage unavailable */
  }
}

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  /* The shell remounts this component on open, so a lazy initialiser can read
   * localStorage safely without a setState-in-effect round trip. */
  const [recent, setRecent] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readRecent(),
  );
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---- Focus after paint so the caret lands correctly on iOS Safari. ---- */
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* ---- Debounced fetch ----
   * All setState happens inside the timeout callback or in the input handler,
   * never synchronously in the effect body. */
  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (res.ok) setResults((await res.json()) as SearchResponse);
      } catch {
        /* aborted or offline — keep the previous results visible */
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  /* ---- Cmd/Ctrl+K to open, Escape to close ---- */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          onClose();
        } else {
          document.dispatchEvent(new CustomEvent("ma:open-search"));
        }
      }
      if (event.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /** Clears stale results the moment the query drops below the search threshold. */
  const updateQuery = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults(null);
      setLoading(false);
    }
  };

  const commitSearch = useCallback(
    (term: string) => {
      const cleaned = term.trim();
      if (!cleaned) return;
      const next = [cleaned, ...readRecent().filter((t) => t !== cleaned)];
      writeRecent(next);
      setRecent(next);
      onClose();
    },
    [onClose],
  );

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return TRENDING_SEARCHES.slice(0, 6);
    return TRENDING_SEARCHES.filter((t) => normalize(t).includes(normalize(query))).slice(0, 5);
  }, [query]);

  if (!open) return null;

  const hasQuery = query.trim().length >= 2;
  const showEmpty = hasQuery && !loading && results?.products.length === 0;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Search products">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 cursor-default bg-ink/35 backdrop-blur-[3px]"
      />

      <div

        className="animate-scale-in relative mx-auto flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-b-xl border border-line bg-paper shadow-[0_40px_80px_-40px_rgba(18,17,16,0.5)] sm:mt-6 sm:max-h-[86dvh] sm:rounded-xl"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Search size={19} strokeWidth={1.6} className="shrink-0 text-stone" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitSearch(query)}
            placeholder="Search clothes, shoes, jewelry…"
            aria-label="Search products"
            aria-describedby="search-hint"
            className="min-w-0 flex-1 bg-transparent font-display text-lg tracking-tight outline-none placeholder:font-sans placeholder:text-base placeholder:text-mist md:text-xl"
          />
          {loading ? (
            <Loader2 size={17} className="shrink-0 animate-spin text-stone" aria-hidden />
          ) : query ? (
            <button
              type="button"
              onClick={() => updateQuery("")}
              aria-label="Clear search"
              className="grid size-7 shrink-0 place-items-center rounded-full text-stone transition-colors hover:bg-sand hover:text-ink"
            >
              <X size={15} />
            </button>
          ) : null}
          <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 font-sans text-[0.625rem] text-stone sm:block">
            ESC
          </kbd>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* ---- Resting state: recent + trending + categories ---- */}
          {!hasQuery ? (
            <div className="px-5 py-5">
              {recent.length > 0 ? (
                <section className="mb-6">
                  <SectionHeading>Recent searches</SectionHeading>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((term) => (
                      <Chip key={term} onClick={() => updateQuery(term)}>
                        {term}
                      </Chip>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="mb-6">
                <SectionHeading>{recent.length ? "Trending" : "Popular right now"}</SectionHeading>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((term) => (
                    <Chip key={term} onClick={() => updateQuery(term)}>
                      {term}
                    </Chip>
                  ))}
                </div>
              </section>

              <section>
                <SectionHeading>Shop by category</SectionHeading>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { slug: "women", label: "Clothing" },
                    { slug: "men", label: "Menswear" },
                    { slug: "shoes", label: "Shoes" },
                    { slug: "jewelry", label: "Jewelry" },
                    { slug: "bags", label: "Bags" },
                    { slug: "accessories", label: "Accessories" },
                  ].map((c) => (
                    <Link
                      key={c.slug}
                      href={`/category/${c.slug}`}
                      onClick={onClose}
                      className="group flex items-center justify-between rounded-md border border-line px-3.5 py-3 text-[0.8125rem] transition-colors hover:border-ink hover:bg-sand"
                    >
                      {c.label}
                      <ArrowUpRight
                        size={14}
                        className="text-mist transition-colors group-hover:text-ink"
                        aria-hidden
                      />
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {/* ---- Loading skeleton ---- */}
          {hasQuery && loading && !results ? (
            <div className="space-y-4 p-5" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="skeleton size-20 shrink-0 rounded-md" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="skeleton h-3.5 w-2/3 rounded" />
                    <div className="skeleton h-3 w-1/3 rounded" />
                    <div className="skeleton h-3 w-16 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* ---- No results ---- */}
          {showEmpty ? (
            <div className="px-5 py-14 text-center">
              <p className="font-display text-xl">No pieces match “{query.trim()}”</p>
              <p className="mx-auto mt-2 max-w-xs text-[0.8125rem] leading-relaxed text-stone">
                Try a broader term, a category like “linen”, or browse everything in Clothing and Shoes.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["linen", "cashmere", "loafers", "gold hoops"].map((t) => (
                  <Chip key={t} onClick={() => updateQuery(t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}

          {/* ---- Results ---- */}
          {hasQuery && results && results.products.length > 0 ? (
            <div className="px-5 py-5">
              {results.categories.length > 0 ? (
                <section className="mb-5">
                  <SectionHeading>Categories</SectionHeading>
                  <div className="flex flex-wrap gap-2">
                    {results.categories.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/category/${c.slug}?q=${encodeURIComponent(query.trim())}`}
                        onClick={onClose}
                        className="rounded-pill border border-line px-3.5 py-1.5 text-[0.8125rem] transition-colors hover:border-ink hover:bg-sand"
                      >
                        {c.name}
                        <span className="ml-1.5 text-mist">{c.count}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="flex items-baseline justify-between gap-4">
                <SectionHeading className="mb-3">Products</SectionHeading>
                <span className="text-[0.75rem] text-stone">{pluralize(results.total, "result")}</span>
              </div>

              <ul className="divide-y divide-line">
                {results.products.slice(0, 6).map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={() => commitSearch(query)}
                      className="group flex items-center gap-4 py-3"
                    >
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-sand">
                        {product.images[0] ? (
                          <Image
                            src={IMG.thumb(product.images[0])}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.9375rem] group-hover:underline group-hover:underline-offset-4">
                          {product.name}
                        </p>
                        <p className="truncate text-[0.75rem] text-stone">{product.subtitle}</p>
                      </div>
                      <span className="shrink-0 text-[0.8125rem] tabular-nums">
                        {formatMoney(product.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => commitSearch(query)}
                className="mt-5 flex items-center justify-center gap-2 rounded-pill bg-ink px-5 py-3 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-graphite"
              >
                See all {results.total} results
                <ArrowUpRight size={15} aria-hidden />
              </Link>
            </div>
          ) : null}
        </div>

        <p id="search-hint" className="sr-only">
          Results update as you type. Press Enter to see the full results page.
        </p>
      </div>
    </div>
  );
}

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("eyebrow mb-2.5 text-stone", className)}>{children}</h2>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-pill border border-line px-3.5 py-1.5 text-[0.8125rem] transition-colors hover:border-ink hover:bg-sand"
    >
      {children}
    </button>
  );
}
