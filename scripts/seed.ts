/**
 * Seeds (or re-seeds) the target database.
 *
 *   npm run db:seed          only seeds if the catalog is empty
 *   npm run db:reset --      wipes all content and re-seeds from scratch
 *
 * It targets whatever the process environment points at: the local `data/`
 * database by default, or a hosted Turso database when DATABASE_URL (and
 * DATABASE_AUTH_TOKEN, if required) are set. Run it once before `npm run dev`
 * if you prefer explicit setup; otherwise the app self-seeds on first request
 * against a local file.
 */
import { seed, verifySeed } from "../src/lib/data/seed.ts";
import { getDatabaseTarget } from "../src/lib/db/index.ts";

const force = process.argv.includes("--reset");

console.log(force ? "Resetting and seeding..." : "Seeding if empty...");
const result = await seed(force);

if (result.products > 0) {
  console.log(
    `  ${result.categories} categories x ${result.products} products x ${result.variants} variants\n` +
      `  ${result.reviews} reviews x ${result.users} users x ${result.orders} orders\n` +
      `  ${result.inspiration} inspiration posts x ${result.discounts} discounts`,
  );
} else {
  console.log("  Database already populated - nothing to do.");
}

const problems = await verifySeed();
if (problems.length) {
  console.error(`\n  ${problems.length} consistency problem(s):`);
  for (const p of problems) console.error(`   - ${p}`);
  process.exitCode = 1;
} else {
  console.log("\n  Consistency check passed.");
}

console.log(`\n  Database: ${getDatabaseTarget()}`);
console.log("  Admin login:    owner@wearnow.com / wearnow2026");
console.log("  Customer login: demo@wearnow.com / demo1234\n");