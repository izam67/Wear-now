import { getDb } from "./index";
import { isSeeded, seed } from "../data/seed";

/**
 * Called once per server process before the app handles any request.
 *
 * Opening the database creates the schema. If the catalog is empty we seed it
 * here, which means a fresh clone runs `npm run dev` against a fully populated
 * storefront with no manual step — the thing that makes this project reviewable
 * in one command.
 */
let initialised = false;

export function initDatabase() {
  if (initialised) return;
  getDb();
  if (!isSeeded()) {
    const result = seed();
    console.log(`[db] seeded ${result.products} products`);
  }
  initialised = true;
}
