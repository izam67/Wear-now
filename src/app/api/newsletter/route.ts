import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribeToNewsletter } from "@/lib/queries";
import { checkRateLimit, clearRateLimit, rateLimitKey } from "@/lib/auth";
import { isEmail } from "@/lib/utils";

/**
 * Newsletter signup. Accepts a normal form POST (progressive enhancement — the
 * form works without JS) and returns JSON when called from the client.
 */
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().toLowerCase() });

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const limit = checkRateLimit(rateLimitKey("newsletter", ip));
  if (!limit.allowed) {
    return json({ ok: false, message: "Too many attempts. Please try again later." }, 429);
  }

  const form = await request.formData().catch(() => null);
  const raw = form ? form.get("email") : (await request.json().catch(() => null))?.email;
  const parsed = schema.safeParse({ email: typeof raw === "string" ? raw : "" });

  const wantsJson = request.headers.get("accept")?.includes("application/json") ?? false;
  const fail = (message: string, status: number) =>
    wantsJson
      ? json({ ok: false, message }, status)
      : NextResponse.redirect(new URL(`/?newsletter=${encodeURIComponent("error")}`, request.url));

  if (!parsed.success || !isEmail(parsed.data.email)) {
    return fail("Enter a valid email address", 422);
  }

  const result = await subscribeToNewsletter(parsed.data.email);
  if (result.ok) clearRateLimit(rateLimitKey("newsletter", ip));

  return wantsJson
    ? json(result, result.ok ? 200 : 409)
    : NextResponse.redirect(new URL(`/?newsletter=${result.ok ? "ok" : "error"}`, request.url));
}

function json(data: { ok: boolean; message: string }, status: number) {
  return NextResponse.json(data, { status });
}
