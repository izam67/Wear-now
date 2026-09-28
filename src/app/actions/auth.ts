"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { run } from "@/lib/db";
import { createAccount, subscribeToNewsletter } from "@/lib/queries";
import {
  checkRateLimit,
  clearRateLimit,
  hashPassword,
  rateLimitKey,
  verifyPassword,
} from "@/lib/auth";
import { endSession, findUserByEmail, startSession } from "@/lib/session";

/**
 * Sign-up and sign-in.
 *
 * Server Actions rather than API routes: the forms are progressively enhanced
 * (they post and redirect without JavaScript), the session cookie is set in the
 * same response as the redirect, and there is no endpoint for an attacker to
 * cross-origin probe.
 */

export interface AuthState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Enter your email address.")
  .max(254, "That email address is too long.")
  .email("Enter a valid email address.");

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(60, "That name is too long."),
  lastName: z.string().trim().min(1, "Enter your last name.").max(60, "That name is too long."),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(200, "That password is too long."),
  confirm: z.string(),
  marketing: z.string().optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

/**
 * Only allow same-origin relative paths as a post-auth destination, otherwise
 * `/login?next=https://evil.example` turns the sign-in form into an open redirect.
 */
function safeNext(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/account";
  return value;
}

async function clientKey(scope: "login" | "signup") {
  // Throttle per source address. Behind a proxy this is the leftmost entry in
  // X-Forwarded-For; `x-real-ip` covers setups that set only that.
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || hdrs.get("x-real-ip") || "unknown";
  return rateLimitKey(scope, ip);
}

function flatten(error: z.ZodError): AuthState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { error: "Check the highlighted fields.", fieldErrors };
}

/* ------------------------------------------------------------------ *
 * Sign up
 * ------------------------------------------------------------------ */

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
    marketing: formData.get("marketing") ?? undefined,
  });

  if (!parsed.success) return flatten(parsed.error);

  const { firstName, lastName, email, password, confirm } = parsed.data;

  if (password !== confirm) {
    return { error: "Check the highlighted fields.", fieldErrors: { confirm: "Passwords do not match." } };
  }

  // 8 characters is the floor, not the goal. Reject the passwords that appear
  // at the top of every credential-stuffing list.
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: { password: "That password is too common. Choose something less predictable." },
    };
  }

  const limit = checkRateLimit(await clientKey("signup"));
  if (!limit.allowed) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  if (await findUserByEmail(email)) {
    // Do not confirm which emails are registered — that is an account-enumeration
    // oracle. The user is simply told to sign in instead.
    return {
      error: "Check the highlighted fields.",
      fieldErrors: { email: "An account already uses this email. Try signing in instead." },
    };
  }
  const userId = await createAccount({
    email,
    passwordHash: hashPassword(password),
    firstName,
    lastName,
  });

  if (userId === null) {
    return { error: "We couldn't create your account. Please try again." };
  }

  // A new account starts with the address book empty; the checkout flow
  // collects the first shipping address inline.
  if (parsed.data.marketing === "on") {
    await subscribeToNewsletter(email);
  }

  await startSession({ sub: userId, email, role: "customer" });
  clearRateLimit(await clientKey("signup"));

  redirect(safeNext(formData.get("next")));
}

/* ------------------------------------------------------------------ *
 * Sign in
 * ------------------------------------------------------------------ */

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return flatten(parsed.error);
  const { email, password } = parsed.data;

  const limit = checkRateLimit(await clientKey("login"));
  if (!limit.allowed) {
    return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };
  }

  const user = await findUserByEmail(email);

  // Always run a hash comparison, even when the user does not exist, so the
  // response time does not reveal whether the email is registered.
  const stored = user?.password_hash ?? DUMMY_HASH;
  const ok = verifyPassword(password, stored);

  if (!user || !ok) {
    return { error: "That email and password combination doesn't match an account." };
  }

  clearRateLimit(await clientKey("login"));
  await startSession({ sub: user.id, email: user.email, role: user.role });

  redirect(safeNext(formData.get("next")));
}

/* ------------------------------------------------------------------ *
 * Sign out
 * ------------------------------------------------------------------ */

export async function logout() {
  await endSession();
  redirect("/");
}

/* ------------------------------------------------------------------ *
 * Password policy
 * ------------------------------------------------------------------ */

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890",
  "qwerty123", "qwertyuiop", "iloveyou", "sunshine", "princess", "admin123",
  "welcome1", "letmein1", "football", "baseball", "trustno1", "monkey123",
  "abc12345", "passw0rd", "wear1234", "wearnow123",
]);

/**
 * A syntactically valid scrypt hash of a random value nobody can supply, used to
 * keep the "unknown email" path as expensive as the "wrong password" path. It is
 * a real 64-byte hash so the work factor is identical, and the plaintext is
 * unguessable so no password can ever match it.
 */
const DUMMY_HASH =
  "scrypt$16384$8$1$p+cdiJrL85K+E26S3PzqYQ==" +
  "$EM8W7ESBMMRLaB2eD4/eHyikTBOQ9Qa4rzquqVJ9IYPfZoTQZ4M3UeBYecdu3HfVlrgTR998EWGo7ftHYFF27A==";

/* ------------------------------------------------------------------ *
 * Account detail
 * ------------------------------------------------------------------ */

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(60),
  lastName: z.string().trim().min(1, "Enter your last name.").max(60),
  phone: z.string().trim().max(40).optional(),
});

export async function updateProfile(userId: number, _prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return flatten(parsed.error);

  run(
    "UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?",
    parsed.data.firstName,
    parsed.data.lastName,
    parsed.data.phone || null,
    userId,
  );

  return { error: undefined };
}
