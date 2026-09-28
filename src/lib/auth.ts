import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";

/**
 * Password hashing and session-token primitives.
 *
 * Deliberately free of any `next/*` import: the seed script and any future
 * Node-side tooling need these functions without pulling in a framework
 * runtime. Cookie reading/writing lives in `session.ts`.
 */

/* ------------------------------------------------------------------ *
 * Password hashing — scrypt with a per-user random salt.
 *
 * Format: scrypt$<N>$<r>$<p>$<salt-b64>$<hash-b64>
 * ------------------------------------------------------------------ */

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: 64 * 1024 * 1024,
  });
  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64!, "base64");
  const expected = Buffer.from(hashB64!, "base64");
  const actual = scryptSync(password.normalize("NFKC"), salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* ------------------------------------------------------------------ *
 * Session tokens — compact signed tokens (HMAC-SHA256).
 *
 * A token is  base64url(payload).base64url(hmac). The payload carries the
 * user id, role and expiry. Nothing secret is stored client-side, and the
 * signature means a tampered cookie is rejected without a database hit.
 * ------------------------------------------------------------------ */

const SECRET =
  process.env.AUTH_SECRET ??
  // A per-install fallback keeps `npm run dev` working with zero setup.
  // Production must set AUTH_SECRET — see the guard in `assertProductionSecret`.
  `wear-now-dev-secret-do-not-use-in-production`;

export const SESSION_COOKIE = "ma_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export interface SessionPayload {
  sub: number;
  email: string;
  role: "customer" | "admin";
  /** Issued-at, seconds. */
  iat: number;
  /** Expiry, seconds. */
  exp: number;
}

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string) {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createSessionToken(payload: Omit<SessionPayload, "iat" | "exp">) {
  const now = Math.floor(Date.now() / 1000);
  const body: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const data = b64url(JSON.stringify(body));
  return `${data}.${sign(data)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expected = sign(data);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    if (typeof payload.sub !== "number") return null;
    return payload;
  } catch {
    return null;
  }
}

const secureInProduction = process.env.NODE_ENV === "production";

/**
 * Fails fast if a production deploy is running on the built-in development
 * secret. Called from the request boundary rather than module scope so that
 * `next build` (which sets NODE_ENV=production) doesn't trip on it.
 */
export function assertProductionSecret() {
  if (secureInProduction && !process.env.AUTH_SECRET) {
    throw new Error(
      "AUTH_SECRET must be set in production. Generate one with: openssl rand -base64 32",
    );
  }
}

/** Deterministic bucket key for rate limiting (per-IP, per-action). */
export function rateLimitKey(scope: string, identifier: string) {
  return createHash("sha256").update(`${scope}:${identifier}`).digest("hex").slice(0, 32);
}

/* ------------------------------------------------------------------ *
 * Anti-abuse
 * ------------------------------------------------------------------ */

/**
 * Login attempts are throttled with a fixed window kept in memory. Enough to
 * blunt credential stuffing on a single instance; put a shared store (Redis,
 * Upstash) in front of this when running multiple instances.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function checkRateLimit(key: string): { allowed: boolean; retryInSeconds: number } {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryInSeconds: 0 };
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, retryInSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryInSeconds: 0 };
}

export function clearRateLimit(key: string) {
  attempts.delete(key);
}
