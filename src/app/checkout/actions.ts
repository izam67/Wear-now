"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  calculateTotals,
  createOrder,
  generateOrderNumber,
  getCart,
  saveAddress,
  type CartTotals,
} from "@/lib/queries";

export interface CheckoutState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Order placement.
 *
 * A Server Action rather than a route handler: the whole thing is a transaction
 * plus a redirect, and there is no client that needs a JSON response. It is also
 * the only place a card number is accepted, and that value is used solely to
 * take the last four digits before being discarded.
 */

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  firstName: z.string().trim().min(1, "Required."),
  lastName: z.string().trim().min(1, "Required."),
  line1: z.string().trim().min(1, "Required."),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "Required."),
  region: z.string().trim().min(1, "Required."),
  postalCode: z.string().trim().min(3, "Required.").max(12),
  country: z.string().trim().min(1, "Required."),
  phone: z.string().trim().optional(),
  shippingMethod: z.enum(["standard", "express", "courier"]),
  discountCode: z.string().trim().optional(),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^\d{12,19}$/.test(v), "Enter a valid card number."),
  cardName: z.string().trim().min(2, "Enter the name on the card."),
  notes: z.string().trim().max(500).optional(),
  saveAddress: z.string().optional(),
});

export async function placeOrder(
  userId: number,
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") ?? "United States",
    phone: formData.get("phone") ?? "",
    shippingMethod: formData.get("shippingMethod") ?? "standard",
    discountCode: formData.get("discountCode") ?? "",
    cardNumber: formData.get("cardNumber") ?? "",
    cardName: formData.get("cardName") ?? "",
    notes: formData.get("notes") ?? "",
    saveAddress: formData.get("saveAddress") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Check the highlighted fields.", fieldErrors };
  }

  const d = parsed.data;
  const lines = getCart(userId);

  // Re-read the bag server-side. Never trust totals, stock, or prices that
  // travelled through the browser.
  if (lines.length === 0) {
    return { error: "Your bag is empty." };
  }

  const totals: CartTotals = calculateTotals(
    lines,
    { discountCode: d.discountCode, shippingMethod: d.shippingMethod },
  );

  if (totals.discountError) {
    return { error: totals.discountError, fieldErrors: { discountCode: totals.discountError } };
  }

  // Refuse rather than oversell: another shopper may have taken the last one.
  const short = lines.find((line) => line.quantity > line.stock);
  if (short) {
    return {
      error: `${short.name} no longer has enough stock (${short.stock} left). Adjust the quantity and try again.`,
    };
  }

  const orderNumber = generateOrderNumber();
  const paymentLast4 = d.cardNumber.slice(-4);

  // createOrder runs as one transaction: it writes the order and its lines,
  // decrements variant stock, bumps discount usage and empties the bag. If any
  // of that fails, none of it sticks.
  const orderId = createOrder({
    orderNumber,
    userId,
    email: d.email,
    firstName: d.firstName,
    lastName: d.lastName,
    status: "confirmed",
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    tax: totals.tax,
    total: totals.total,
    discountCode: totals.discountCode,
    shippingMethod: d.shippingMethod,
    paymentLast4,
    notes: d.notes || null,
    address: {
      firstName: d.firstName,
      lastName: d.lastName,
      line1: d.line1,
      line2: d.line2 || null,
      city: d.city,
      region: d.region,
      postalCode: d.postalCode,
      country: d.country,
      phone: d.phone ?? "",
    },
    items: lines.map((line) => ({
      productId: line.productId,
      slug: line.slug,
      name: line.name,
      subtitle: line.subtitle,
      image: line.image,
      color: line.color,
      size: line.size,
      price: line.price,
      quantity: line.quantity,
      variantId: line.variantId,
    })),
  });

  if (d.saveAddress === "on") {
    saveAddress(userId, {
      label: "Shipping",
      firstName: d.firstName,
      lastName: d.lastName,
      line1: d.line1,
      line2: d.line2 || null,
      city: d.city,
      region: d.region,
      postalCode: d.postalCode,
      country: d.country,
      phone: d.phone ?? "",
      isDefault: false,
    });
  }

  revalidatePath("/account/orders");
  revalidatePath("/account");
  void orderId;
  redirect(`/account/orders/${orderNumber}?placed=1`);
}
