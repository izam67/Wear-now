import { all, batch, get, parseJson, scalar, run } from "./db";
import type {
  Address,
  Category,
  Discount,
  InspirationPost,
  Order,
  OrderItem,
  Paginated,
  Product,
  ProductColor,
  ProductQuery,
  Review,
  SortKey,
  Variant,
} from "./types";
import { PRODUCTS_PER_PAGE, shippingFor, STORE } from "./constants";
import { normalize, formatMoney } from "./utils";

/* ------------------------------------------------------------------ *
 * Row → domain mapping
 * ------------------------------------------------------------------ */

interface ProductRow {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  category_slug: string;
  category_name?: string;
  gender: Product["gender"];
  price: number;
  compare_at: number | null;
  rating: number;
  review_count: number;
  images: string;
  colors: string;
  sizes: string;
  materials: string;
  care: string;
  details: string;
  tags: string;
  is_new: number;
  is_featured: number;
  is_best_seller: number;
  status: Product["status"];
  popularity: number;
  created_at: string;
  stock?: number;
  dv_id: number | null;
  dv_color: string | null;
  dv_size: string | null;
  dv_any_id: number | null;
  dv_any_color: string | null;
  dv_any_size: string | null;
}

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    categorySlug: row.category_slug,
    categoryName: row.category_name ?? row.category_slug,
    gender: row.gender,
    price: row.price,
    compareAt: row.compare_at,
    rating: row.rating,
    reviewCount: row.review_count,
    images: parseJson<string[]>(row.images, []),
    colors: parseJson<ProductColor[]>(row.colors, []),
    sizes: parseJson<string[]>(row.sizes, []),
    materials: row.materials,
    care: row.care,
    details: parseJson<string[]>(row.details, []),
    tags: parseJson<string[]>(row.tags, []),
    isNew: row.is_new === 1,
    isFeatured: row.is_featured === 1,
    isBestSeller: row.is_best_seller === 1,
    status: row.status,
    popularity: row.popularity,
    createdAt: row.created_at,
    stock: row.stock ?? 0,
    // Prefer an in-stock variant for quick-add; fall back to the first variant
    // so an out-of-stock product still knows which option it was sold out in.
    defaultVariant:
      row.dv_id !== null
        ? { id: row.dv_id, color: row.dv_color ?? "", size: row.dv_size ?? "" }
        : row.dv_any_id !== null
          ? { id: row.dv_any_id, color: row.dv_any_color ?? "", size: row.dv_any_size ?? "" }
          : null,
  };
}

const PRODUCT_SELECT = /* sql */ `
  SELECT p.*, c.name AS category_name,
         (SELECT COALESCE(SUM(v.stock), 0) FROM variants v WHERE v.product_id = p.id) AS stock,
         (SELECT v.id       FROM variants v WHERE v.product_id = p.id AND v.stock > 0 ORDER BY v.id LIMIT 1) AS dv_id,
         (SELECT v.color   FROM variants v WHERE v.product_id = p.id AND v.stock > 0 ORDER BY v.id LIMIT 1) AS dv_color,
         (SELECT v.size    FROM variants v WHERE v.product_id = p.id AND v.stock > 0 ORDER BY v.id LIMIT 1) AS dv_size,
         (SELECT v.id       FROM variants v WHERE v.product_id = p.id ORDER BY v.id LIMIT 1) AS dv_any_id,
         (SELECT v.color   FROM variants v WHERE v.product_id = p.id ORDER BY v.id LIMIT 1) AS dv_any_color,
         (SELECT v.size    FROM variants v WHERE v.product_id = p.id ORDER BY v.id LIMIT 1) AS dv_any_size
  FROM products p
  LEFT JOIN categories c ON c.slug = p.category_slug
`;

/* ------------------------------------------------------------------ *
 * Reading products
 * ------------------------------------------------------------------ */

const SORTS: Record<SortKey, string> = {
  newest: "p.created_at DESC, p.id DESC",
  "price-asc": "p.price ASC",
  "price-desc": "p.price DESC",
  popular: "p.popularity DESC, p.rating DESC",
  rating: "p.rating DESC, p.review_count DESC",
  name: "p.name ASC",
};

export interface ProductFilterResult {
  products: Product[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  facets: {
    categories: { value: string; label: string; count: number }[];
    sizes: { value: string; count: number }[];
    colors: { value: string; label: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}

/**
 * Filter assembly
 *
 * Clauses are kept as `{ sql, params }` objects rather than a pair of parallel
 * arrays. That matters because facet counts need the *same* filter set minus
 * one dimension — with paired arrays you end up hand-counting bind parameters
 * per facet, which is exactly the kind of bookkeeping that silently drifts.
 */

type Clause = { sql: string; params?: unknown[]; /** dimension this clause belongs to */ facet?: string };

const inList = (values: string[], column: string): Clause => {
  // The facets are read from query strings, so a caller can easily hand over a
  // bare string where an array is expected. Fail with the column name rather
  // than letting `.map` fail somewhere further down.
  if (!Array.isArray(values)) {
    throw new TypeError(`Filter for ${column} must be an array of values.`);
  }
  return {
    sql: `${column} IN (${values.map(() => "?").join(",")})`,
    params: values,
  };
};

function buildClauses(query: ProductQuery):Clause[] {
  const {
    q,
    category = [],
    gender = [],
    sizes = [],
    colors = [],
    minPrice,
    maxPrice,
    onSale,
    isNew,
    ids,
    excludeIds = [],
    inStockOnly,
  } = query;

  const clauses: Clause[] = [{ sql: "p.status = 'active'" }];

  if (q?.trim()) {
    // Every whitespace-separated term must match somewhere in the record, so
    // "linen dress" narrows rather than widens the result set.
    for (const term of normalize(q).split(" ").filter(Boolean).slice(0, 6)) {
      const like = `%${term}%`;
      clauses.push({
        sql: `(LOWER(p.name) LIKE ? OR LOWER(p.subtitle) LIKE ? OR LOWER(p.description) LIKE ?
               OR LOWER(p.category_slug) LIKE ? OR LOWER(p.tags) LIKE ?
               OR LOWER(c.name) LIKE ? OR LOWER(p.materials) LIKE ?)`,
        params: [like, like, like, like, like, like, like],
      });
    }
  }

  if (category.length) clauses.push({ ...inList(category, "p.category_slug"), facet: "category" });
  if (gender.length) clauses.push(inList(gender, "p.gender"));
  if (ids?.length) clauses.push(inList(ids.map(String), "p.id"));
  if (excludeIds.length) {
    clauses.push({
      sql: `p.id NOT IN (${excludeIds.map(() => "?").join(",")})`,
      params: excludeIds,
    });
  }
  if (typeof minPrice === "number") clauses.push({ sql: "p.price >= ?", params: [minPrice] });
  if (typeof maxPrice === "number") clauses.push({ sql: "p.price <= ?", params: [maxPrice] });
  if (onSale) clauses.push({ sql: "p.compare_at IS NOT NULL AND p.compare_at > p.price" });
  if (isNew) clauses.push({ sql: "p.is_new = 1" });

  // Sizes and colours are JSON columns. Matching on the quoted token keeps
  // "M" from also matching "Medium" or a size embedded in another word.
  if (sizes.length) {
    clauses.push({
      sql: `(${sizes.map(() => "LOWER(p.sizes) LIKE ?").join(" OR ")})`,
      params: sizes.map((s) => `%"${s.toLowerCase()}"%`),
      facet: "sizes",
    });
  }
  if (colors.length) {
    clauses.push({
      sql: `(${colors.map(() => "LOWER(p.colors) LIKE ?").join(" OR ")})`,
      params: colors.map((c) => `%"name":"${c.toLowerCase()}"%`),
      facet: "colors",
    });
  }
  if (inStockOnly) {
    clauses.push({
      sql: "(SELECT COALESCE(SUM(v.stock), 0) FROM variants v WHERE v.product_id = p.id) > 0",
    });
  }

  return clauses;
}

const toSql = (clauses: Clause[]) => clauses.map((c) => c.sql).join(" AND ");
/**
 * `params` is optional on a Clause. `flatMap` would append a literal
 * `undefined` for clauses that carry no bind values, which SQLite rejects as an
 * out-of-range column index — so the fallback is required, not cosmetic.
 */
const toParams = (clauses: Clause[]) => clauses.flatMap((c) => c.params ?? []);

/** Drops clauses for one facet dimension so counts stay meaningful. */
const withoutFacet = (clauses: Clause[], facet: string) =>
  clauses.filter((c) => c.facet !== facet);

/** Applies every filter/sort/pagination concern to a product query. */
export async function queryProducts(query: ProductQuery = {}):Promise<ProductFilterResult> {
  const { sort = "newest", page = 1, perPage = PRODUCTS_PER_PAGE } = query;
  const clauses = buildClauses(query);

  const JOIN = "FROM products p LEFT JOIN categories c ON c.slug = p.category_slug";

  /* ---- Facet counts: each excludes its own dimension ---- */
  const categoryClauses = withoutFacet(clauses, "category");
  const categoryFacets = await all<{ value: string; label: string; count: number }>(
    `SELECT p.category_slug AS value, COALESCE(c.name, p.category_slug) AS label, COUNT(*) AS count
     ${JOIN}
     WHERE ${toSql(categoryClauses)}
     GROUP BY p.category_slug
     ORDER BY count DESC`,
    ...toParams(categoryClauses),
  );

  const sizeClauses = withoutFacet(clauses, "sizes");
  const sizeFacets = await all<{ value: string; count: number }>(
    `SELECT j.value AS value, COUNT(*) AS count
     ${JOIN}, json_each(p.sizes) j
     WHERE ${toSql(sizeClauses)}
     GROUP BY j.value
     ORDER BY j.value`,
    ...toParams(sizeClauses),
  );

  const colorClauses = withoutFacet(clauses, "colors");
  const colorFacets = await all<{ value: string; label: string; count: number }>(
    `SELECT json_extract(j.value, '$.name') AS value,
            json_extract(j.value, '$.name') AS label,
            COUNT(*) AS count
     ${JOIN}, json_each(p.colors) j
     WHERE ${toSql(colorClauses)}
     GROUP BY value
     ORDER BY count DESC`,
    ...toParams(colorClauses),
  );

  const priceRow = await get<{ min: number; max: number }>(
    "SELECT COALESCE(MIN(price), 0) AS min, COALESCE(MAX(price), 0) AS max FROM products WHERE status = 'active'",
  );

  /* ---- Result page ---- */
  const whereSql = toSql(clauses);
  const params = toParams(clauses);

  const total = await scalar<number>(`SELECT COUNT(*) ${JOIN} WHERE ${whereSql}`, ...params) ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const offset = (currentPage - 1) * perPage;

  const rows = await all<ProductRow>(
    `${PRODUCT_SELECT} WHERE ${whereSql} ORDER BY ${SORTS[sort] ?? SORTS.newest} LIMIT ? OFFSET ?`,
    ...params,
    perPage,
    offset,
  );

  return {
    products: rows.map(toProduct),
    total,
    page: currentPage,
    perPage,
    pageCount,
    facets: {
      categories: categoryFacets,
      sizes: sizeFacets,
      colors: colorFacets,
      priceRange: { min: priceRow?.min ?? 0, max: priceRow?.max ?? 100000 },
    },
  };
}

/* ------------------------------------------------------------------ *
 * Convenience queries used across the storefront
 * ------------------------------------------------------------------ */

export async function getProductBySlug(slug: string):Promise<Product | null> {
  const row = await get<ProductRow>(`${PRODUCT_SELECT} WHERE p.slug = ?`, slug);
  return row ? toProduct(row) : null;
}

export async function getProductById(id: number):Promise<Product | null> {
  const row = await get<ProductRow>(`${PRODUCT_SELECT} WHERE p.id = ?`, id);
  return row ? toProduct(row) : null;
}

export async function getRelatedProducts(product: Product, limit = 4):Promise<Product[]> {
  // Same category first, then any other piece sharing a tag — a simple
  // relevance pass that avoids a vector store while still feeling curated.
  const { products } = await queryProducts({
    excludeIds: [product.id],
    perPage: limit * 3,
    sort: "popular",
  });
  const tagSet = new Set(product.tags);
  return products
    .map((p) => ({
      p,
      score:
        (p.categorySlug === product.categorySlug ? 10 : 0) +
        p.tags.filter((t) => tagSet.has(t)).length * 2 +
        (p.gender === product.gender ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.p.popularity - a.p.popularity)
    .slice(0, limit)
    .map((x) => x.p);
}

/** "Complete the look" — cross-category pieces that finish an outfit. */
export async function getCompleteTheLook(product: Product, limit = 4):Promise<Product[]> {
  const otherCategories = ["women", "men", "shoes", "jewelry", "bags", "accessories"].filter(
    (c) => c !== product.categorySlug,
  );
  const { products } = await queryProducts({
    category: otherCategories,
    excludeIds: [product.id],
    perPage: 40,
    sort: "popular",
  });
  const priority: Record<string, number> = {
    shoes: 3,
    bags: 3,
    jewelry: 2,
    accessories: 2,
    women: 1,
    men: 1,
  };
  return products
    .sort((a, b) => (priority[b.categorySlug] ?? 0) - (priority[a.categorySlug] ?? 0) || b.popularity - a.popularity)
    .slice(0, limit);
}

export async function getNewArrivals(limit = 12):Promise<Product[]> {
  return (await queryProducts({ isNew: true, perPage: limit, sort: "newest" })).products;
}

export async function getTrending(limit = 8):Promise<Product[]> {
  return (await queryProducts({ perPage: limit, sort: "popular" })).products;
}

export async function getBestSellers(limit = 4):Promise<Product[]> {
  const { products } = await queryProducts({ perPage: limit, sort: "popular" });
  const best = products.filter((p) => p.isBestSeller);
  return (best.length >= limit ? best : [...best, ...products.filter((p) => !p.isBestSeller)]).slice(
    0,
    limit,
  );
}

export async function getOnSale(limit = 8):Promise<Product[]> {
  return (await queryProducts({ onSale: true, perPage: limit, sort: "popular" })).products;
}

export async function getFeatured(limit = 6):Promise<Product[]> {
  return (await queryProducts({ perPage: 24, sort: "popular" })).products
    .filter((p) => p.isFeatured)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ *
 * Variants
 * ------------------------------------------------------------------ */

export async function getVariants(productId: number):Promise<Variant[]> {
  return (await all<Variant>(
    "SELECT id, product_id AS productId, sku, color, size, stock FROM variants WHERE product_id = ? ORDER BY color, size",
    productId,
  )).map((v) => ({ ...v }));
}

export async function getVariant(id: number):Promise<Variant | null> {
  const row = await get<{ id: number; product_id: number; sku: string; color: string; size: string; stock: number }>(
    "SELECT id, product_id, sku, color, size, stock FROM variants WHERE id = ?",
    id,
  );
  return row ? { id: row.id, productId: row.product_id, sku: row.sku, color: row.color, size: row.size, stock: row.stock } : null;
}

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */

export async function listCategories():Promise<Category[]> {
  return (await all<{ id: number; slug: string; name: string; tagline: string; description: string; image: string; sort_order: number }>(
    "SELECT id, slug, name, tagline, description, image, sort_order FROM categories ORDER BY sort_order, id",
  )).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    image: r.image,
    sortOrder: r.sort_order,
  }));
}

export async function getCategory(slug: string):Promise<Category | null> {
  const r = await get<{ id: number; slug: string; name: string; tagline: string; description: string; image: string; sort_order: number }>(
    "SELECT id, slug, name, tagline, description, image, sort_order FROM categories WHERE slug = ?",
    slug,
  );
  return r
    ? { id: r.id, slug: r.slug, name: r.name, tagline: r.tagline, description: r.description, image: r.image, sortOrder: r.sort_order }
    : null;
}

/* ------------------------------------------------------------------ *
 * Reviews
 * ------------------------------------------------------------------ */

interface ReviewRow {
  id: number;
  product_id: number;
  product_slug: string;
  product_name: string;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  image: string | null;
  verified: number;
  status: Review["status"];
  created_at: string;
}

function toReview(r: ReviewRow):Review {
  return {
    id: r.id,
    productId: r.product_id,
    productSlug: r.product_slug,
    productName: r.product_name,
    authorName: r.author_name,
    rating: r.rating,
    title: r.title,
    body: r.body,
    image: r.image,
    verified: r.verified === 1,
    status: r.status,
    createdAt: r.created_at,
  };
}

export async function getReviewsForProduct(productId: number, includeUnapproved = false):Promise<Review[]> {
  const where = includeUnapproved
    ? "WHERE r.product_id = ?"
    : "WHERE r.product_id = ? AND r.status = 'approved'";
  return (await all<ReviewRow>(
    `SELECT r.*, p.slug AS product_slug, p.name AS product_name
     FROM reviews r JOIN products p ON p.id = r.product_id
     ${where} ORDER BY r.created_at DESC`,
    productId,
  )).map(toReview);
}

export async function getHomepageReviews(limit = 6):Promise<Review[]> {
  return (await all<ReviewRow>(
    `SELECT r.*, p.slug AS product_slug, p.name AS product_name
     FROM reviews r JOIN products p ON p.id = r.product_id
     WHERE r.status = 'approved' AND r.rating >= 4
     ORDER BY r.rating DESC, r.created_at DESC LIMIT ?`,
    limit,
  )).map(toReview);
}

/** Every approved review, newest first, for the /reviews archive page. */
export async function listApprovedReviews(limit = 300):Promise<Review[]> {
  return (await all<ReviewRow>(
    `SELECT r.*, p.slug AS product_slug, p.name AS product_name
     FROM reviews r JOIN products p ON p.id = r.product_id
     WHERE r.status = 'approved' ORDER BY r.created_at DESC LIMIT ?`,
    limit,
  )).map(toReview);
}

export async function ratingBreakdown(productId: number) {
  const rows = await all<{ rating: number; count: number }>(
    "SELECT rating, COUNT(*) AS count FROM reviews WHERE product_id = ? AND status = 'approved' GROUP BY rating",
    productId,
  );
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return {
    total,
    average: total ? rows.reduce((sum, r) => sum + r.rating * r.count, 0) / total : 0,
    counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...Object.fromEntries(rows.map((r) => [r.rating, r.count])) } as Record<
      number,
      number
    >,
  };
}

export async function createReview(input: {
  productId: number;
  userId: number | null;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  image?: string | null;
  verified?: boolean;
}) {
  const result = await run(
    `INSERT INTO reviews (product_id, user_id, author_name, rating, title, body, image, verified, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    input.productId,
    input.userId,
    input.authorName,
    input.rating,
    input.title,
    input.body,
    input.image ?? null,
    input.verified ?? false,
  );
  await recalculateProductRating(input.productId);
  return result.lastInsertRowid;
}

/** Keeps the denormalised rating/review_count on products in sync. */
export async function recalculateProductRating(productId: number) {
  await run(
    `UPDATE products SET
       rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ? AND status = 'approved'), 0),
       review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ? AND status = 'approved')
     WHERE id = ?`,
    productId,
    productId,
    productId,
  );
}

/* ------------------------------------------------------------------ *
 * Wishlist
 * ------------------------------------------------------------------ */

export async function getWishlist(userId: number):Promise<Product[]> {
  return (await all<ProductRow>(
    `${PRODUCT_SELECT}
     JOIN wishlist_items w ON w.product_id = p.id
     WHERE w.user_id = ? AND p.status = 'active'
     ORDER BY w.created_at DESC`,
    userId,
  )).map(toProduct);
}

export async function toggleWishlistItem(userId: number, productId: number):Promise<{ inWishlist: boolean }> {
  const existing = await get<{ id: number }>(
    "SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?",
    userId,
    productId,
  );
  if (existing) {
    await run("DELETE FROM wishlist_items WHERE id = ?", existing.id);
    return { inWishlist: false };
  }
  await run("INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)", userId, productId);
  return { inWishlist: true };
}

export async function getWishlistProductIds(userId: number):Promise<number[]> {
  return (await all<{ product_id: number }>("SELECT product_id FROM wishlist_items WHERE user_id = ?", userId)).map(
    (r) => r.product_id,
  );
}

/**
 * Idempotently adds products to an account's wishlist — used by the
 * merge-on-sign-in path, where a guest's local list is pushed up once and
 * `UNIQUE (user_id, product_id)` guarantees a repeat run changes nothing.
 */
export async function addWishlistProducts(userId: number, productIds: number[]): Promise<void> {
  const ids = [...new Set(productIds)];
  if (ids.length === 0) return;
  await batch(
    ids.map((productId) => ({
      sql: "INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)",
      args: [userId, productId],
    })),
  );
}

/* ------------------------------------------------------------------ *
 * Cart
 * ------------------------------------------------------------------ */

export async function getCart(userId: number) {
  const rows = await all<{
    id: number;
    product_id: number;
    variant_id: number;
    quantity: number;
    slug: string;
    name: string;
    subtitle: string;
    images: string;
    color: string;
    size: string;
    price: number;
    compare_at: number | null;
    stock: number;
    category_slug: string;
    gender: Product["gender"];
  }>(
    `SELECT ci.id, v.product_id, ci.variant_id, ci.quantity,
            p.slug, p.name, p.subtitle, p.images, p.price, p.compare_at,
            v.color, v.size, v.stock, p.category_slug, p.gender
     FROM cart_items ci
     JOIN variants v ON v.id = ci.variant_id
     JOIN products p ON p.id = v.product_id
     WHERE ci.user_id = ? AND p.status = 'active'
     ORDER BY ci.updated_at DESC, ci.id DESC`,
    userId,
  );

  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    variantId: r.variant_id,
    quantity: r.quantity,
    slug: r.slug,
    name: r.name,
    subtitle: r.subtitle,
    image: parseJson<string[]>(r.images, [])[0] ?? "",
    color: r.color,
    size: r.size,
    price: r.price,
    compareAt: r.compare_at,
    stock: r.stock,
    categorySlug: r.category_slug,
    gender: r.gender,
  }));
}

/** Explicit union so `in`-narrowing works at the call site. */
export async function addToCart(
  userId: number,
  variantId: number,
  quantity: number,
):Promise<{ quantity: number } | { error: string }> {
  const variant = await getVariant(variantId);
  if (!variant) return { error: "That option is no longer available" };
  const existing = await get<{ id: number; quantity: number }>(
    "SELECT id, quantity FROM cart_items WHERE user_id = ? AND variant_id = ?",
    userId,
    variantId,
  );
  const desired = (existing?.quantity ?? 0) + quantity;
  const capped = Math.min(desired, Math.max(0, variant.stock));
  if (capped <= 0) return { error: "This option is out of stock" };

  if (existing) {
    await run(
      "UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?",
      capped,
      existing.id,
    );
  } else {
    await run(
      "INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)",
      userId,
      variantId,
      capped,
    );
  }
  return { quantity: capped };
}

export async function updateCartQuantity(userId: number, lineId: number, quantity: number) {
  if (quantity <= 0) {
    await run("DELETE FROM cart_items WHERE id = ? AND user_id = ?", lineId, userId);
    return { removed: true };
  }
  const line = await get<{ variant_id: number }>(
    "SELECT variant_id FROM cart_items WHERE id = ? AND user_id = ?",
    lineId,
    userId,
  );
  if (!line) return { removed: false };
  const variant = await getVariant(line.variant_id);
  const capped = variant ? Math.min(quantity, variant.stock) : quantity;
  await run(
    "UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
    Math.max(1, capped),
    lineId,
    userId,
  );
  return { removed: false };
}

export async function removeCartLine(userId: number, lineId: number) {
  await run("DELETE FROM cart_items WHERE id = ? AND user_id = ?", lineId, userId);
  return { removed: true };
}

export async function clearCart(userId: number) {
  await run("DELETE FROM cart_items WHERE user_id = ?", userId);
}

export interface CartTotals {
  subtotal: number;
  itemCount: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingRemaining: number;
  discountCode: string | null;
  discountError: string | null;
}

export async function calculateTotals(
  lines: { price: number; quantity: number }[],
  opts: { discountCode?: string | null; shippingMethod?: string } = {},
):Promise<CartTotals> {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  let discount = 0;
  let appliedCode: string | null = null;
  let discountError: string | null = null;

  const code = opts.discountCode?.trim();
  let freeShippingByCode = false;

  if (code) {
    const found = await get<{
      code: string;
      type: Discount["type"];
      value: number;
      min_subtotal: number;
      max_discount: number | null;
      ends_at: string | null;
      usage_limit: number | null;
      used_count: number;
    }>("SELECT * FROM discounts WHERE code = ? AND active = 1", code);

    const expired = !!found?.ends_at && new Date(found.ends_at) < new Date();
    const exhausted =
      !!found?.usage_limit && found.used_count >= found.usage_limit;

    if (!found || expired || exhausted) {
      discountError = "That code isn't valid on this order.";
    } else if (subtotal < found.min_subtotal) {
      discountError = `Spend ${formatMoney(found.min_subtotal - subtotal)} more to use this code.`;
    } else {
      appliedCode = found.code;
      if (found.type === "percent") {
        discount = Math.round((subtotal * found.value) / 100);
        if (found.max_discount) discount = Math.min(discount, found.max_discount);
      } else if (found.type === "fixed") {
        discount = Math.min(found.value, subtotal);
      } else {
        freeShippingByCode = true;
      }
    }
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const method = shippingFor(opts.shippingMethod ?? "standard", afterDiscount);
  let shipping = freeShippingByCode ? 0 : method.price;
  if (itemCount === 0) shipping = 0;

  const tax = Math.round(afterDiscount * STORE.taxRate);
  const total = afterDiscount + shipping + tax;

  return {
    subtotal,
    itemCount,
    discount,
    shipping,
    tax,
    total,
    freeShippingRemaining: Math.max(0, STORE.freeShippingThreshold - afterDiscount),
    discountCode: appliedCode,
    discountError,
  };
}

/* ------------------------------------------------------------------ *
 * Addresses
 * ------------------------------------------------------------------ */

interface AddressRow {
  id: number;
  user_id: number;
  label: string;
  first_name: string;
  last_name: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: number;
}

function toAddress(r: AddressRow):Address {
  return {
    id: r.id,
    userId: r.user_id,
    label: r.label,
    firstName: r.first_name,
    lastName: r.last_name,
    line1: r.line1,
    line2: r.line2,
    city: r.city,
    region: r.region,
    postalCode: r.postal_code,
    country: r.country,
    phone: r.phone,
    isDefault: r.is_default === 1,
  };
}

export async function listAddresses(userId: number):Promise<Address[]> {
  return (await all<AddressRow>(
    "SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC",
    userId,
  )).map(toAddress);
}

export async function saveAddress(userId: number, input: Omit<Address, "id" | "userId">):Promise<number> {
  // The "is this their first address" read has to happen before any writes,
  // but the writes themselves must land as one unit: a half-applied default
  // would leave two addresses flagged as the default.
  const existing = await get<{ id: number }>(
    "SELECT id FROM addresses WHERE user_id = ? LIMIT 1",
    userId,
  );
  const makeDefault = input.isDefault || !existing;

  const statements: { sql: string; args?: unknown[] }[] = [];
  if (makeDefault) {
    statements.push({
      sql: "UPDATE addresses SET is_default = 0 WHERE user_id = ?",
      args: [userId],
    });
  }
  statements.push({
    sql: `INSERT INTO addresses (user_id, label, first_name, last_name, line1, line2, city, region, postal_code, country, phone, is_default)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      userId,
      input.label,
      input.firstName,
      input.lastName,
      input.line1,
      input.line2,
      input.city,
      input.region,
      input.postalCode,
      input.country,
      input.phone,
      makeDefault ? 1 : 0,
    ],
  });

  const results = await batch(statements);
  const insert = results.at(-1);
  if (!insert) {
    throw new Error("Address was not saved");
  }
  return insert.lastInsertRowid;
}

export async function deleteAddress(userId: number, id: number) {
  await run("DELETE FROM addresses WHERE id = ? AND user_id = ?", id, userId);
}

/* ------------------------------------------------------------------ *
 * Accounts
 * ------------------------------------------------------------------ */

/**
 * Creates a customer account and returns its id, or `null` if the address is
 * already taken.
 *
 * Kept here rather than inlined in the signup action so the flow that touches
 * `users` and `newsletter_subscribers` together is reachable from tests — the
 * two inserts used to drift apart silently.
 */
export async function createAccount(input: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}):Promise<number | null> {
  if (await get<{ id: number }>("SELECT id FROM users WHERE email = ?", input.email)) {
    return null;
  }

  return (await run(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES (?, ?, ?, ?, 'customer')`,
    input.email,
    input.passwordHash,
    input.firstName,
    input.lastName,
  )).lastInsertRowid;
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

/**
 * Human-facing order reference: `MA-` + a base36 timestamp + random suffix.
 *
 * Uniqueness is enforced by the UNIQUE index on `orders.order_number`; the
 * randomness only exists to make the number unguessable, since it appears in
 * URLs and would otherwise be a sequential leak of order volume.
 */
export function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5).toUpperCase();
  return `MA-${stamp}${rand}`;
}

interface OrderRow {
  id: number;
  order_number: string;
  user_id: number | null;
  email: string;
  first_name: string;
  last_name: string;
  status: Order["status"];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  discount_code: string | null;
  shipping_method: string;
  payment_last4: string;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  address_json: string;
  created_at: string;
  updated_at: string;
}

function toOrder(r: OrderRow, items: OrderItem[] = []):Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    userId: r.user_id,
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    status: r.status,
    subtotal: r.subtotal,
    discount: r.discount,
    shipping: r.shipping,
    tax: r.tax,
    total: r.total,
    discountCode: r.discount_code,
    shippingMethod: r.shipping_method,
    paymentLast4: r.payment_last4,
    carrier: r.carrier,
    trackingNumber: r.tracking_number,
    trackingUrl: r.tracking_url,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    items,
    address: parseJson<Order["address"]>(r.address_json, null),
  };
}

interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number | null;
  product_slug: string;
  name: string;
  subtitle: string;
  image: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
}

function toOrderItem(i: OrderItemRow): OrderItem {
  return {
    id: i.id,
    orderId: i.order_id,
    productId: i.product_id,
    productSlug: i.product_slug,
    name: i.name,
    subtitle: i.subtitle,
    image: i.image,
    color: i.color,
    size: i.size,
    price: i.price,
    quantity: i.quantity,
  };
}

async function getOrderItems(orderId: number):Promise<OrderItem[]> {
  const rows = await all<OrderItemRow>(
    "SELECT * FROM order_items WHERE order_id = ? ORDER BY id",
    orderId,
  );
  return rows.map(toOrderItem);
}

/**
 * Line items for a whole list of orders, in one round trip.
 *
 * Loading an order history one query per order is fine against a local file but
 * turns into a round trip per row once the database is remote, which is slow
 * enough to be felt on the account page. Fetching them together and grouping in
 * memory keeps it to two queries regardless of history length.
 */
async function getOrderItemsByOrder(
  orderIds: number[],
):Promise<Map<number, OrderItem[]>> {
  const grouped = new Map<number, OrderItem[]>();
  if (orderIds.length === 0) return grouped;

  const rows = await all<OrderItemRow>(
    `SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => "?").join(",")}) ORDER BY id`,
    ...orderIds,
  );
  for (const row of rows) {
    const list = grouped.get(row.order_id);
    if (list) list.push(toOrderItem(row));
    else grouped.set(row.order_id, [toOrderItem(row)]);
  }
  return grouped;
}

export async function getOrderByNumber(orderNumber: string):Promise<Order | null> {
  const row = await get<OrderRow>("SELECT * FROM orders WHERE order_number = ?", orderNumber);
  return row ? toOrder(row, (await getOrderItems(row.id))) : null;
}

export async function getOrderForUser(orderNumber: string, userId: number):Promise<Order | null> {
  const row = await get<OrderRow>("SELECT * FROM orders WHERE order_number = ? AND user_id = ?", orderNumber, userId);
  return row ? toOrder(row, (await getOrderItems(row.id))) : null;
}

export async function listOrdersForUser(userId: number):Promise<Order[]> {
  const rows = await all<OrderRow>("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", userId);
  const items = await getOrderItemsByOrder(rows.map((r) => r.id));
  return rows.map((r) => toOrder(r, items.get(r.id) ?? []));
}

export async function createOrder(input: {
  orderNumber: string;
  userId: number | null;
  email: string;
  firstName: string;
  lastName: string;
  status: Order["status"];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  discountCode: string | null;
  shippingMethod: string;
  paymentLast4: string;
  address: Order["address"];
  notes: string | null;
  items: {
    productId: number;
    slug: string;
    name: string;
    subtitle: string;
    image: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
    variantId: number;
  }[];
}) {
  // Everything lands in a single atomic batch: the order, its line items, the
  // stock decrements, the discount counter, and clearing the bag. A partially
  // applied order would mean charging someone for stock we never took.
  //
  // `order_number` is UNIQUE, so the line items resolve their order with a
  // subquery. That keeps the whole write to one round trip, which is what makes
  // it atomic over HTTP — there is no id to thread through from step one.
  const statements: { sql: string; args?: unknown[] }[] = [
    {
      sql: `INSERT INTO orders
              (order_number, user_id, email, first_name, last_name, status, subtotal, discount, shipping, tax, total,
               discount_code, shipping_method, payment_last4, notes, address_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        input.orderNumber,
        input.userId,
        input.email,
        input.firstName,
        input.lastName,
        input.status,
        input.subtotal,
        input.discount,
        input.shipping,
        input.tax,
        input.total,
        input.discountCode,
        input.shippingMethod,
        input.paymentLast4,
        input.notes,
        JSON.stringify(input.address ?? {}),
      ],
    },
  ];

  for (const item of input.items) {
    statements.push({
      sql: `INSERT INTO order_items (order_id, product_id, product_slug, name, subtitle, image, color, size, price, quantity)
            SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM orders WHERE order_number = ?`,
      args: [
        item.productId,
        item.slug,
        item.name,
        item.subtitle,
        item.image,
        item.color,
        item.size,
        item.price,
        item.quantity,
        input.orderNumber,
      ],
    });
    // Stock moves in the same batch as the order, so a failed write can never
    // leave inventory inconsistent with sales.
    statements.push({
      sql: "UPDATE variants SET stock = MAX(0, stock - ?) WHERE id = ?",
      args: [item.quantity, item.variantId],
    });
  }

  if (input.discountCode) {
    statements.push({
      sql: "UPDATE discounts SET used_count = used_count + 1 WHERE code = ?",
      args: [input.discountCode],
    });
  }

  if (input.userId) {
    statements.push({
      sql: "DELETE FROM cart_items WHERE user_id = ?",
      args: [input.userId],
    });
  }

  await batch(statements);

  // Read the id back rather than trusting the batched lastInsertRowid: with
  // concurrent writers that value is not guaranteed to be ours.
  const row = await get<{ id: number }>("SELECT id FROM orders WHERE order_number = ?", input.orderNumber);
  if (!row) {
    throw new Error(`Order ${input.orderNumber} was not written`);
  }
  return row.id;
}

export async function updateOrderStatus(orderId: number, status: Order["status"]) {
  await run(
    "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?",
    status,
    orderId,
  );
}

export async function attachTracking(orderId: number, carrier: string, trackingNumber: string) {
  await run(
    "UPDATE orders SET carrier = ?, tracking_number = ?, updated_at = datetime('now') WHERE id = ?",
    carrier,
    trackingNumber,
    orderId,
  );
}

/* ------------------------------------------------------------------ *
 * Newsletter
 * ------------------------------------------------------------------ */

export async function subscribeToNewsletter(email: string):Promise<{ ok: boolean; message: string }> {
  const existing = await get<{ id: number }>("SELECT id FROM newsletter_subscribers WHERE email = ?", email);
  if (existing) return { ok: true, message: "You're already on the list." };
  await run("INSERT INTO newsletter_subscribers (email) VALUES (?)", email);
  return { ok: true, message: "Welcome in. Check your inbox for 10% off." };
}

/* ------------------------------------------------------------------ *
 * Inspiration
 * ------------------------------------------------------------------ */

export async function listInspiration():Promise<InspirationPost[]> {
  return (await all<{
    id: number;
    slug: string;
    title: string;
    category: string;
    image: string;
    aspect: string;
    product_slugs: string;
  }>("SELECT * FROM inspiration_posts ORDER BY sort_order, id")).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    image: r.image,
    aspect: (r.aspect as InspirationPost["aspect"]) ?? "tall",
    productSlugs: parseJson<string[]>(r.product_slugs, []),
    createdAt: "",
  }));
}

export async function getInspirationPost(slug: string):Promise<InspirationPost | null> {
  const posts = await listInspiration();
  return posts.find((p) => p.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ *
 * Admin aggregates
 * ------------------------------------------------------------------ */

export async function getAdminStats() {
  const revenueRow = await get<{ revenue: number; orders: number }>(
    "SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE status != 'cancelled'",
  );
  const customers = await scalar<number>("SELECT COUNT(*) FROM users WHERE role = 'customer'") ?? 0;
  const products = await scalar<number>("SELECT COUNT(*) FROM products WHERE status = 'active'") ?? 0;
  const lowStock = await all<{ id: number; name: string; slug: string; stock: number }>(
    `SELECT p.id, p.name, p.slug, COALESCE(SUM(v.stock), 0) AS stock
     FROM products p JOIN variants v ON v.product_id = p.id
     GROUP BY p.id HAVING stock <= 8 ORDER BY stock ASC LIMIT 8`,
  );
  const pendingReviews = await scalar<number>("SELECT COUNT(*) FROM reviews WHERE status = 'pending'") ?? 0;
  const openOrders = await scalar<number>(
    "SELECT COUNT(*) FROM orders WHERE status IN ('confirmed','processing','shipped','out_for_delivery')",
  ) ?? 0;

  // 30-day revenue series for the dashboard sparkline.
  const series = await all<{ day: string; revenue: number; orders: number }>(
    `SELECT date(created_at) AS day, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders
     FROM orders WHERE status != 'cancelled' AND created_at >= date('now', '-29 days')
     GROUP BY day ORDER BY day`,
  );

  const topProducts = await all<{ name: string; slug: string; units: number; revenue: number }>(
    `SELECT p.name, p.slug, SUM(oi.quantity) AS units, SUM(oi.quantity * oi.price) AS revenue
     FROM order_items oi JOIN products p ON p.id = oi.product_id
     GROUP BY p.id ORDER BY units DESC LIMIT 6`,
  );

  const byCategory = await all<{ label: string; value: number; count: number }>(
    `SELECT c.name AS label, COUNT(p.id) AS value, COALESCE(SUM(p.popularity), 0) AS count
     FROM categories c LEFT JOIN products p ON p.category_slug = c.slug AND p.status = 'active'
     GROUP BY c.slug ORDER BY value DESC`,
  );

  return {
    revenue: revenueRow?.revenue ?? 0,
    orders: revenueRow?.orders ?? 0,
    customers,
    products,
    pendingReviews,
    openOrders,
    lowStock,
    series,
    topProducts,
    byCategory,
  };
}

export interface CustomerSummary {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  orderCount: number;
  spend: number;
}

export async function listCustomers():Promise<CustomerSummary[]> {
  return (await all<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    created_at: string;
    order_count: number;
    spend: number;
  }>(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled') AS order_count,
            (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled') AS spend
     FROM users u WHERE u.role = 'customer' ORDER BY spend DESC`,
  )).map((r) => ({
    id: r.id,
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    createdAt: r.created_at,
    orderCount: r.order_count,
    spend: r.spend,
  }));
}

export async function listAllOrders(limit = 200):Promise<Order[]> {
  const rows = await all<OrderRow>("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?", limit);
  const items = await getOrderItemsByOrder(rows.map((r) => r.id));
  return rows.map((r) => toOrder(r, items.get(r.id) ?? []));
}

export async function listAllReviews():Promise<Review[]> {
  return (await all<ReviewRow>(
    `SELECT r.*, p.slug AS product_slug, p.name AS product_name
     FROM reviews r JOIN products p ON p.id = r.product_id
     ORDER BY r.created_at DESC`,
  )).map(toReview);
}

export async function moderateReview(reviewId: number, status: Review["status"]) {
  await run("UPDATE reviews SET status = ? WHERE id = ?", status, reviewId);
  const row = await get<{ product_id: number }>("SELECT product_id FROM reviews WHERE id = ?", reviewId);
  if (row) await recalculateProductRating(row.product_id);
}

export async function listDiscounts():Promise<Discount[]> {
  return (await all<{
    id: number;
    code: string;
    description: string;
    type: Discount["type"];
    value: number;
    min_subtotal: number;
    max_discount: number | null;
    active: number;
    starts_at: string;
    ends_at: string | null;
    usage_limit: number | null;
    used_count: number;
  }>("SELECT * FROM discounts ORDER BY active DESC, id DESC")).map((d) => ({
    id: d.id,
    code: d.code,
    description: d.description,
    type: d.type,
    value: d.value,
    minSubtotal: d.min_subtotal,
    maxDiscount: d.max_discount,
    active: d.active === 1,
    startsAt: d.starts_at,
    endsAt: d.ends_at,
    usageLimit: d.usage_limit,
    usedCount: d.used_count,
  }));
}

export { PRODUCT_SELECT };
export type { Paginated };
