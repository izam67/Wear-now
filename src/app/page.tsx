import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/layout/hero";
import { EditorialBanner, ProductGrid, Section } from "@/components/layout/section";
import { ReviewStrip } from "@/components/product/review-strip";
import { InspirationStrip } from "@/components/product/inspiration-strip";
import { CategoryTiles } from "@/components/product/category-tiles";
import {
  getBestSellers,
  getHomepageReviews,
  getNewArrivals,
  getTrending,
  listCategories,
  listInspiration,
} from "@/lib/queries";
import { STORE } from "@/lib/constants";
import { POOL } from "@/lib/images";

export const metadata: Metadata = {
  title: `${STORE.name} — ${STORE.tagline}`,
  description: STORE.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const newArrivals = await getNewArrivals(8);
  const trending = await getTrending(8);
  const bestSellers = await getBestSellers(4);
  const categories = await listCategories();
  const reviews = await getHomepageReviews(6);
  const inspiration = (await listInspiration()).slice(0, 6);

  return (
    <>
      <Hero />

      {/* ---- Shop by category ---- */}
      <CategoryTiles categories={categories} />

      {/* ---- New arrivals ---- */}
      <Section
        id="new-arrivals"
        eyebrow="Just landed"
        title="New arrivals"
        description="The newest additions to the atelier, updated as they arrive."
        action={{ label: "View all new in", href: "/new-arrivals" }}
      >
        <ProductGrid products={newArrivals} priorityCount={4} />
      </Section>

      {/* ---- Editorial band ---- */}
      <div className="container-page pb-16 md:pb-24">
        <EditorialBanner
          eyebrow="The rule of three"
          title="Buy fewer things. Choose them properly."
          body="A good wardrobe is built in edits, not drops. Start with three things that do the work of thirty — a coat, a knit, a pair of shoes you can resole — and build outward from there."
          cta={{ label: "Read the edit", href: "/about" }}
          image={POOL.editorial[6]!}
          imageAlt="A folded knitwear edit on a studio table"
        />
      </div>

      {/* ---- Trending ---- */}
      <Section
        eyebrow="Moving fast"
        title="Trending this week"
        description="What people are actually buying right now."
        action={{ label: "Shop all", href: "/search?sort=popular" }}
      >
        <ProductGrid products={trending} columns={4} />
      </Section>

      {/* ---- Best sellers ---- */}
      <Section
        eyebrow="The core"
        title="Best sellers"
        description="The pieces people come back for, and the ones we never run out of."
        action={{ label: "Shop best sellers", href: "/search?sort=rating" }}
        className="border-t border-line bg-sand/30"
      >
        <ProductGrid products={bestSellers} columns={4} />
      </Section>

      {/* ---- Inspiration ---- */}
      <InspirationStrip posts={inspiration} />

      {/* ---- Reviews ---- */}
      <ReviewStrip reviews={reviews} />

      {/* ---- Service promises ---- */}
      <section className="container-page pb-20 md:pb-28">
        <ul className="grid gap-8 border-t border-line pt-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Free delivery over K150",
              body: "Complimentary standard shipping, and returns on everything for 30 days.",
              href: "/help/shipping",
            },
            {
              title: "Made to be kept",
              body: "Every piece is inspected and repaired by our atelier if it needs it.",
              href: "/about/sustainability",
            },
            {
              title: "Real people, real replies",
              body: "Styling advice from a small team, answered within one business day.",
              href: "/help/contact",
            },
            {
              title: "Members see it first",
              body: "Early access to restocks, private sales, and first pick of new drops.",
              href: "/signup",
            },
          ].map((item) => (
            <li key={item.title}>
              <Link href={item.href} className="group block">
                <h3 className="font-display text-lg group-hover:underline group-hover:underline-offset-4">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-stone">{item.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
