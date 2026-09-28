import { ensureSchema, isRemoteDatabase } from "./index";
import { isSeeded, seed } from "../data/seed";

/**
 * Called once per server process before the app handles any request.
 *
 * Applies the schema, then seeds the catalog if the database is empty. Seeding
 * is local-only: a fresh clone runs `npm run dev` against a fully populated
 * storefront with no manual step, but a hosted database is seeded explicitly via
 * `npm run db:reset` with DATABASE_URL set rather than on every cold start.
 *
 * This is deliberately *not* awaited by the request path: it is kicked off at
 * module scope and every query awaits `ensureSchema()` itself, so a cold start
 * can never serve a request against an unmigrated database.
 */
let initialising: Promise<void> | null = null;

export function initDatabase(): Promise<void> {
  if (!initialising) {
    initialising = (async () => {
      await ensureSchema();
      if (isRemoteDatabase() || (await isSeeded())) return;
      const result = await seed();
      console.log(`[db] seeded ${result.products} products`);
    })().catch((error) => {
      // Let the next call retry rather than caching a permanent failure.
      initialising = null;
      throw error;
    });
  }
  return initialising;
}