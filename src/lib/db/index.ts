import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";

/**
 * SQLite via Node's built-in `node:sqlite` — no native modules to compile.
 *
 * The connection is cached on `globalThis` so Next's dev-mode module reloading
 * doesn't open a new handle on every request.
 */

export type Row = Record<string, unknown>;

const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "wearnow.db");

declare global {
  var __wearNowDb: DatabaseSync | undefined;
}

function open(): DatabaseSync {
  if (DB_PATH !== ":memory:") {
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  const database = new DatabaseSync(DB_PATH);

  // busy_timeout has to come first: every statement below needs to be willing
  // to wait for a lock, and a pragma that ignores the timeout will throw
  // immediately instead.
  database.exec("PRAGMA busy_timeout = 10000");

  // journal_mode is a persistent property of the *file*, so once it is WAL
  // every later process reading this pragma still takes a brief exclusive
  // lock. `next build` opens the database from several workers at once, which
  // makes the re-assert race, and losing that race is harmless: the mode is
  // already correct. Verify rather than set, and tolerate a lock.
  try {
    const mode = database
      .prepare("PRAGMA journal_mode")
      .get() as { journal_mode?: string } | undefined;
    if (String(mode?.journal_mode).toLowerCase() !== "wal") {
      database.exec("PRAGMA journal_mode = WAL");
    }
  } catch {
    // Another process is mid-switch. WAL is a performance setting, so defer to
    // whatever the winning writer chose.
  }

  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA synchronous = NORMAL");

  // `CREATE TABLE IF NOT EXISTS` is idempotent but still write-locks. Keep the
  // whole schema in one transaction so concurrent workers either see a fully
  // migrated database or do no work at all.
  try {
    database.exec("BEGIN IMMEDIATE");
    database.exec(SCHEMA);
    database.exec("COMMIT");
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      // No active transaction to unwind.
    }
    throw error;
  }

  return database;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__wearNowDb) {
    globalThis.__wearNowDb = open();
  }
  return globalThis.__wearNowDb;
}

export function getDatabasePath() {
  return DB_PATH;
}

/* ------------------------------------------------------------------ *
 * Query helpers
 *
 * `node:sqlite` returns null-prototype objects and rejects `undefined` /
 * booleans as bound values, so every result is normalised to a plain object
 * and every parameter is coerced to a supported primitive.
 * ------------------------------------------------------------------ */

export type Param = string | number | null | bigint | Uint8Array;

function coerce(value: unknown): Param {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "string") {
    return value;
  }
  if (value instanceof Uint8Array) return value;
  return String(value);
}

function toPlain<T>(row: unknown): T {
  return { ...(row as object) } as T;
}

/** Runs a SELECT and returns all rows. */
export function all<T = Row>(sql: string, ...params: unknown[]): T[] {
  const stmt = getDb().prepare(sql);
  return stmt.all(...params.map(coerce)).map((r) => toPlain<T>(r));
}

/** Runs a SELECT and returns the first row, or null. */
export function get<T = Row>(sql: string, ...params: unknown[]): T | null {
  const stmt = getDb().prepare(sql);
  const row = stmt.get(...params.map(coerce));
  return row === undefined ? null : toPlain<T>(row);
}

/** Runs an INSERT/UPDATE/DELETE. Returns affected rows + last insert id. */
export function run(sql: string, ...params: unknown[]): { changes: number; lastInsertRowid: number } {
  const stmt = getDb().prepare(sql);
  const result = stmt.run(...params.map(coerce));
  return {
    changes: Number(result.changes ?? 0),
    lastInsertRowid: Number(result.lastInsertRowid ?? 0),
  };
}

/** Scalar helper for `SELECT COUNT(*)` style queries. */
export function scalar<T = number>(sql: string, ...params: unknown[]): T | null {
  const row = get<Row>(sql, ...params);
  if (!row) return null;
  const first = Object.values(row)[0];
  return (first as T) ?? null;
}

/**
 * Wraps a unit of work in a transaction. Nested calls reuse the outer
 * transaction so composed helpers stay atomic without double-BEGIN errors.
 */
let txDepth = 0;
export function transaction<T>(fn: () => T): T {
  const db = getDb();
  if (txDepth > 0) return fn();
  txDepth += 1;
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* the transaction was already unwound */
    }
    throw error;
  } finally {
    txDepth -= 1;
  }
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
