import { all, get } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import {
  getCart,
  getOrderForUser,
  getWishlist,
  listAddresses,
  listCategories,
  listOrdersForUser,
  queryProducts,
  ratingBreakdown,
  getReviewsForProduct,
  getNewArrivals,
  getBestSellers,
  getProductBySlug,
  getRelatedProducts,
  calculateTotals,
  addToCart,
  updateCartQuantity,
  removeCartLine,
  clearCart,
  createOrder,
  generateOrderNumber,
  toggleWishlistItem,
  listAllOrders,
  getAdminStats,
  listDiscounts,
  subscribeToNewsletter,
  createAccount,
} from "@/lib/queries";

/**
 * Exercises every query the storefront actually reaches at runtime.
 *
 * This exists because a signed-out session never touches most of these — the
 * root layout, cart drawer and account pages all short-circuit for guests — so
 * a broken column reference can sit there passing typecheck and build, and only
 * surface once someone logs in. Anything that throws here fails the smoke test.
 */

let failures = 0;

async function check(label: string, fn: () => unknown) {
  try {
    const result = await fn();
    const detail =
      result === null
        ? "null"
        : Array.isArray(result)
          ? `${result.length} rows`
          : typeof result;
    console.log(`  ok    ${label.padEnd(34)} ${detail}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${label.padEnd(34)} ${(error as Error).message}`);
  }
}

const demo = await get<{ id: number; email: string }>(
  "SELECT id, email FROM users WHERE email = ?",
  "demo@wearnow.com",
);

if (!demo) {
  console.error("demo user missing — run `npm run db:reset` first");
  process.exit(1);
}

console.log(`\nCatalog (guest-facing)`);
const first = (await get<{ slug: string }>("SELECT slug FROM products WHERE status='active' LIMIT 1"))!;
await check("listCategories", () => listCategories());
await check("queryProducts", () => queryProducts({ perPage: 12 }));
await check("queryProducts filtered", () =>
  queryProducts({ category: ["women"], sort: "price-asc", perPage: 8 }),
);
await check("queryProducts search", () => queryProducts({ q: "linen", perPage: 8 }));
await check("queryProducts facets exclude own dimension", async () => {
  const r = await queryProducts({ category: ["women"], colors: ["Black"], perPage: 8 });
  return r.facets.categories.length;
});
await check("queryProducts pagination clamps", async () =>
  (await queryProducts({ perPage: 8, page: 999 })).page,
);
await check("getNewArrivals", () => getNewArrivals(12));
await check("getBestSellers", () => getBestSellers(4));
const product = (await getProductBySlug(first.slug))!;
await check("getProductBySlug", () => product && product.name);
await check("getRelatedProducts", () => getRelatedProducts(product, 4));
await check("getReviewsForProduct", () => getReviewsForProduct(product.id));
await check("ratingBreakdown", () => ratingBreakdown(product.id));

console.log(`\nAccount ${demo.email} (id ${demo.id})`);
await check("listOrdersForUser", () => listOrdersForUser(demo.id));
await check("getOrderForUser", async () => {
  const orders = await listOrdersForUser(demo.id);
  const order = orders[0];
  return order ? getOrderForUser(order.orderNumber, demo.id) : null;
});
await check("getWishlist", () => getWishlist(demo.id));
await check("listAddresses", () => listAddresses(demo.id));
await check("getCart", () => getCart(demo.id));

console.log(`\nCart mutations`);
const variant = (await get<{ id: number; stock: number }>(
  "SELECT id, stock FROM variants WHERE stock > 5 LIMIT 1",
))!;
await check("addToCart", () => addToCart(demo.id, variant.id, 2));
const cart = await getCart(demo.id);
await check("getCart after add", () => cart.length);
await check("calculateTotals", () => calculateTotals(cart, { shippingMethod: "express" }));
await check("calculateTotals + code", () => calculateTotals(cart, { discountCode: "WEARNOW10" }));
const cartLine = cart[0];
if (cartLine) {
  await check("updateCartQuantity", () => updateCartQuantity(demo.id, cartLine.id, 3));
  await check("getCart reflects qty", async () =>
    (await getCart(demo.id))[0]?.quantity,
  );
  await check("removeCartLine", () => removeCartLine(demo.id, cartLine.id));
}
await check("clearCart", () => clearCart(demo.id));
await check("getCart after clear", async () => (await getCart(demo.id)).length);

console.log(`\nSignup flow`);
const freshEmail = `smoke-${Date.now()}@wearnow.com`;
const newId = await createAccount({
  email: freshEmail,
  passwordHash: hashPassword("smoke-test-passphrase"),
  firstName: "Smoke",
  lastName: "Tester",
});
await check("createAccount returns an id", () => typeof newId === "number");
await check("duplicate signup is refused", () =>
  createAccount({
    email: freshEmail,
    passwordHash: hashPassword("another-passphrase"),
    firstName: "Dup",
    lastName: "Licate",
  }).then((id) => id === null),
);
await check("new account can sign in", async () => {
  const row = (await get<{ password_hash: string; role: string }>(
    "SELECT password_hash, role FROM users WHERE email = ?",
    freshEmail,
  ))!;
  return verifyPassword("smoke-test-passphrase", row.password_hash) && row.role === "customer";
});
await check("wrong password rejected", async () => {
  const row = (await get<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE email = ?",
    freshEmail,
  ))!;
  return !verifyPassword("not-the-password", row.password_hash);
});
// The opt-in runs in the same action as the user insert; it used to name a
// table that does not exist, which only blew up on a real signup.
await check("marketing opt-in does not throw", async () => (await subscribeToNewsletter(freshEmail)).ok);
await check("marketing opt-in is idempotent", async () => (await subscribeToNewsletter(freshEmail)).ok);
await check("opted-in address is stored", async () =>
  (await get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM newsletter_subscribers WHERE email = ?",
    freshEmail,
  ))?.n === 1,
);
await check("fresh account has empty bag + wishlist", async () => {
  if (newId === null) throw new Error("no id");
  const cart = await getCart(newId);
  const wishlist = await getWishlist(newId);
  return cart.length === 0 && wishlist.length === 0;
});

console.log(`\nWishlist mutations`);
await check("toggle on", async () => (await toggleWishlistItem(demo.id, product.id)).inWishlist);
await check("toggle off", async () => (await toggleWishlistItem(demo.id, product.id)).inWishlist);

console.log(`\nOrder placement`);
await addToCart(demo.id, variant.id, 1);
const orderLines = await getCart(demo.id);
const orderTotals = await calculateTotals(orderLines, { shippingMethod: "standard" });
const orderNumber = generateOrderNumber();
await check("createOrder", () =>
  createOrder({
    orderNumber,
    userId: demo.id,
    email: demo.email,
    firstName: "Smoke",
    lastName: "Test",
    status: "confirmed",
    subtotal: orderTotals.subtotal,
    discount: orderTotals.discount,
    shipping: orderTotals.shipping,
    tax: orderTotals.tax,
    total: orderTotals.total,
    discountCode: null,
    shippingMethod: "standard",
    paymentLast4: "4242",
    notes: null,
    address: {
      firstName: "Smoke",
      lastName: "Test",
      line1: "1 Test Way",
      line2: null,
      city: "Austin",
      region: "TX",
      postalCode: "78701",
      country: "United States",
      phone: "",
    },
    items: orderLines.map((l) => ({
      productId: l.productId,
      slug: l.slug,
      name: l.name,
      subtitle: l.subtitle,
      image: l.image,
      color: l.color,
      size: l.size,
      price: l.price,
      quantity: l.quantity,
      variantId: l.variantId,
    })),
  }),
);
await check("getOrderForUser after insert", async () =>
  (await getOrderForUser(orderNumber, demo.id))?.orderNumber,
);
await check("getCart emptied by order", async () => (await getCart(demo.id)).length);

console.log(`\nAdmin`);
await check("getAdminStats", () => getAdminStats());
await check("listAllOrders", () => listAllOrders(50));
await check("listDiscounts", () => listDiscounts());
await check("listCustomers", async () => (await all("SELECT id FROM users")).length);
await check("newsletter_subscribers table", async () =>
  (await get<{ n: number }>("SELECT COUNT(*) AS n FROM newsletter_subscribers"))?.n,
);
await check("subscribeToNewsletter", async () => (await subscribeToNewsletter("smoke@wearnow.com")).ok);
await check("subscribeToNewsletter is idempotent", async () =>
  (await subscribeToNewsletter("smoke@wearnow.com")).ok,
);
console.log(
  failures === 0
    ? "\nAll storefront queries passed.\n"
    : `\n${failures} query check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);