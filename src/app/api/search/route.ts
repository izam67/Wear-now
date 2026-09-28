import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { queryProducts } from "@/lib/queries";
import { normalize } from "@/lib/utils";

/**
 * Typeahead search backing the header overlay.
 *
 * Debounced client-side, so this stays deliberately cheap: a capped product
 * result set plus the categories that matched, and nothing else.
 */
export const dynamic = "force-dynamic";

const PRODUCT_LIMIT = 8;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("q") ?? "").trim();

  if (raw.length < 2) {
    return NextResponse.json({ products: [], categories: [], total: 0 });
  }

  // Keeps the route dynamic and lets personalisation hook in here later.
  void (await currentUser());

  const result = await queryProducts({ q: raw, perPage: PRODUCT_LIMIT });
  const needle = normalize(raw);

  const categories = result.facets.categories
    .filter((c) => normalize(c.label).includes(needle))
    .slice(0, 4)
    .map((c) => ({ slug: c.value, name: c.label, count: c.count }));

  return NextResponse.json(
    { products: result.products, categories, total: result.total },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
