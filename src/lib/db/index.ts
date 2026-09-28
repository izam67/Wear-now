import { createClient, type Client, type InValue } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";

/**
 * Database access, backed by libSQL.
 *
 * One code path serves both environments:
 *
 *   - Local dev  — `file:./data/wearnow.db`, an embedded database, so there is
 *     no server to run and the seed script stays fast.
 *   - Deployed   — a `libsql://` URL (Turso's free tier is enough for this),
 *     because serverless hosts have an ephemeral, read-only filesystem and a
 *     local file would vanish between requests.
 *
 * The driver is chosen entirely by `DATABASE_URL`, so the code exercised by
 * the test scripts is the same code that runs in production.
 *
 * Everything here is async. libSQL talks to a remote database over HTTP, and
 * a synchronous facade would only be honest for the local case.
 */

export type Row = Record<string, unknown>;

/** Values libSQL will accept as a bound parameter. */
export type Param = string | number | bigint | null | Uint8Array;

const DB_URL =
  process.env.DATABASE_URL?.trim() || `file:${path.join(process.cwd(), "data", "wearnow.db")}`;

const isLocalFile = DB_URL.startsWith("file:");

declare global {
  var __wearNowClient: Client | undefined;
}

function localPathFromUrl(url: string): string {
  const filePath = url.replace(/^file:(\/\/)?/, "");
  return path.isAbsolute(filePath)
    ? filePath
    : path.join(/* turbopackIgnore: true */ process.cwd(), filePath);
}

function create(): Client {
  const client = createClient({
    url: DB_URL,
    // Only meaningful for a remote database; libSQL rejects it on `file:`.
    ...(isLocalFile ? {} : { authToken: process.env.DATABASE_AUTH_TOKEN }),
  });

  if (isLocalFile) {
    const filePath = localPathFromUrl(DB_URL);
    mkdirSync(path.dirname(filePath), { recursive: true });
  }

  return client;
}

export function getClient(): Client {
  if (!globalThis.__wearNowClient) {
    globalThis.__wearNowClient = create();
  }
  return globalThis.__wearNowClient;
}

/** Points at the local file, or redacts credentials for a remote URL. */
export function getDatabaseTarget(): string {
  if (isLocalFile) return localPathFromUrl(DB_URL);
  const url = new URL(DB_URL);
  return `${url.protocol}//${url.hostname}${url.pathname}`;
}

export function isRemoteDatabase(): boolean {
  return !isLocalFile;
}

/* ------------------------------------------------------------------ *
 * Parameter and row coercion
 *
 * `undefined` and booleans are not valid bind values, and libSQL hands back
 * BigInt for INTEGER columns on some paths. Everything crossing this boundary
 * is normalised so callers can pass ordinary JavaScript.
 * ------------------------------------------------------------------ */

function coerce(value: unknown): InValue {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Uint8Array) return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value;
  }
  if (typeof value === "bigint") return value;
  if (typeof value === "string") return value;
  return String(value);
}

function toPlain<T>(row: unknown): T {
  const source = row as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    out[key] = typeof value === "bigint" ? Number(value) : value;
  }
  return out as T;
}

/* ------------------------------------------------------------------ *
 * Query helpers
 * ------------------------------------------------------------------ */

/** Runs a SELECT and returns all rows. */
export async function all<T = Row>(sql: string, ...params: unknown[]): Promise<T[]> {
  await ensureSchema();
  const result = await getClient().execute({ sql, args: params.map(coerce) as InValue[] });
  return result.rows.map((row) => toPlain<T>(row));
}

/** Runs a SELECT and returns the first row, or null. */
export async function get<T = Row>(sql: string, ...params: unknown[]): Promise<T | null> {
  await ensureSchema();
  const result = await getClient().execute({ sql, args: params.map(coerce) as InValue[] });
  return result.rows.length ? toPlain<T>(result.rows[0]) : null;
}

/** Runs an INSERT/UPDATE/DELETE. Returns affected rows + last insert id. */
export async function run(
  sql: string,
  ...params: unknown[]
): Promise<{ changes: number; lastInsertRowid: number }> {
  await ensureSchema();
  const result = await getClient().execute({ sql, args: params.map(coerce) as InValue[] });
  return {
    changes: Number(result.rowsAffected ?? 0),
    lastInsertRowid: Number(result.lastInsertRowid ?? 0),
  };
}

/** Scalar helper for `SELECT COUNT(*)` style queries. */
export async function scalar<T = number>(sql: string, ...params: unknown[]): Promise<T | null> {
  const row = await get<Row>(sql, ...params);
  if (!row) return null;
  const first = Object.values(row)[0];
  return (first as T) ?? null;
}

/**
 * Runs several statements atomically.
 *
 * This is the replacement for an interactive transaction. libSQL over HTTP has
 * no way to hold a transaction open across `await` boundaries, but `batch` is
 * applied as a single unit — either every statement lands or none does — which
 * is the guarantee order placement actually needs.
 */
export async function batch(
  statements: { sql: string; args?: unknown[] }[],
): Promise<{ changes: number; lastInsertRowid: number }[]> {
  if (statements.length === 0) return [];
  await ensureSchema();
  const result = await getClient().batch(
    statements.map((s) => ({ sql: s.sql, args: (s.args ?? []).map(coerce) as InValue[] })),
    "write",
  );
  return result.map((r) => ({
    changes: Number(r.rowsAffected ?? 0),
    lastInsertRowid: Number(r.lastInsertRowid ?? 0),
  }));
}

/** Parses a JSON column, tolerating legacy or malformed values. */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ *
 * Schema
 *
 * `CREATE TABLE IF NOT EXISTS` is idempotent, so this doubles as the migration.
 * It is applied once per process, before any query is served, so a cold server
 * cannot answer a request against a database that hasn't been migrated yet.
 * ------------------------------------------------------------------ */

let schemaPromise: Promise<void> | null = null;

/**
 * Local-only pragmas, applied once per process before the schema.
 *
 * A `next build` runs page-data collection in several worker processes that all
 * open the same file and race each other's DDL. The default journal is rollback
 * mode, under which a writer holds a lock that makes every other process fail
 * with SQLITE_BUSY instead of waiting. WAL turns those concurrent touches into
 * waits, and `busy_timeout` bounds how long each call blocks before it errors.
 */
let pragmasPromise: Promise<void> | null = null;

function ensureLocalPragmas(): Promise<void> {
  if (!isLocalFile) return Promise.resolve();
  if (!pragmasPromise) {
    pragmasPromise = (async () => {
      const client = getClient();
      await client.execute("PRAGMA journal_mode = WAL");
      await client.execute("PRAGMA busy_timeout = 5000");
      await client.execute("PRAGMA foreign_keys = ON");
    })().catch((error) => {
      pragmasPromise = null;
      throw error;
    });
  }
  return pragmasPromise;
}

/**
 * Splits the schema into individual statements.
 *
 * The schema is DDL only — no triggers or `BEGIN...END` bodies, which would
 * need a real parser — so splitting on `;` is sufficient once comments are
 * stripped.
 */
function schemaStatements(): string[] {
  return SCHEMA.replace(/--[^\n]*/g, "")
    .split(";")
    .map((sql) => sql.trim())
    .filter(Boolean);
}

export function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = ensureLocalPragmas()
      .then(() =>
        getClient().batch(schemaStatements().map((sql) => ({ sql })), "write"),
      )
      .then(() => undefined)
      .catch((error) => {
        // Let the next request retry rather than caching a permanent failure.
        schemaPromise = null;
        throw error;
      });
  }
  return schemaPromise;
}
