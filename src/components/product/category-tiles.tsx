import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/types";
import { IMG } from "@/lib/images";

/**
 * Six category tiles in an intentionally uneven layout: wide on desktop, a
 * single scrolling row on phones. Equal-sized boxes make a fashion site look
 * like a dashboard, and the asymmetry is what reads as editorial.
 */
export function CategoryTiles({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="shop-by-category" className="container-page py-16 md:py-20">
      <h2 id="shop-by-category" className="sr-only">
        Shop by category
      </h2>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
        {categories.map((category, i) => (
          <li
            key={category.id}
            className={
              // Two tiles get double width on large screens to break the rhythm.
              i % 5 === 0 ? "col-span-1 md:col-span-2" : "col-span-1"
            }
          >
            <Link
              href={`/category/${category.slug}`}
              className="group relative block overflow-hidden rounded-lg bg-sand"
            >
              <div className="relative aspect-4/5 w-full">
                <Image
                  src={IMG.category(category.image)}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 34vw, (min-width: 768px) 48vw, 46vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
              </div>

              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent"
              />

              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                <h3 className="font-display text-lg text-paper md:text-xl">{category.name}</h3>
                <p className="mt-0.5 line-clamp-2 text-[0.75rem] leading-relaxed text-paper/75">
                  {category.tagline}
                </p>
              </div>

              <span className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-paper/90 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span aria-hidden>→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
