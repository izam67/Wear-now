export const SCHEMA = /* sql */ `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  first_name    TEXT    NOT NULL,
  last_name     TEXT    NOT NULL,
  phone         TEXT,
  role          TEXT    NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS addresses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label        TEXT    NOT NULL DEFAULT 'Home',
  first_name   TEXT    NOT NULL,
  last_name    TEXT    NOT NULL,
  line1        TEXT    NOT NULL,
  line2        TEXT,
  city         TEXT    NOT NULL,
  region       TEXT    NOT NULL,
  postal_code  TEXT    NOT NULL,
  country      TEXT    NOT NULL DEFAULT 'United States',
  phone        TEXT    NOT NULL DEFAULT '',
  is_default   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  tagline     TEXT    NOT NULL DEFAULT '',
  description TEXT    NOT NULL DEFAULT '',
  image       TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT    NOT NULL UNIQUE,
  name          TEXT    NOT NULL,
  subtitle      TEXT    NOT NULL DEFAULT '',
  description   TEXT    NOT NULL DEFAULT '',
  category_slug TEXT    NOT NULL,
  gender        TEXT    NOT NULL DEFAULT 'unisex' CHECK (gender IN ('women','men','unisex')),
  price         INTEGER NOT NULL,
  compare_at    INTEGER,
  rating        REAL    NOT NULL DEFAULT 0,
  review_count  INTEGER NOT NULL DEFAULT 0,
  images        TEXT    NOT NULL DEFAULT '[]',
  colors        TEXT    NOT NULL DEFAULT '[]',
  sizes         TEXT    NOT NULL DEFAULT '[]',
  materials     TEXT    NOT NULL DEFAULT '',
  care          TEXT    NOT NULL DEFAULT '',
  details       TEXT    NOT NULL DEFAULT '[]',
  tags          TEXT    NOT NULL DEFAULT '[]',
  is_new        INTEGER NOT NULL DEFAULT 0,
  is_featured   INTEGER NOT NULL DEFAULT 0,
  is_best_seller INTEGER NOT NULL DEFAULT 0,
  status        TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  popularity    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_new      ON products(is_new, created_at);
CREATE INDEX IF NOT EXISTS idx_products_pop      ON products(popularity DESC);

CREATE TABLE IF NOT EXISTS variants (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku        TEXT    NOT NULL UNIQUE,
  color      TEXT    NOT NULL,
  size       TEXT    NOT NULL,
  stock      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);

CREATE TABLE IF NOT EXISTS reviews (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author_name  TEXT    NOT NULL,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title        TEXT    NOT NULL DEFAULT '',
  body         TEXT    NOT NULL,
  image        TEXT,
  verified     INTEGER NOT NULL DEFAULT 0,
  status       TEXT    NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, status);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, variant_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number    TEXT    NOT NULL UNIQUE,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email           TEXT    NOT NULL,
  first_name      TEXT    NOT NULL,
  last_name       TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'confirmed',
  subtotal        INTEGER NOT NULL,
  discount        INTEGER NOT NULL DEFAULT 0,
  shipping        INTEGER NOT NULL DEFAULT 0,
  tax             INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL,
  discount_code   TEXT,
  shipping_method TEXT    NOT NULL DEFAULT 'standard',
  payment_last4   TEXT    NOT NULL DEFAULT '4242',
  carrier         TEXT,
  tracking_number TEXT,
  tracking_url    TEXT,
  notes           TEXT,
  address_json    TEXT    NOT NULL DEFAULT '{}',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_user    ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_slug TEXT    NOT NULL DEFAULT '',
  name         TEXT    NOT NULL,
  subtitle     TEXT    NOT NULL DEFAULT '',
  image        TEXT    NOT NULL DEFAULT '',
  color        TEXT    NOT NULL DEFAULT '',
  size         TEXT    NOT NULL DEFAULT '',
  price        INTEGER NOT NULL,
  quantity     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS discounts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  description   TEXT    NOT NULL DEFAULT '',
  type          TEXT    NOT NULL CHECK (type IN ('percent','fixed','free_shipping')),
  value         INTEGER NOT NULL DEFAULT 0,
  min_subtotal  INTEGER NOT NULL DEFAULT 0,
  max_discount  INTEGER,
  active        INTEGER NOT NULL DEFAULT 1,
  starts_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  ends_at       TEXT,
  usage_limit   INTEGER,
  used_count    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inspiration_posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT    NOT NULL UNIQUE,
  title         TEXT    NOT NULL,
  category      TEXT    NOT NULL,
  image         TEXT    NOT NULL,
  aspect        TEXT    NOT NULL DEFAULT 'tall',
  product_slugs TEXT    NOT NULL DEFAULT '[]',
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
`;
