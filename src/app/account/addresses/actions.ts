"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteAddress, saveAddress } from "@/lib/queries";
import type { AuthState } from "@/app/actions/auth";

const addressSchema = z.object({
  label: z.string().trim().min(1, "Name this address.").max(40),
  firstName: z.string().trim().min(1, "Required."),
  lastName: z.string().trim().min(1, "Required."),
  line1: z.string().trim().min(1, "Required."),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "Required."),
  region: z.string().trim().min(1, "Required."),
  postalCode: z.string().trim().min(3, "Required.").max(12),
  country: z.string().trim().min(1, "Required."),
  phone: z.string().trim().optional(),
  isDefault: z.string().optional(),
});

/**
 * Address book mutations.
 *
 * Each action takes the user id from the bound argument rather than the form,
 * so one account can never write to another's addresses.
 */

export async function createAddress(
  userId: number,
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = addressSchema.safeParse({
    label: formData.get("label") ?? "Home",
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") ?? "United States",
    phone: formData.get("phone") ?? "",
    isDefault: formData.get("isDefault") ?? undefined,
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
  await saveAddress(userId, {
    label: d.label,
    firstName: d.firstName,
    lastName: d.lastName,
    line1: d.line1,
    line2: d.line2 || null,
    city: d.city,
    region: d.region,
    postalCode: d.postalCode,
    country: d.country,
    phone: d.phone ?? "",
    isDefault: d.isDefault === "on",
  });
  revalidatePath("/account/addresses");
  return {};
}

export async function removeAddress(userId: number, id: number): Promise<void> {
  await deleteAddress(userId, id);
  revalidatePath("/account/addresses");
}
