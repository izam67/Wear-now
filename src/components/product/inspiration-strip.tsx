import Link from "next/link";
import Image from "next/image";
import type { InspirationPost } from "@/lib/types";
import { IMG } from "@/lib/images";
import { INSPIRATION_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Heights keyed to the post's stored aspect, so the masonry row has rhythm. */
const ASPECT_HEIGHT: Record<InspirationPost["aspect"], number> = {
  tall: 720,
  square: 520,
  wide: 380,
};

export function InspirationStrip({ posts }: { posts: InspirationPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="inspiration-heading" className="py-16 md:py-24">
      <div className="container-page">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
          <div>
            <p className="eyebrow text-clay">The moodboard</p>
            <h2 id="inspiration-heading" className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
              How people wear it
            </h2>
          </div>
          <Link
            href="/inspiration"
            className="group/link inline-flex items-center gap-2 border-b border-ink pb-1 text-[0.8125rem] font-medium transition-colors hover:border-clay hover:text-clay"
          >
            See all edits
            <span aria-hidden className="transition-transform duration-300 group-hover/link:translate-x-1">
              →
            </span>
          </Link>
        </header>

        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/inspiration/${post.slug}`}
              className={cn(
                "group relative w-[72vw] shrink-0 snap-start overflow-hidden rounded-lg bg-sand sm:w-[40vw] md:w-auto",
                // A tall, wide, tall, square rhythm instead of a uniform grid.
                i % 4 === 0 && "md:row-span-2",
              )}
            >
              <div
                className="relative w-full"
                style={{ aspectRatio: `4 / ${ASPECT_HEIGHT[post.aspect] / 100}` }}
              >
                <Image
                  src={IMG.tile(post.image, ASPECT_HEIGHT[post.aspect])}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 24vw, 72vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
              </div>

              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-95"
              />

              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                <p className="text-[0.5625rem] tracking-[0.18em] text-paper/65 uppercase">
                  {post.category}
                </p>
                <h3 className="mt-1.5 font-display text-base leading-snug text-paper md:text-lg">
                  {post.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        <ul className="mt-8 flex flex-wrap gap-2">
          {INSPIRATION_CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                href={`/inspiration?category=${encodeURIComponent(c)}`}
                className="rounded-pill border border-line px-3.5 py-1.5 text-[0.8125rem] text-graphite transition-colors hover:border-ink hover:bg-sand hover:text-ink"
              >
                {c}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
