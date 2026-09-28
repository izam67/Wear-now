import { all, batch, get, run, scalar } from "../db";
import { hashPassword } from "../auth";
import { CATALOG, CATEGORIES, INSPIRATION } from "./catalog";
import { POOL } from "../images";
import { INSPIRATION_CATEGORIES, STORE } from "../constants";
import type { CatalogProduct } from "./catalog";

/* ------------------------------------------------------------------ *
 * Deterministic pseudo-randomness
 *
 * The seed must produce the same catalog, ratings and reviews on every run so
 * that a reset does not silently reshuffle the storefront. `mulberry32` with a
 * fixed seed gives us that reproducibility.
 * ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260101);
const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]!;
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

/** Stable 32-bit string hash, so image picks don't shift between runs. */
function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Picks `count` distinct image ids from a pool, offset deterministically by the
 * product slug. Products therefore get varied, on-category galleries that stay
 * identical across re-seeds.
 */
function galleryFor(product: CatalogProduct, count = 3): string[] {
  // Widened deliberately: `POOL` is `as const`, so an un-widened lookup would
  // give every tuple its own known length and make the guard below unreachable.
  const pool: readonly string[] = POOL[product.pool];
  if (pool.length === 0) return [];
  const start = hash(product.slug) % pool.length;
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    ids.push(pool[(start + i * 3) % pool.length]!);
  }
  return [...new Set(ids)];
}

function createdAt(daysAgo: number) {
  const d = new Date(Date.now() - daysAgo * 86_400_000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/* ------------------------------------------------------------------ *
 * Review copy
 * ------------------------------------------------------------------ */

const REVIEW_AUTHORS = [
  "Amara Okafor", "Juliette Moreau", "Priya Raman", "Sofia Lindqvist",
  "Naomi Bennett", "Ines Ferreira", "Hana Kim", "Clara Whitmore",
  "Yasmin Haddad", "Elena Rossi", "Maya Lindgren", "Zoe Ashworth",
  "Nadia Petrov", "Camille Dubois", "Rosa Delgado", "Theo Andersen",
  "Leila Nasser", "Freya Johansson", "Ana Sørensen", "Iris Kwan",
];

const REVIEW_LINES: Record<number, { title: string; body: string }[]> = {
  5: [
    { title: "Better in person", body: "The photos undersell it. The fabric has real weight and the finishing is neat everywhere — inside seams, hems, the lot. I've already worn it three times since it arrived." },
    { title: "Worth every penny", body: "I expected to be disappointed by the price. Then it arrived. This is the kind of piece that makes the rest of my wardrobe look considered." },
    { title: "Instant wardrobe upgrade", body: "Three people have asked where it's from. Fits true to size, the colour is accurate, and it arrived wrapped in tissue rather than a plastic bag." },
    { title: "My third one", body: "I've now bought this in two colours. The first is two years old and still looks new. That says everything." },
    { title: "Quietly excellent", body: "No logos, no noise, just good materials and clean cutting. Exactly what I wanted." },
  ],
  4: [
    { title: "Very good, one note", body: "Genuinely well made and the quality speaks for itself. I'd only note that it runs slightly long on me — I sized down and it's perfect." },
    { title: "Lovely, sizing runs small", body: "Beautiful construction and it looks expensive. I'm between sizes and chose the smaller one, which was right. Delivery took four days." },
    { title: "Really pleased", body: "Held up well through a full week of wear, including one rainy commute. Docking a star only because I wish it came in more colours." },
    { title: "Solid piece", body: "Does what it says. Not the most dramatic thing I've bought, but it's the one I reach for most often." },
  ],
  3: [
    { title: "Good, but not for me", body: "The quality is clearly there — the materials are excellent. The cut just doesn't suit my shape. Returns were painless, which counts for a lot." },
    { title: "Nice but oversized", body: "Beautiful quality, though it runs big. I sized down and it's still relaxed. Returning for a smaller size, which says nothing bad about the product." },
    { title: "Lovely piece, wrong colour", body: "No complaints on the make or the feel. I just prefer a cooler tone. The swap process took two days." },
  ],
};

const REVIEW_IMAGES = [
  "photo-1490481651871-ab68de25d43d",
  "photo-1515886657613-9f3515b0c78f",
  "photo-1509319117193-57bab727e09d",
  "photo-1547949003-9792a18a2601",
  "photo-1524504388940-b1c1722653e1",
];

/* ------------------------------------------------------------------ *
 * Orders for the demo account
 * ------------------------------------------------------------------ */

const CARRIERS = [
  { name: "DHL Express", prefix: "DHLE" },
  { name: "FedEx", prefix: "FDX" },
  { name: "UPS", prefix: "UPS" },
];

/* ------------------------------------------------------------------ *
 * Seed
 * ------------------------------------------------------------------ */

export interface SeedResult {
  categories: number;
  products: number;
  variants: number;
  reviews: number;
  users: number;
  orders: number;
  inspiration: number;
  discounts: number;
}

/** Empties every content table, leaving the schema in place. */
async function truncateAll(): Promise<void> {
  const tables = [
    "order_items", "orders", "cart_items", "wishlist_items", "reviews",
    "variants", "products", "categories", "inspiration_posts",
    "discounts", "newsletter_subscribers", "addresses", "users",
  ];
  await batch([
    ...tables.map((table) => ({ sql: `DELETE FROM ${table}` })),
    { sql: "DELETE FROM sqlite_sequence" },
  ]);
}

export async function isSeeded(): Promise<boolean> {
  return ((await scalar<number>("SELECT COUNT(*) FROM products")) ?? 0) > 0;
}

/**
 * Populates an empty database. Safe to call on every boot — it no-ops when
 * products already exist unless `force` is set.
 */
export async function seed(force = false): Promise<SeedResult> {
  if (!force && (await isSeeded())) {
    return { categories: 0, products: 0, variants: 0, reviews: 0, users: 0, orders: 0, inspiration: 0, discounts: 0 };
  }

  // Sequential rather than one big batch: this writes a few thousand rows, and
  // a single batch that large risks hitting a request-size limit against a
  // remote database. Each await is one round trip, which is fine for a one-time
  // setup step.
  {
    if (force) await truncateAll();

    const result: SeedResult = {
      categories: 0, products: 0, variants: 0, reviews: 0,
      users: 0, orders: 0, inspiration: 0, discounts: 0,
    };

    /* ---- Categories ---- */
    for (const [i, c] of CATEGORIES.entries()) {
      await run(
        `INSERT INTO categories (slug, name, tagline, description, image, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        c.slug, c.name, c.tagline, c.description, c.image, i + 1,
      );
      result.categories += 1;
    }

    /* ---- Products + variants ---- */
    for (const product of CATALOG) {
      const images = galleryFor(product, 3);
      await run(
        `INSERT INTO products
          (slug, name, subtitle, description, category_slug, gender, price, compare_at,
           images, colors, sizes, materials, care, details, tags,
           is_new, is_featured, is_best_seller, status, popularity, created_at, rating, review_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, 0, 0)`,
        product.slug, product.name, product.subtitle, product.description,
        product.category, product.gender, product.price, product.compareAt,
        JSON.stringify(images),
        JSON.stringify(product.colors),
        JSON.stringify(product.sizes),
        product.materials, product.care,
        JSON.stringify(product.details),
        JSON.stringify(product.tags),
        product.isNew ? 1 : 0,
        product.isFeatured ? 1 : 0,
        product.isBestSeller ? 1 : 0,
        product.popularity,
        createdAt(product.daysAgo),
      );
      result.products += 1;

      const productId = (await get<{ id: number }>("SELECT id FROM products WHERE slug = ?", product.slug))!.id;

      // SKU is derived from the product id, not the slug — slug prefixes are
      // not unique once punctuation is stripped, which silently collided.
      const code = `MA${String(productId).padStart(4, "0")}`;
      for (const [colorIndex, color] of product.colors.entries()) {
        for (const size of product.sizes) {
          // Guard against a shoe scale (36–43) attached to a jewellery item.
          // Ring sizes are also numeric but sit above 45, so the band matters.
          if (product.category === "jewelry" && /^\d{2}$/.test(size)) {
            const n = Number(size);
            if (n >= 35 && n <= 45) continue;
          }
          const stock = rand() < 0.08 ? 0 : between(1, 40);
          await run(
            "INSERT INTO variants (product_id, sku, color, size, stock) VALUES (?, ?, ?, ?, ?)",
            productId,
            `${code}-${String(colorIndex + 1).padStart(2, "0")}-${size}`,
            color.name,
            size,
            stock,
          );
          result.variants += 1;
        }
      }
    }

    /* ---- Reviews + recalculated ratings ---- */
    for (const product of CATALOG) {
      const productId = (await get<{ id: number }>("SELECT id FROM products WHERE slug = ?", product.slug))!.id;
      // A higher-popularity product has been around longer and has more reviews.
      const count = product.isBestSeller ? between(6, 11) : between(2, 6);

      for (let i = 0; i < count; i += 1) {
        const roll = rand();
        const rating = roll < 0.68 ? 5 : roll < 0.9 ? 4 : 3;
        const lines = REVIEW_LINES[rating]!;
        const line = pick(lines);
        const hasImage = rating === 5 && rand() < 0.28;

        await run(
          `INSERT INTO reviews (product_id, user_id, author_name, rating, title, body, image, verified, status, created_at)
           VALUES (?, NULL, ?, ?, ?, ?, ?, 1, 'approved', ?)`,
          productId,
          pick(REVIEW_AUTHORS),
          rating,
          line.title,
          line.body,
          hasImage ? pick(REVIEW_IMAGES) : null,
          createdAt(product.daysAgo + between(1, 60)),
        );
        result.reviews += 1;
      }

      await run(
        `UPDATE products SET
           rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ? AND status = 'approved'), 0),
           review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ? AND status = 'approved')
         WHERE id = ?`,
        productId, productId, productId,
      );
    }

    /* ---- A few unapproved reviews for the admin queue ---- */
    for (let i = 0; i < 4; i += 1) {
      const product = pick(CATALOG);
      const productId = (await get<{ id: number }>("SELECT id FROM products WHERE slug = ?", product.slug))!.id;
      await run(
        `INSERT INTO reviews (product_id, user_id, author_name, rating, title, body, image, verified, status, created_at)
         VALUES (?, NULL, ?, 5, ?, ?, NULL, 0, 'pending', ?)`,
        productId,
        pick(REVIEW_AUTHORS),
        pick(["Worth writing home about", "Exactly as described", "Would buy again", "Beautiful piece"]),
        pick([
          "Arrived quickly and packed beautifully. Very happy with the quality.",
          "The colour is spot on and the fit is flattering. Thank you.",
          "Excellent finish — you can tell it was made properly.",
        ]),
        createdAt(between(1, 8)),
      );
      result.reviews += 1;
    }

    /* ---- Users ---- */
    const users = [
      { email: "owner@wearnow.com", first: "Alex", last: "Renaud", role: "admin", password: "wearnow2026" },
      { email: "demo@wearnow.com", first: "Jordan", last: "Blake", role: "customer", password: "demo1234" },
      { email: "imogen.hart@example.com", first: "Imogen", last: "Hart", role: "customer", password: "demo1234" },
      { email: "desmond.ade@example.com", first: "Desmond", last: "Ade", role: "customer", password: "demo1234" },
    ] as const;

    const userIds: number[] = [];
    for (const u of users) {
      const { lastInsertRowid } = await run(
        `INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)`,
        u.email, hashPassword(u.password), u.first, u.last, u.role,
      );
      userIds.push(lastInsertRowid);
      result.users += 1;
    }

    // Seeded customer data for the account pages.
    const addresses = [
      { label: "Home", line1: "48 Mercer Street", line2: "Apt 4B", city: "New York", region: "NY", postal: "10013", phone: "+1 212 555 0184", isDefault: 1 },
      { label: "Studio", line1: "1120 Abbot Kinney Blvd", line2: null, city: "Venice", region: "CA", postal: "90291", phone: "+1 310 555 0119", isDefault: 0 },
    ];
    for (const a of addresses) {
      await run(
        `INSERT INTO addresses (user_id, label, first_name, last_name, line1, line2, city, region, postal_code, country, phone, is_default)
         VALUES (?, ?, 'Jordan', 'Blake', ?, ?, ?, ?, ?, 'United States', ?, ?)`,
        userIds[1], a.label, a.line1, a.line2, a.city, a.region, a.postal, a.phone, a.isDefault,
      );
    }

    /* ---- Historical orders for the demo customer ---- */
    const demoId = userIds[1]!;
    const productRows = await all<{
      id: number;
      slug: string;
      name: string;
      subtitle: string;
      images: string;
      price: number;
    }>("SELECT id, slug, name, subtitle, images, price FROM products WHERE status = 'active'");

    const statuses = ["delivered", "delivered", "shipped", "processing", "delivered"] as const;

    for (const [index, status] of statuses.entries()) {
      const lineCount = between(1, 3);
      const lines: { productId: number; slug: string; name: string; subtitle: string; image: string; price: number; quantity: number }[] = [];
      for (let i = 0; i < lineCount; i += 1) {
        const p = pick(productRows);
        if (lines.some((l) => l.productId === p.id)) continue;
        lines.push({
          productId: p.id,
          slug: p.slug,
          name: p.name,
          subtitle: p.subtitle,
          image: (JSON.parse(p.images) as string[])[0] ?? "",
          price: p.price,
          quantity: between(1, 2),
        });
      }
      if (lines.length === 0) continue;

      const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
      const shipping = subtotal >= STORE.freeShippingThreshold ? 0 : 1200;
      const tax = Math.round(subtotal * STORE.taxRate);
      const total = subtotal + shipping + tax;
      const created = createdAt(between(3, 90));
      const orderNumber = `MA-${(900000 + index * 7919).toString(36).toUpperCase()}${rand().toString(36).slice(2, 5).toUpperCase()}`;
      const address = addresses[0]!;
      const carrier = pick(CARRIERS);

      const { lastInsertRowid: orderId } = await run(
        `INSERT INTO orders
          (order_number, user_id, email, first_name, last_name, status, subtotal, discount, shipping, tax, total,
           shipping_method, payment_last4, carrier, tracking_number, address_json, created_at, updated_at)
         VALUES (?, ?, ?, 'Jordan', 'Blake', ?, ?, 0, ?, ?, ?, 'standard', '4242', ?, ?, ?, ?, ?)`,
        orderNumber, demoId, "demo@wearnow.com", status, subtotal, shipping, tax, total,
        status === "processing" ? null : carrier.name,
        status === "processing" ? null : `${carrier.prefix}${between(100000000, 999999999)}`,
        JSON.stringify({
          firstName: "Jordan", lastName: "Blake",
          line1: address.line1, line2: address.line2, city: address.city,
          region: address.region, postalCode: address.postal,
          country: "United States", phone: address.phone,
        }),
        created, created,
      );

      for (const line of lines) {
        await run(
          `INSERT INTO order_items (order_id, product_id, product_slug, name, subtitle, image, color, size, price, quantity)
           VALUES (?, ?, ?, ?, ?, ?, 'Default', 'M', ?, ?)`,
          orderId, line.productId, line.slug, line.name, line.subtitle, line.image, line.price, line.quantity,
        );
      }
      result.orders += 1;
    }

    // Wishlist seed for the demo account.
    for (const row of productRows.filter(() => rand() < 0.12).slice(0, 4)) {
      await run(
        "INSERT OR IGNORE INTO wishlist_items (user_id, product_id, created_at) VALUES (?, ?, ?)",
        demoId, row.id, createdAt(between(1, 20)),
      );
    }

    /* ---- Discounts ---- */
    const discounts = [
      { code: "WELCOME10", description: "10% off your first order", type: "percent", value: 10, min: 5000, max: 5000, days: 365 },
      { code: "ATELIER20", description: "20% off orders over $300", type: "percent", value: 20, min: 30000, max: 15000, days: 90 },
    { code: "WEARNOW10", description: "10% off orders over $150", type: "percent", value: 10, min: 15000, max: 8000, days: 365 },
      { code: "FREESHIP", description: "Free express shipping, any order", type: "free_shipping", value: 0, min: 0, max: null, days: 180 },
      { code: "TAKE25", description: "$25 off orders over $200", type: "fixed", value: 2500, min: 20000, max: null, days: 60 },
    ] as const;

    for (const d of discounts) {
      const expires = new Date(Date.now() + d.days * 86_400_000).toISOString().slice(0, 19).replace("T", " ");
      await run(
        `INSERT INTO discounts (code, description, type, value, min_subtotal, max_discount, active, starts_at, ends_at, usage_limit)
         VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), ?, 500)`,
        d.code, d.description, d.type, d.value, d.min, d.max, expires,
      );
      result.discounts += 1;
    }

    /* ---- Inspiration board ---- */
    for (const [i, post] of INSPIRATION.entries()) {
      const pool = POOL[post.pool];
      const start = hash(post.slug) % pool.length;
      const image = pool[(start + 2) % pool.length]!;
      await run(
        `INSERT INTO inspiration_posts (slug, title, category, image, aspect, product_slugs, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        post.slug, post.title, post.category, image, post.aspect,
        JSON.stringify(post.productSlugs), i + 1,
      );
      result.inspiration += 1;
    }

    /* ---- Newsletter ---- */
    for (const email of ["imogen.hart@example.com", "desmond.ade@example.com"]) {
      await run("INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)", email);
    }

    return result;
  }
}

/** Validates that the seeded content is internally consistent. */
export async function verifySeed(): Promise<string[]> {
  const problems: string[] = [];

  const productCount = (await scalar<number>("SELECT COUNT(*) FROM products")) ?? 0;
  if (productCount === 0) problems.push("No products were seeded.");

  // Every inspiration tile must point at products that exist, otherwise the
  // tile's "shop the look" grid renders empty.
  const slugs = new Set(
    (await all<{ slug: string }>("SELECT slug FROM products")).map((r) => r.slug),
  );
  for (const row of await all<{ slug: string; product_slugs: string }>(
    "SELECT slug, product_slugs FROM inspiration_posts",
  )) {
    const refs = JSON.parse(row.product_slugs) as string[];
    for (const ref of refs) {
      if (!slugs.has(ref)) problems.push(`Inspiration "${row.slug}" references missing product "${ref}".`);
    }
  }

  // Every product needs at least one variant or it can never be bought.
  for (const row of await all<{ slug: string }>(
    "SELECT p.slug, COUNT(v.id) AS n FROM products p LEFT JOIN variants v ON v.product_id = p.id GROUP BY p.id HAVING n = 0",
  )) {
    problems.push(`Product "${row.slug}" has no variants.`);
  }

  // Denormalised ratings must match the reviews table.
  for (const row of await all<{
    slug: string;
    rating: number;
    review_count: number;
    expected: number;
  }>(
    `SELECT p.slug, p.rating, p.review_count,
              (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status = 'approved') AS expected
       FROM products p`,
  )) {
    if (row.review_count !== row.expected) {
      problems.push(`Product "${row.slug}" review_count ${row.review_count} != ${row.expected}.`);
    }
  }

  const missingImages = (
    await all<{ slug: string }>("SELECT slug FROM products WHERE images = '[]' OR images = ''")
  ).map((r) => r.slug);
  for (const slug of missingImages) problems.push(`Product "${slug}" has no images.`);

  return problems;
}

export { INSPIRATION_CATEGORIES };
