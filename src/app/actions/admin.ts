"use server";

import { revalidatePath } from "next/cache";
import { moderateReview } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

/**
 * Admin-only mutations. Every action guards itself with requireAdmin on the
 * server, so even though the forms post from the admin UI, the check is never
 * client-side.
 */

export async function moderate(reviewId: number, status: "approved" | "rejected") {
  await requireAdmin();
  await moderateReview(reviewId, status);
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}