import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, jsonError } from "@/lib/session";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartLine,
  updateCartQuantity,
} from "@/lib/queries";

/**
 * Server-side cart for signed-in shoppers.
 *
 * Guests never reach this route — their bag lives in localStorage and is merged
 * into the account on sign-in. Every mutation returns the recomputed cart so the
 * client can reconcile instead of guessing.
 */
export const dynamic = "force-dynamic";

const addSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20).default(1),
});

const updateSchema = z.object({
  lineId: z.number().int(),
  quantity: z.number().int().min(0).max(20),
});

const removeSchema = z.object({
  lineId: z.number().int().positive(),
});

async function guard() {
  const user = await currentUser();
  if (!user) return { error: jsonError("Sign in to sync your bag", 401) } as const;
  return { user } as const;
}

export async function GET() {
  const auth = await guard();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ cart: getCart(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await guard();
  if ("error" in auth) return auth.error;

  const parsed = addSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("Invalid cart item", 422, { issues: parsed.error.issues });
  }

  const result = addToCart(auth.user.id, parsed.data.variantId, parsed.data.quantity);
  if ("error" in result) return jsonError(result.error, 409);

  return NextResponse.json({ cart: getCart(auth.user.id) });
}

export async function PATCH(request: Request) {
  const auth = await guard();
  if ("error" in auth) return auth.error;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid quantity", 422);

  // Quantity is clamped to available stock server-side; a zero quantity
  // removes the line. The client reconciles against the returned cart.
  updateCartQuantity(auth.user.id, parsed.data.lineId, parsed.data.quantity);

  return NextResponse.json({ cart: getCart(auth.user.id) });
}

export async function DELETE(request: Request) {
  const auth = await guard();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  if (body && typeof body === "object" && "lineId" in body) {
    const parsed = removeSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid line", 422);
    removeCartLine(auth.user.id, parsed.data.lineId);
  } else {
    clearCart(auth.user.id);
  }

  return NextResponse.json({ cart: getCart(auth.user.id) });
}
