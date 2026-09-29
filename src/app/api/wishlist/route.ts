import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, jsonError } from "@/lib/session";
import { addWishlistProducts, getProductById, getWishlistProductIds, toggleWishlistItem } from "@/lib/queries";

/**
 * Wishlist sync for signed-in shoppers. Guests keep theirs in localStorage;
 * on sign-in the local ids are pushed up via PUT and merged with the
 * account's existing list.
 */
export const dynamic = "force-dynamic";

const toggleSchema = z.object({ productId: z.number().int().positive() });
const mergeSchema = z.object({ productIds: z.array(z.number().int().positive()).max(200) });

export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to sync your wishlist", 401);
  return NextResponse.json({ wishlist: await getWishlistProductIds(user.id) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to sync your wishlist", 401);

  const parsed = toggleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid product", 422);

  const product = await getProductById(parsed.data.productId);
  if (!product) return jsonError("That piece is no longer available", 404);

  const { inWishlist } = await toggleWishlistItem(user.id, product.id);
  return NextResponse.json({
    inWishlist,
    wishlist: await getWishlistProductIds(user.id),
  });
}

/** Merge-on-sign-in: adds every guest-saved id, ignores ones already saved. */
export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to sync your wishlist", 401);

  const parsed = mergeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid product list", 422);

  await addWishlistProducts(user.id, parsed.data.productIds);
  return NextResponse.json({ wishlist: await getWishlistProductIds(user.id) });
}
