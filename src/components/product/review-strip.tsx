import Image from "next/image";
import type { Review } from "@/lib/types";
import { IMG } from "@/lib/images";
import { initials, timeAgo } from "@/lib/utils";
import { Stars } from "@/components/ui/stars";

/**
 * Social proof band. Reviews are shown as written — including the critical ones —
 * because a wall of five-star quotes reads as fake, and filtering them out is
 * both dishonest and easy to see through.
 */
export function ReviewStrip({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby="reviews-heading" className="border-y border-line bg-ink py-16 text-paper md:py-20">
      <div className="container-page">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-paper/60">From our customers</p>
            <h2 id="reviews-heading" className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
              Worn, and talked about
            </h2>
          </div>
          <a
            href="/reviews"
            className="text-[0.8125rem] underline underline-offset-4 transition-colors hover:text-paper/70"
          >
            Read all reviews
          </a>
        </div>

        <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="w-[85vw] shrink-0 snap-start rounded-lg bg-paper/5 p-6 sm:w-[22rem] md:w-auto"
            >
              <Stars rating={review.rating} size={13} tone="light" />

              <h3 className="mt-4 font-display text-lg leading-snug">{review.title}</h3>
              <p className="clamp-3 mt-2 text-[0.8125rem] leading-relaxed text-paper/70">
                {review.body}
              </p>

              {review.image ? (
                <div className="relative mt-4 aspect-4/3 w-full overflow-hidden rounded-md">
                  <Image
                    src={IMG.review(review.image)}
                    alt={`Photo from ${review.authorName}'s review`}
                    fill
                    sizes="(min-width: 768px) 22rem, 85vw"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <footer className="mt-5 flex items-center gap-3 border-t border-paper/10 pt-4">
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-paper/10 text-[0.6875rem] font-medium"
                >
                  {initials(review.authorName.split(" ")[0] ?? "", review.authorName.split(" ")[1])}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[0.8125rem]">
                    {review.authorName}
                    {review.verified ? (
                      <span className="rounded-pill bg-paper/10 px-2 py-0.5 text-[0.5625rem] tracking-[0.1em] text-paper/60 uppercase">
                        Verified
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-[0.75rem] text-paper/45">
                    {review.productName} · {timeAgo(review.createdAt)}
                  </p>
                </div>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
