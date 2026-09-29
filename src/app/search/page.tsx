import type { Metadata } from "next";
import { queryProducts } from "@/lib/queries";
import { CatalogList } from "@/components/catalog/catalog-list";
import { queryFromParams, type ParamValues } from "@/components/catalog/catalog-params";
import { STORE } from "@/lib/constants";
import type { SortKey } from "@/lib/types";

interface PageProps {
  searchParams: Promise<ParamValues>;
}

export const metadata: Metadata = {
  title: `Search — ${STORE.name}`,
};

const DEFAULT_SORT: SortKey = "popular";

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const query = queryFromParams(sp, undefined, DEFAULT_SORT);
  const result = await queryProducts(query);

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const title = q ? `Results for “${q}”` : "All pieces";
  const description = q
    ? undefined
    : "Every piece in the edit — filter by category, colour, size or price to narrow it down.";

  return (
    <CatalogList
      base="/search"
      eyebrow={q ? "Search" : "Browse everything"}
      title={title}
      description={description}
      result={result}
      params={sp}
      defaultSort={DEFAULT_SORT}
      showFacets
    />
  );
}