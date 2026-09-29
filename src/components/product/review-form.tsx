"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Star } from "lucide-react";
import { submitProductReview, type ReviewState } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import { Field, FormError, TextField } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const initial: ReviewState = {};

/**
 * Leave-a-review form. Reviews start unapproved, so the plain "Thanks" below is
 * accurate — the piece appears once a moderator approves it.
 */
export function ReviewForm({
  productId,
  productSlug,
  authorName,
}: {
  productId: number;
  productSlug: string;
  authorName: string;
}) {
  const [rating, setRating] = useState(5);
  const [state, formAction, pending] = useActionState(submitProductReview, initial);

  if (state.success) {
    return (
      <div className="rounded-xl border border-line bg-sand/60 px-6 py-8 text-center">
        <p className="font-display text-xl">Thanks, {authorName.split(" ")[0]} — review received</p>
        <p className="mx-auto mt-2 max-w-xs text-[0.8125rem] leading-relaxed text-stone">
          Your review is now with our moderators and will appear here once approved.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="slug" value={productSlug} />

      <FormError>{state.error}</FormError>

      <Field label="Rating" htmlFor="review-rating">
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              onClick={() => setRating(value)}
              className="transition-transform duration-200 hover:scale-110 focus-visible:scale-110"
            >
              <Star
                size={26}
                aria-hidden
                className={cn(
                  "transition-colors",
                  value <= rating ? "fill-clay text-clay" : "fill-transparent text-line",
                )}
              />
            </button>
          ))}
        </div>
        <input type="hidden" name="rating" value={rating} readOnly />
      </Field>

      <TextField
        label="Title"
        name="title"
        id="review-title"
        placeholder="A short summary, e.g. “The perfect autumn coat”"
        required
        error={state.fieldErrors?.title}
      />

      <Field label="Review" htmlFor="review-body" error={state.fieldErrors?.body}>
        <textarea
          name="body"
          id="review-body"
          rows={4}
          placeholder="What did you love — or not? Fit, fabric, how it wears…"
          required
          className={cn(
            "w-full resize-y rounded-[10px] border bg-paper px-3.5 py-3 text-sm text-ink transition-colors duration-200 outline-none placeholder:text-mist focus:border-ink/45",
            state.fieldErrors?.body ? "border-clay" : "border-line",
          )}
        />
      </Field>

      <Button type="submit" size="lg" full loading={pending}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}