/**
 * HTTP-level route probe.
 *
 * Uses raw `fetch` with `redirect: "manual"` so the *unfollowed* status and
 * `Location` header are observable — PowerShell's Invoke-WebRequest follows
 * redirects silently, which hides broken auth gates.
 *
 *   node scripts/probe-routes.mts
 */

import { SESSION_COOKIE, createSessionToken } from "@/lib/auth";
import { get } from "@/lib/db";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

type Expect = "ok" | "redirect" | "gone" | "unauthorized";

interface Case {
  path: string;
  as: "guest" | "member";
  expect: Expect;
  contains?: string;
  /** Exact path of the redirect target, when the gate is a simple hop. */
  to?: string;
}

let failures = 0;

async function run(test: Case, cookie: string) {
  const headers: Record<string, string> = cookie ? { cookie } : {};
  const res = await fetch(`${BASE}${test.path}`, { headers, redirect: "manual" });
  const status = res.status;
  const location = res.headers.get("location");
  const body = test.contains ? await res.text() : "";

  let ok = false;
  let note = "";

  switch (test.expect) {
    case "ok":
      ok = status === 200 && (!test.contains || body.includes(test.contains));
      note = test.contains ? `'${test.contains}'` : "";
      break;
    case "redirect":
      ok = [301, 302, 303, 307, 308].includes(status) && !!location;
      // The `next` query must survive, or the shopper loses their place.
      if (ok && test.path !== "/login" && !location!.includes("next=")) {
        ok = false;
        note = "redirect lost ?next=";
      }
      if (ok && test.to && !location!.endsWith(test.to)) {
        ok = false;
        note = `wanted ${test.to}`;
      }
      break;
    case "unauthorized":
      ok = status === 401;
      break;
    case "gone":
      ok = status === 404;
      break;
  }

  if (!ok) failures += 1;
  const label = `${test.as === "member" ? "member" : "guest "} ${test.path}`;
  console.log(
    `  ${ok ? "ok  " : "FAIL"} ${label.padEnd(30)} ${status}${
      location ? ` -> ${location}` : ""
    }${note ? `  (${note})` : ""}`,
  );
}

const user = (await get<{ id: number; email: string }>(
  "SELECT id, email FROM users WHERE email = ?",
  "demo@wearnow.com",
))!;
const token = createSessionToken({ sub: user.id, email: user.email, role: "customer" });
const memberCookie = `${SESSION_COOKIE}=${token}`;

const cases: Case[] = [
  { path: "/", as: "guest", expect: "ok", contains: "Wear Now" },
  { path: "/login", as: "guest", expect: "ok", contains: "Welcome back" },
  { path: "/signup", as: "guest", expect: "ok", contains: "Create your account" },
  { path: "/cart", as: "guest", expect: "ok" },
  { path: "/wishlist", as: "guest", expect: "ok" },

  { path: "/account", as: "guest", expect: "redirect", to: "/login?next=%2Faccount" },
  { path: "/checkout", as: "guest", expect: "redirect", to: "/login?next=%2Fcheckout" },
  { path: "/account/orders", as: "guest", expect: "redirect" },
  { path: "/account/addresses", as: "guest", expect: "redirect" },
  { path: "/account/profile", as: "guest", expect: "redirect" },
  { path: "/api/cart", as: "guest", expect: "unauthorized" },

  { path: "/account", as: "member", expect: "ok", contains: "Jordan" },
  { path: "/account/orders", as: "member", expect: "ok", contains: "MA-" },
  { path: "/account/wishlist", as: "member", expect: "ok" },
  { path: "/account/profile", as: "member", expect: "ok", contains: "demo@wearnow.com" },
  { path: "/account/addresses", as: "member", expect: "ok" },
  { path: "/login", as: "member", expect: "redirect", to: "/account" },
  { path: "/api/cart", as: "member", expect: "ok", contains: "cart" },

  { path: "/definitely-not-a-page", as: "guest", expect: "gone" },
];

console.log(`\nProbing ${BASE}\n`);
for (const test of cases) {
  await run(test, test.as === "member" ? memberCookie : "");
}

console.log(failures === 0 ? "\nAll routes behaved as expected.\n" : `\n${failures} route(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
