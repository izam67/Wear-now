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
  title: `Sale — ${STORE.name}`,
  description: "Reduced pieces across categories — up to 40% off selected items.",
};

const DEFAULT_SORT: SortKey = "popular";

export default async function SalePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const query = queryFromParams(sp, { onSale: true }, DEFAULT_SORT);
  const result = await queryProducts(query);

  return (
    <CatalogList
      base="/sale"
      eyebrow="Limited-time reductions"
      title="Sale"
      description="Reduced pieces across the edit while sizes last."
      result={result}
      params={sp}
      defaultSort={DEFAULT_SORT}
    />
  );
}