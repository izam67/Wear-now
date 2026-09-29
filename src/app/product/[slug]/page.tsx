import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCompleteTheLook,
  getProductBySlug,
  getRelatedProducts,
  getReviewsForProduct,
  getVariants,
  ratingBreakdown,
} from "@/lib/queries";
import { currentUser } from "@/lib/session";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductGrid, Section } from "@/components/layout/section";
import { STORE } from "@/lib/constants";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — ${STORE.name}`,
    description: product.subtitle || product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [variants, reviews, breakdown, related, look, user] = await Promise.all([
    getVariants(product.id),
    getReviewsForProduct(product.id),
    ratingBreakdown(product.id),
    getRelatedProducts(product),
    getCompleteTheLook(product),
    currentUser(),
  ]);

  return (
    <>
      <ProductDetail product={product} variants={variants} />

      <div className="border-t border-line">
        <ProductReviews
          productId={product.id}
          productSlug={product.slug}
          user={user}
          reviews={reviews}
          average={breakdown.average}
          counts={breakdown.counts}
        />
      </div>

      <div className="border-t border-line">
        <Section
          id="related"
          eyebrow="Keep browsing"
          title="You might also like"
          action={{ label: "Shop all", href: "/search?sort=popular" }}
        >
          <ProductGrid products={related} />
        </Section>
      </div>

      <div className="border-t border-line bg-sand/45">
        <Section
          eyebrow="Styled together"
          title="Complete the look"
          action={{ label: "Shop the edit", href: "/search" }}
        >
          <ProductGrid products={look} />
        </Section>
      </div>
    </>
  );
}