import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, jsonError } from "@/lib/session";
import { getProductById, getWishlistProductIds, toggleWishlistItem } from "@/lib/queries";

/**
 * Wishlist sync for signed-in shoppers. Guests keep theirs in localStorage and
 * the same merge-on-sign-in path as the cart handles it.
 */
export const dynamic = "force-dynamic";

const toggleSchema = z.object({ productId: z.number().int().positive() });

export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to sync your wishlist", 401);
  return NextResponse.json({ wishlist: getWishlistProductIds(user.id) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to sync your wishlist", 401);

  const parsed = toggleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid product", 422);

  const product = getProductById(parsed.data.productId);
  if (!product) return jsonError("That piece is no longer available", 404);

  const { inWishlist } = toggleWishlistItem(user.id, product.id);
  return NextResponse.json({
    inWishlist,
    wishlist: getWishlistProductIds(user.id),
  });
}
