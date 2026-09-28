import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  verifySessionToken,
  createSessionToken,
  assertProductionSecret,
  type SessionPayload,
} from "./auth";
import { get } from "./db";
import type { User } from "./types";


/* ------------------------------------------------------------------ *
 * Cookie-backed session (Next server runtime only)
 * ------------------------------------------------------------------ */

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days
const secureInProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: secureInProduction,
  path: "/",
} as const;

export async function startSession(payload: Omit<SessionPayload, "iat" | "exp">) {
  assertProductionSecret();
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(payload), {
    ...cookieOptions,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}


interface UserRow {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "customer" | "admin";
  created_at: string;
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function findUserById(id: number): User | null {
  const row = get<UserRow>(
    "SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = ?",
    id,
  );
  return row ? toUser(row) : null;
}

export function findUserByEmail(email: string) {
  return get<UserRow & { password_hash: string }>(
    "SELECT id, email, first_name, last_name, role, created_at, password_hash FROM users WHERE email = ?",
    email,
  );
}

/** The signed-in user, or null. Never throws. */
export async function currentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  return findUserById(session.sub);
}

/** The signed-in user, or a redirect to sign-in with a return path. */
export async function requireUser(returnTo?: string): Promise<User> {
  const session = await getSession();
  if (!session) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/login${next}`);
  }
  const user = findUserById(session.sub);
  if (!user) redirect("/login");
  return user;
}

/** Guards admin-only areas. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

/**
 * Guards admin API routes. Returns a structured error instead of redirecting,
 * because a redirect is meaningless for fetch() callers.
 */
export async function apiRequireAdmin(): Promise<
  { user: User } | { error: Response }
> {
  const session = await getSession();
  if (!session) {
    return { error: jsonError("Authentication required", 401) };
  }
  const user = findUserById(session.sub);
  if (!user) {
    return { error: jsonError("Authentication required", 401) };
  }
  if (user.role !== "admin") {
    return { error: jsonError("Administrator access required", 403) };
  }
  return { user };
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return Response.json({ ok: false, error: message, ...extra }, { status });
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, ...(data as object) }, init);
}

