/**
 * Seeds (or re-seeds) the local database.
 *
 *   npm run db:seed     — only seeds if the catalog is empty
 *   npm run db:reset    — wipes all content and re-seeds from scratch
 *
 * Run it once before `npm run dev` if you prefer explicit setup; otherwise the
 * app self-seeds on first request.
 */
import { seed, verifySeed } from "../src/lib/data/seed.ts";
import { getDatabasePath } from "../src/lib/db/index.ts";

const force = process.argv.includes("--reset");

console.log(force ? "Resetting and seeding…" : "Seeding if empty…");
const result = seed(force);

if (result.products > 0) {
  console.log(
    `  ${result.categories} categories · ${result.products} products · ${result.variants} variants\n` +
      `  ${result.reviews} reviews · ${result.users} users · ${result.orders} orders\n` +
      `  ${result.inspiration} inspiration posts · ${result.discounts} discounts`,
  );
} else {
  console.log("  Database already populated — nothing to do.");
}

const problems = verifySeed();
if (problems.length) {
  console.error(`\n  ${problems.length} consistency problem(s):`);
  for (const p of problems) console.error(`   - ${p}`);
  process.exitCode = 1;
} else {
  console.log("\n  Consistency check passed.");
}

console.log(`\n  Database: ${getDatabasePath()}`);
  console.log("  Admin login:    owner@wearnow.com / wearnow2026");
  console.log("  Customer login: demo@wearnow.com / demo1234\n");
