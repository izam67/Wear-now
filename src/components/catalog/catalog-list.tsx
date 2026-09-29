import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { SORT_OPTIONS, type SortKey } from "@/lib/types";
import type { ProductFilterResult } from "@/lib/queries";
import { ProductGrid } from "@/components/layout/section";
import { COLOR_FILTERS } from "@/lib/constants";
import { cn, pluralize } from "@/lib/utils";
import { SortSelect } from "./sort-select";
import {
  buildHref,
  filterHref,
  isSort,
  toList,
  toggleInList,
  type ParamValues,
} from "./catalog-params";

/**
 * The listing skeleton behind /category/[slug], /search, /new-arrivals and
 * /sale. Everything is a plain link — no router calls, no client state — so a
 * page can be indexed, cached and shared exactly as it renders.
 */

export interface CatalogListProps {
  /** URL prefix the filters are mounted on, e.g. "/category/women". */
  base: string;
  title: string;
  eyebrow?: string;
  description?: string;
  result: ProductFilterResult;
  /** The raw search params currently on the URL, to preserve when linking. */
  params: ParamValues;
  defaultSort?: SortKey;
  /** Renders the full facet sidebar instead of a bare listing. */
  showFacets?: boolean;
}

export function CatalogList({
  base,
  title,
  eyebrow,
  description,
  result,
  params,
  defaultSort = "popular",
  showFacets = false,
}: CatalogListProps) {
  const { products, total, page, pageCount, facets } = result;
  const sort = isSort(params.sort) ? (params.sort as SortKey) : defaultSort;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  /* ---- Link builders ---- */
  const sortOptions = SORT_OPTIONS.map((o) => ({
    ...o,
    href: filterHref(base, params, { sort: o.value }),
  }));
  const pageHref = (target: number) => buildHref(base, params, { page: target > 1 ? String(target) : undefined });

  /* ---- Removable filter chips ---- */
  const chips: { label: string; href: string }[] = [];
  if (q) {
    chips.push({ label: `“${q}”`, href: buildHref(base, params, { q: undefined }) });
  }
  const pushListChips = (key: string, labelOf: (v: string) => string) => {
    for (const v of toList(params[key])) {
      chips.push({
        label: labelOf(v),
        href: filterHref(base, params, { [key]: toggleInList(params[key], v) }),
      });
    }
  };
  pushListChips("category", (v) => facetLabel(facets.categories, v) ?? v);
  pushListChips("gender", (v) => v.charAt(0).toUpperCase() + v.slice(1));
  pushListChips("sizes", (v) => `Size ${v}`);
  pushListChips("colors", (v) => colorLabel(v));

  const sale = params.onSale === "true";
  const isNew = params.isNew === "true";
  if (sale) chips.push({ label: "On sale", href: filterHref(base, params, { onSale: undefined }) });
  if (isNew) chips.push({ label: "New in", href: filterHref(base, params, { isNew: undefined }) });

  const hasFilters = chips.length > 0;
  const clearHref = buildHref(base, {}, { sort });

  return (
    <div className="container-page py-10 md:py-16">
      <header className="mb-8 max-w-3xl md:mb-12">
        {eyebrow ? <p className="eyebrow text-clay">{eyebrow}</p> : null}
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-stone">{description}</p>
        ) : null}
      </header>

      <div className={cn("gap-12", showFacets && "lg:grid lg:grid-cols-[14.5rem_1fr]")}>
        {showFacets ? (
          <aside aria-label="Filters" className="mb-10 lg:sticky lg:top-6 lg:mb-0 lg:self-start">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="eyebrow text-stone">Filters</h2>
              {hasFilters ? (
                <Link
                  href={clearHref}
                  className="text-[0.75rem] text-stone underline underline-offset-4 transition-colors hover:text-ink"
                >
                  Clear all
                </Link>
              ) : null}
            </div>

            <FacetSet title="Category" open>
              <ul className="space-y-0.5">
                {facets.categories.map((c) => (
                  <FilterLink
                    key={c.value}
                    href={filterHref(base, params, { category: toggleInList(params.category, c.value) })}
                    active={toList(params.category).includes(c.value)}
                    count={c.count}
                  >
                    {c.label}
                  </FilterLink>
                ))}
              </ul>
            </FacetSet>

            <FacetSet title="Gender">
              <ul className="space-y-0.5">
                {["women", "men", "unisex"].map((g) => (
                  <FilterLink
                    key={g}
                    href={filterHref(base, params, { gender: toggleInList(params.gender, g) })}
                    active={toList(params.gender).includes(g)}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </FilterLink>
                ))}
              </ul>
            </FacetSet>

            <FacetSet title="Colour">
              {facets.colors.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {facets.colors.map((c) => {
                    const active = toList(params.colors).includes(c.value);
                    const hex =
                      COLOR_FILTERS.find((f) => f.name.toLowerCase() === c.value.toLowerCase())?.hex ??
                      "#8c8c8c";
                    return (
                      <Link
                        key={c.value}
                        href={filterHref(base, params, { colors: toggleInList(params.colors, c.value) })}
                        aria-label={`${colorLabel(c.value)} (${c.count})`}
                        aria-pressed={active}
                        title={colorLabel(c.value)}
                        className={cn(
                          "grid size-9 place-items-center rounded-full border transition-colors",
                          active
                            ? "border-ink ring-2 ring-ink/25 ring-offset-2 ring-offset-paper"
                            : "border-line hover:border-ink/50",
                        )}
                      >
                        <span
                          className="size-6 rounded-full border border-black/10"
                          style={{ backgroundColor: hex }}
                        />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="pt-1 text-[0.8125rem] text-mist">No colours match this selection.</p>
              )}
            </FacetSet>

            <FacetSet title="Size">
              {facets.sizes.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {facets.sizes.map((s) => (
                    <Link
                      key={s.value}
                      href={filterHref(base, params, { sizes: toggleInList(params.sizes, s.value) })}
                      aria-pressed={toList(params.sizes).includes(s.value)}
                      className={cn(
                        "rounded-pill border px-3 py-1.5 text-[0.8125rem] transition-colors",
                        toList(params.sizes).includes(s.value)
                          ? "border-ink bg-ink text-paper"
                          : "border-line text-graphite hover:border-ink hover:text-ink",
                      )}
                    >
                      {s.value}
                      <span className="ml-1.5 tabular-nums text-mist">{s.count}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="pt-1 text-[0.8125rem] text-mist">No sizes match this selection.</p>
              )}
            </FacetSet>

            <FacetSet title="Season">
              <div className="flex flex-wrap gap-2 pt-1">
                <ToggleChip active={sale} href={filterHref(base, params, { onSale: sale ? undefined : "true" })}>
                  On sale
                </ToggleChip>
                <ToggleChip active={isNew} href={filterHref(base, params, { isNew: isNew ? undefined : "true" })}>
                  New in
                </ToggleChip>
              </div>
            </FacetSet>
          </aside>
        ) : null}

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.8125rem] text-stone">{pluralize(total, "piece")}</p>
            <SortSelect options={sortOptions} active={sort} />
          </div>

          {hasFilters ? (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  className="group inline-flex items-center gap-1.5 rounded-pill bg-sand px-3 py-1.5 text-[0.8125rem] text-graphite transition-colors hover:bg-line"
                >
                  {c.label}
                  <X size={13} className="text-mist transition-colors group-hover:text-ink" aria-hidden />
                </Link>
              ))}
            </div>
          ) : null}

          {products.length > 0 ? (
            <>
              <ProductGrid
                products={products}
                priorityCount={page === 1 ? Math.min(products.length, 4) : 0}
                columns={showFacets ? 3 : 4}
              />
              {pageCount > 1 ? (
                <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-4">
                  {page > 1 ? (
                    <Link
                      href={pageHref(page - 1)}
                      aria-label="Previous page"
                      className="inline-flex items-center gap-1.5 rounded-[10px] border border-line px-4 py-2.5 text-[0.8125rem] transition-colors hover:border-ink hover:bg-sand"
                    >
                      <ChevronLeft size={15} aria-hidden />
                      Previous
                    </Link>
                  ) : (
                    <span className="pointer-events-none inline-flex items-center gap-1.5 rounded-[10px] border border-line px-4 py-2.5 text-[0.8125rem] opacity-40">
                      <ChevronLeft size={15} aria-hidden />
                      Previous
                    </span>
                  )}
                  <span className="text-[0.8125rem] tabular-nums text-stone">
                    Page {page} of {pageCount}
                  </span>
                  {page < pageCount ? (
                    <Link
                      href={pageHref(page + 1)}
                      aria-label="Next page"
                      className="inline-flex items-center gap-1.5 rounded-[10px] border border-line px-4 py-2.5 text-[0.8125rem] transition-colors hover:border-ink hover:bg-sand"
                    >
                      Next
                      <ChevronRight size={15} aria-hidden />
                    </Link>
                  ) : (
                    <span className="pointer-events-none inline-flex items-center gap-1.5 rounded-[10px] border border-line px-4 py-2.5 text-[0.8125rem] opacity-40">
                      Next
                      <ChevronRight size={15} aria-hidden />
                    </span>
                  )}
                </nav>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-line bg-sand/50 px-8 py-20 text-center">
              <p className="font-display text-2xl">Nothing here fits those filters</p>
              <p className="mx-auto mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-stone">
                Try removing a filter or two, or browse the latest pieces for something new.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href={clearHref}
                  className="rounded-pill bg-ink px-5 py-2.5 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-graphite"
                >
                  Clear filters
                </Link>
                <Link
                  href="/new-arrivals"
                  className="rounded-pill border border-line px-5 py-2.5 text-[0.8125rem] font-medium transition-colors hover:border-ink hover:bg-sand"
                >
                  Shop new arrivals
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Small local bits
 * ------------------------------------------------------------------ */

function FacetSet({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className="group border-b border-line py-3">
      <summary className="flex cursor-pointer list-none select-none items-center justify-between text-[0.8125rem] font-medium tracking-wide text-graphite [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          size={14}
          aria-hidden
          className="text-mist transition-transform duration-300 group-open:rotate-180"
        />
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

function FilterLink({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex items-center justify-between gap-2 rounded-[8px] px-2.5 py-1.5 text-[0.8125rem] transition-colors",
          active ? "bg-ink text-paper" : "text-graphite hover:bg-sand hover:text-ink",
        )}
      >
        <span>{children}</span>
        {count !== undefined ? (
          <span className={cn("tabular-nums", active ? "text-paper/60" : "text-mist")}>{count}</span>
        ) : null}
      </Link>
    </li>
  );
}

function ToggleChip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        "rounded-pill border px-3 py-1.5 text-[0.8125rem] transition-colors",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line text-graphite hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

function facetLabel(
  items: { value: string; label: string }[],
  value: string,
): string | undefined {
  return items.find((i) => i.value === value)?.label;
}

function colorLabel(value: string): string {
  const match = COLOR_FILTERS.find((c) => c.name.toLowerCase() === value.toLowerCase());
  return match ? match.name : value.charAt(0).toUpperCase() + value.slice(1);
}