import { createSessionToken, verifyPassword, hashPassword } from "@/lib/auth";
import { get } from "@/lib/db";
import { getWishlist, listOrdersForUser } from "@/lib/queries";

/**
 * Exercises the real auth path against the seeded database: password
 * verification for every seeded account, fail-closed behaviour on bad input,
 * and a signed session token that can be pasted into a browser cookie.
 *
 * Queries the users table directly rather than through `lib/session` because
 * that module imports `next/headers` and needs a live request scope.
 */

interface UserRow {
  id: number;
  email: string;
  role: string;
  password_hash: string;
}

const cases: [string, string][] = [
  ["owner@wearnow.com", "wearnow2026"],
  ["demo@wearnow.com", "demo1234"],
  ["imogen.hart@example.com", "demo1234"],
  ["demo@wearnow.com", "wrong-password"],
  ["demo@wearnow.com", "wearnow2026"],
  ["nobody@wearnow.com", "demo1234"],
];

for (const [email, password] of cases) {
  const user = await get<UserRow>("SELECT id, email, role, password_hash FROM users WHERE email = ?", email);
  const ok = user ? verifyPassword(password, user.password_hash) : false;
  console.log(`${email.padEnd(26)} ${password.padEnd(16)} -> ${ok ? "OK" : "REJECTED"}`);
}

console.log("--- fail-closed ---");
console.log("malformed hash        ->", verifyPassword("x", "not-a-hash") ? "OK" : "REJECTED");
console.log("empty password        ->", verifyPassword("", hashPassword("something")) ? "OK" : "REJECTED");
console.log("unicode-normalised    ->", verifyPassword("café", hashPassword("café")) ? "OK" : "REJECTED");

console.log("--- demo account ---");
const demo = await get<UserRow>("SELECT id, email, role, password_hash FROM users WHERE email = ?", "demo@wearnow.com");
if (!demo) throw new Error("demo user missing — run `npm run db:reset` first");
console.log("role                  :", demo.role);
console.log("orders                :", (await listOrdersForUser(demo.id)).length);
console.log("wishlist              :", (await getWishlist(demo.id)).length);
console.log("users in db           :", (await get<{ n: number }>("SELECT COUNT(*) AS n FROM users"))?.n);

const role = demo.role === "admin" ? "admin" : "customer";
console.log("TOKEN:" + createSessionToken({ sub: demo.id, email: demo.email, role }));