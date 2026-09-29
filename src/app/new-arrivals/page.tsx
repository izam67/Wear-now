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
  title: `New Arrivals — ${STORE.name}`,
  description: "The latest additions to the edit — new products, restocked classics and first looks.",
};

const DEFAULT_SORT: SortKey = "newest";

export default async function NewArrivalsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const query = queryFromParams(sp, { isNew: true }, DEFAULT_SORT);
  const result = await queryProducts(query);

  return (
    <CatalogList
      base="/new-arrivals"
      eyebrow="Just landed"
      title="New Arrivals"
      description="The latest additions to the edit, refreshed each week."
      result={result}
      params={sp}
      defaultSort={DEFAULT_SORT}
    />
  );
}