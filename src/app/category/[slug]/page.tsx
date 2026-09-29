import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, queryProducts } from "@/lib/queries";
import { CatalogList } from "@/components/catalog/catalog-list";
import { queryFromParams, type ParamValues } from "@/components/catalog/catalog-params";
import { STORE } from "@/lib/constants";
import type { SortKey } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ParamValues>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.name} — ${STORE.name}`,
    description: category.description || category.tagline,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();

  const defaultSort: SortKey =
    slug === "women" || slug === "men" ? "popular" : "newest";
  const query = queryFromParams(sp, { category: [slug] }, defaultSort);
  const result = await queryProducts(query);

  return (
    <CatalogList
      base={`/category/${slug}`}
      eyebrow={`Shop · ${category.name}`}
      title={category.name}
      description={category.description}
      result={result}
      params={sp}
      defaultSort={defaultSort}
    />
  );
}