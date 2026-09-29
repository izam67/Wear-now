import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listAllReviews } from "@/lib/queries";
import { moderate } from "@/app/actions/admin";
import { AdminShell, Panel } from "@/components/admin/admin-shell";
import { IMG } from "@/lib/images";
import { formatDateTime, pluralize } from "@/lib/utils";
import { Stars } from "@/components/ui/stars";

export const metadata: Metadata = {
  title: "Admin · Reviews",
  robots: { index: false, follow: false },
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-sand text-graphite border-line",
  approved: "bg-sage/20 text-sage border-transparent",
  rejected: "bg-clay/10 text-clay border-transparent",
};

export default async function AdminReviewsPage() {
  const reviews = await listAllReviews();
  const pending = reviews.filter((r) => r.status === "pending").length;

  return (
    <AdminShell active="Reviews">
      <div className="space-y-6">
        <Panel title={`All reviews · ${pluralize(pending, "pending")}`}>
          {reviews.length === 0 ? (
            <p className="text-[0.8125rem] text-mist">No reviews yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {reviews.map((review) => (
                <li key={review.id} className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={review.rating} size={12} />
                      <span
                        className={`rounded-pill border px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.1em] ${STATUS_TONE[review.status] ?? ""}`}
                      >
                        {review.status}
                      </span>
                      <span className="text-[0.75rem] text-mist">{formatDateTime(review.createdAt)}</span>
                    </div>

                    <h3 className="mt-2 font-display text-lg leading-snug">{review.title}</h3>
                    <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-stone">{review.body}</p>

                    <p className="mt-2 text-[0.75rem] text-stone">
                      {review.authorName} · on{" "}
                      <Link href={`/product/${review.productSlug}`} className="underline underline-offset-4 transition-colors hover:text-ink">
                        {review.productName}
                      </Link>
                      {review.verified ? " · verified" : ""}
                    </p>

                    {review.image ? (
                      <div className="relative mt-3 aspect-4/3 max-w-40 overflow-hidden rounded-lg">
                        <Image src={IMG.review(review.image)} alt="" fill sizes="10rem" className="object-cover" />
                      </div>
                    ) : null}
                  </div>

                  {review.status === "pending" ? (
                    <div className="flex shrink-0 items-center gap-2 lg:pt-1">
                      <form action={moderate.bind(null, review.id, "approved")}>
                        <button
                          type="submit"
                          className="rounded-pill bg-ink px-4 py-2 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-graphite"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={moderate.bind(null, review.id, "rejected")}>
                        <button
                          type="submit"
                          className="rounded-pill border border-line px-4 py-2 text-[0.8125rem] font-medium text-graphite transition-colors hover:border-clay hover:text-clay"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}