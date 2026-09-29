import Image from "next/image";
import type { Review, User } from "@/lib/types";
import { IMG } from "@/lib/images";
import { initials, pluralize, timeAgo } from "@/lib/utils";
import { Stars, RatingBars } from "@/components/ui/stars";
import { ReviewForm } from "./review-form";

/**
 * The reviews block on a product page: a rating summary, the write-a-review
 * form (signed-in shoppers only), then the approved reviews, newest first.
 */
export function ProductReviews({
  productId,
  productSlug,
  user,
  reviews,
  average,
  counts,
}: {
  productId: number;
  productSlug: string;
  user: User | null;
  reviews: Review[];
  average: number;
  counts: Record<number, number>;
}) {
  const total = reviews.length;

  return (
    <section aria-labelledby="reviews-heading" className="container-page py-16 md:py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-clay">Reviews</p>
              <h2 id="reviews-heading" className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
                What shoppers think
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-4xl tabular-nums">{total ? average.toFixed(1) : "—"}</span>
              <div>
                <Stars rating={average} size={14} />
                <p className="mt-1 text-[0.75rem] text-stone">
                  {total ? pluralize(total, "review") : "No reviews yet"}
                </p>
              </div>
            </div>
          </div>

          {user ? (
            <details className="group mb-10 rounded-xl border border-line bg-sand/40 p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                <span className="font-display text-lg">Write a review</span>
                <span className="rounded-pill bg-ink px-4 py-1.5 text-[0.8125rem] font-medium text-paper transition-colors group-open:bg-graphite">
                  Start
                </span>
              </summary>
              <div className="mt-6 border-t border-line pt-6">
                <ReviewForm productId={productId} productSlug={productSlug} authorName={`${user.firstName} ${user.lastName}`} />
              </div>
            </details>
          ) : null}

          {total > 0 ? (
            <ul className="space-y-8">
              {reviews.map((review) => (
                <li key={review.id} className="border-b border-line pb-8 last:border-b-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="grid size-10 place-items-center rounded-full bg-sand text-[0.8125rem] font-medium text-graphite"
                      >
                        {initials(review.authorName.split(" ")[0] ?? "", review.authorName.split(" ")[1])}
                      </span>
                      <div>
                        <p className="flex items-center gap-2 text-[0.875rem]">
                          {review.authorName}
                          {review.verified ? (
                            <span className="rounded-pill bg-sage/20 px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.1em] text-sage">
                              Verified
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[0.75rem] text-mist">{timeAgo(review.createdAt)}</p>
                      </div>
                    </div>
                    <Stars rating={review.rating} size={13} />
                  </div>

                  <h3 className="mt-4 font-display text-lg leading-snug">{review.title}</h3>
                  <p className="mt-2 max-w-2xl text-[0.875rem] leading-relaxed text-stone">
                    {review.body}
                  </p>

                  {review.image ? (
                    <div className="relative mt-4 aspect-4/3 max-w-sm overflow-hidden rounded-lg">
                      <Image
                        src={IMG.review(review.image)}
                        alt={`Photo from ${review.authorName}'s review`}
                        fill
                        sizes="(max-width: 640px) 92vw, 24rem"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
              <p className="font-display text-xl">Be the first to review</p>
              <p className="mx-auto mt-1 max-w-xs text-[0.8125rem] leading-relaxed text-stone">
                {user
                  ? "Share how it fits and how it wears — other shoppers will thank you."
                  : "Sign in to share your thoughts on this piece."}
              </p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl border border-line p-6">
            <h3 className="eyebrow text-stone">Rating breakdown</h3>
            <RatingBars
              breakdown={Object.fromEntries(
                [5, 4, 3, 2, 1].map((n) => [n, { count: counts[n] ?? 0 }]),
              )}
              total={total}
              className="mt-5"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}