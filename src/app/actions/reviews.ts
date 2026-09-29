"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createReview } from "@/lib/queries";
import { currentUser } from "@/lib/session";

/**
 * Product review submission. Runs as a Server Action so the form still works
 * without JavaScript, the writer must be signed in, and reviews always start in
 * the pending queue for moderation.
 */

export interface ReviewState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

const reviewSchema = z.object({
  productId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1, "Choose a star rating.").max(5),
  title: z.string().trim().min(2, "Add a short title.").max(140, "Keep the title under 140 characters."),
  body: z.string().trim().min(10, "Tell us a bit more — at least 10 characters.").max(2000, "That review is a little long."),
});

function flatten(error: z.ZodError): ReviewState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { error: "Check the highlighted fields.", fieldErrors };
}

export async function submitProductReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const user = await currentUser();
  if (!user) return { error: "Sign in to leave a review." };

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return flatten(parsed.error);

  const slug = formData.get("slug");

  await createReview({
    productId: parsed.data.productId,
    userId: user.id,
    authorName: `${user.firstName} ${user.lastName}`.trim() || user.email,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
    image: null,
    verified: true,
  });

  if (typeof slug === "string" && slug) revalidatePath(`/product/${slug}`);
  return { success: true };
}