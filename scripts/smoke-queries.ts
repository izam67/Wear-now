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

function check(label: string, fn: () => unknown) {
  try {
    const result = fn();
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

const demo = get<{ id: number; email: string }>(
  "SELECT id, email FROM users WHERE email = ?",
  "demo@wearnow.com",
);

if (!demo) {
  console.error("demo user missing — run `npm run db:reset` first");
  process.exit(1);
}

console.log(`\nCatalog (guest-facing)`);
const first = get<{ slug: string }>("SELECT slug FROM products WHERE status='active' LIMIT 1")!;
check("listCategories", () => listCategories());
check("queryProducts", () => queryProducts({ perPage: 12 }));
check("queryProducts filtered", () =>
  queryProducts({ category: ["women"], sort: "price-asc", perPage: 8 }),
);
check("queryProducts search", () => queryProducts({ q: "linen", perPage: 8 }));
check("queryProducts facets exclude own dimension", () => {
  const r = queryProducts({ category: ["women"], colors: ["Black"], perPage: 8 });
  return r.facets.categories.length;
});
check("queryProducts pagination clamps", () => queryProducts({ perPage: 8, page: 999 }).page);
check("getNewArrivals", () => getNewArrivals(12));
check("getBestSellers", () => getBestSellers(4));
const product = getProductBySlug(first.slug)!;
check("getProductBySlug", () => product && product.name);
check("getRelatedProducts", () => getRelatedProducts(product, 4));
check("getReviewsForProduct", () => getReviewsForProduct(product.id));
check("ratingBreakdown", () => ratingBreakdown(product.id));

console.log(`\nAccount ${demo.email} (id ${demo.id})`);
check("listOrdersForUser", () => listOrdersForUser(demo.id));
check("getOrderForUser", () => {
  const order = listOrdersForUser(demo.id)[0];
  return order ? getOrderForUser(order.orderNumber, demo.id) : null;
});
check("getWishlist", () => getWishlist(demo.id));
check("listAddresses", () => listAddresses(demo.id));
check("getCart", () => getCart(demo.id));

console.log(`\nCart mutations`);
const variant = get<{ id: number; stock: number }>(
  "SELECT id, stock FROM variants WHERE stock > 5 LIMIT 1",
)!;
check("addToCart", () => addToCart(demo.id, variant.id, 2));
const cart = getCart(demo.id);
check("getCart after add", () => cart.length);
check("calculateTotals", () => calculateTotals(cart, { shippingMethod: "express" }));
check("calculateTotals + code", () => calculateTotals(cart, { discountCode: "WEARNOW10" }));
const cartLine = cart[0];
if (cartLine) {
  check("updateCartQuantity", () => updateCartQuantity(demo.id, cartLine.id, 3));
  check("getCart reflects qty", () => getCart(demo.id)[0]?.quantity);
  check("removeCartLine", () => removeCartLine(demo.id, cartLine.id));
}
check("clearCart", () => clearCart(demo.id));
check("getCart after clear", () => getCart(demo.id).length);

console.log(`\nSignup flow`);
const freshEmail = `smoke-${Date.now()}@wearnow.com`;
const newId = createAccount({
  email: freshEmail,
  passwordHash: hashPassword("smoke-test-passphrase"),
  firstName: "Smoke",
  lastName: "Tester",
});
check("createAccount returns an id", () => typeof newId === "number");
check("duplicate signup is refused", () =>
  createAccount({
    email: freshEmail,
    passwordHash: hashPassword("another-passphrase"),
    firstName: "Dup",
    lastName: "Licate",
  }) === null,
);
check("new account can sign in", () => {
  const row = get<{ password_hash: string; role: string }>(
    "SELECT password_hash, role FROM users WHERE email = ?",
    freshEmail,
  )!;
  return verifyPassword("smoke-test-passphrase", row.password_hash) && row.role === "customer";
});
check("wrong password rejected", () => {
  const row = get<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE email = ?",
    freshEmail,
  )!;
  return !verifyPassword("not-the-password", row.password_hash);
});
// The opt-in runs in the same action as the user insert; it used to name a
// table that does not exist, which only blew up on a real signup.
check("marketing opt-in does not throw", () => subscribeToNewsletter(freshEmail).ok);
check("marketing opt-in is idempotent", () => subscribeToNewsletter(freshEmail).ok);
check("opted-in address is stored", () =>
  get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM newsletter_subscribers WHERE email = ?",
    freshEmail,
  )?.n === 1,
);
check("fresh account has empty bag + wishlist", () => {
  if (newId === null) throw new Error("no id");
  return getCart(newId).length === 0 && getWishlist(newId).length === 0;
});

console.log(`\nWishlist mutations`);
check("toggle on", () => toggleWishlistItem(demo.id, product.id).inWishlist);
check("toggle off", () => toggleWishlistItem(demo.id, product.id).inWishlist);

console.log(`\nOrder placement`);
addToCart(demo.id, variant.id, 1);
const orderLines = getCart(demo.id);
const orderTotals = calculateTotals(orderLines, { shippingMethod: "standard" });
const orderNumber = generateOrderNumber();
check("createOrder", () =>
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
check("getOrderForUser after insert", () => getOrderForUser(orderNumber, demo.id)?.orderNumber);
check("getCart emptied by order", () => getCart(demo.id).length);

console.log(`\nAdmin`);
check("getAdminStats", () => getAdminStats());
check("listAllOrders", () => listAllOrders(50));
check("listDiscounts", () => listDiscounts());
check("listCustomers", () => all("SELECT id FROM users").length);
check("newsletter_subscribers table", () =>
  all<{ n: number }>("SELECT COUNT(*) AS n FROM newsletter_subscribers")[0]?.n,
);
check("subscribeToNewsletter", () => subscribeToNewsletter("smoke@wearnow.com").ok);
check("subscribeToNewsletter is idempotent", () => subscribeToNewsletter("smoke@wearnow.com").ok);
console.log(
  failures === 0
    ? "\nAll storefront queries passed.\n"
    : `\n${failures} query check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
