import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listApprovedReviews } from "@/lib/queries";
import { IMG } from "@/lib/images";
import { initials, pluralize, timeAgo } from "@/lib/utils";
import { Stars } from "@/components/ui/stars";
import { STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Reviews — ${STORE.name}`,
  description: `All customer reviews across the ${STORE.name} catalog — shown as written, including the critical ones.`,
};

export const revalidate = 300;

export default async function ReviewsPage() {
  const reviews = await listApprovedReviews();

  return (
    <div className="container-page py-12 md:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow text-clay">From our customers</p>
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          Reviews, shown as written
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-stone">
          Every approved review from across the catalog — including the critical ones, because
          a wall of five-star quotes reads as fake.
        </p>
        <p className="mt-3 text-[0.8125rem] text-stone">{pluralize(reviews.length, "review")}</p>
      </header>

      {reviews.length > 0 ? (
        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col rounded-xl border border-line p-6">
              <div className="flex items-center justify-between gap-3">
                <Stars rating={review.rating} size={13} />
                {review.verified ? (
                  <span className="rounded-pill bg-sage/20 px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.1em] text-sage">
                    Verified
                  </span>
                ) : null}
              </div>

              <h2 className="mt-4 font-display text-lg leading-snug">{review.title}</h2>
              <p className="clamp-4 mt-2 flex-1 text-[0.8125rem] leading-relaxed text-stone">
                {review.body}
              </p>

              {review.image ? (
                <div className="relative mt-4 aspect-4/3 overflow-hidden rounded-lg">
                  <Image
                    src={IMG.review(review.image)}
                    alt={`Photo from ${review.authorName}'s review`}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <footer className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-[0.6875rem] font-medium text-graphite"
                >
                  {initials(review.authorName.split(" ")[0] ?? "", review.authorName.split(" ")[1])}
                </span>
                <div className="min-w-0">
                  <p className="text-[0.8125rem]">{review.authorName}</p>
                  <p className="truncate text-[0.75rem] text-mist">
                    on{" "}
                    <Link
                      href={`/product/${review.productSlug}`}
                      className="underline underline-offset-4 transition-colors hover:text-ink"
                    >
                      {review.productName}
                    </Link>{" "}
                    · {timeAgo(review.createdAt)}
                  </p>
                </div>
              </footer>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-12 rounded-xl border border-dashed border-line px-6 py-16 text-center">
          <p className="font-display text-xl">No reviews yet</p>
          <p className="mx-auto mt-1 max-w-xs text-[0.8125rem] leading-relaxed text-stone">
            Reviews appear here once shoppers have shared their first thoughts.
          </p>
        </div>
      )}
    </div>
  );
}