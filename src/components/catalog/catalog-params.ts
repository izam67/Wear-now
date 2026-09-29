import type { ProductQuery, SortKey } from "@/lib/types";
import { SORT_OPTIONS } from "@/lib/types";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";

/**
 * Catalog URL contract shared by /category/[slug], /search, /new-arrivals
 * and /sale. Every filter maps one-to-one onto a query-string key, so a link
 * can be built by patching one key without hand-building URLSearchParams.
 *
 * Canonical keys:
 *   q        free-text search
 *   sort     one of SORT_OPTIONS.value
 *   gender   comma-separated  (also accepts the legacy `g` alias)
 *   sizes    comma-separated
 *   colors   comma-separated
 *   category comma-separated (search page only; category pages fix it in the route)
 *   page     1-based
 *   onSale   "true" / isNew "true" (search page toggles only)
 */

export type ParamValue = string | string[] | undefined;
export type ParamValues = Record<string, ParamValue>;

export function toList(value: ParamValue): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((v) => v.split(","))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isSort(value: ParamValue): value is SortKey {
  return typeof value === "string" && SORT_OPTIONS.some((o) => o.value === value);
}

/**
 * Turns a URL's search params into a ProductQuery. Extra flags (isNew/onSale
 * fixed by the route) are layered on by the caller.
 */
export function queryFromParams(
  params: ParamValues,
  extra?: Partial<ProductQuery>,
  defaultSort: SortKey = "popular",
): ProductQuery {
  return {
    q: typeof params.q === "string" && params.q.trim() ? params.q.trim().slice(0, 60) : undefined,
    gender: toList(params.gender ?? params.g),
    sizes: toList(params.sizes),
    colors: toList(params.colors),
    sort: isSort(params.sort) ? params.sort : defaultSort,
    page: Math.max(1, Number(params.page) || 1),
    perPage: PRODUCTS_PER_PAGE,
    ...extra,
  };
}

/** Serialises the merged param set into an absolute catalog URL. */
export function buildHref(base: string, current: ParamValues, patch: ParamValues): string {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) next[key] = value.join(",");
    } else if (value !== "") {
      next[key] = String(value);
    }
  }
  const qs = new URLSearchParams(next).toString();
  return qs ? `${base}?${qs}` : base;
}

/** Adds or removes a value from a comma-list param. */
export function toggleInList(value: ParamValue, item: string): string[] {
  const list = toList(value);
  return list.includes(item) ? list.filter((v) => v !== item) : [...list, item];
}

/**
 * Link for a filter change with the page reset to 1 and any stale page value
 * dropped, so a filtered result never starts mid-list.
 */
export function filterHref(base: string, params: ParamValues, patch: ParamValues): string {
  return buildHref(base, { ...params, page: undefined }, { ...patch, page: undefined });
}