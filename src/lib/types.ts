export type Gender = "women" | "men" | "unisex";
export type ProductStatus = "active" | "draft" | "archived";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type DiscountType = "percent" | "fixed" | "free_shipping";
export type UserRole = "customer" | "admin";

export interface Category {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  sortOrder: number;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  gender: Gender;
  /** Integer cents. */
  price: number;
  /** Integer cents; null when the item is not reduced. */
  compareAt: number | null;
  rating: number;
  reviewCount: number;
  images: string[];
  colors: ProductColor[];
  sizes: string[];
  materials: string;
  care: string;
  details: string[];
  tags: string[];
  isNew: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  status: ProductStatus;
  popularity: number;
  createdAt: string;
  /** Denormalised stock, summed across variants. */
  stock: number;
  /**
   * The variant quick-add uses when the shopper hasn't picked options yet.
   * Null only when the product has no variants at all.
   */
  defaultVariant: { id: number; color: string; size: string } | null;
}

export interface Variant {
  id: number;
  productId: number;
  sku: string;
  color: string;
  size: string;
  stock: number;
}

export interface Review {
  id: number;
  productId: number;
  productSlug: string;
  productName: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  image: string | null;
  verified: boolean;
  status: ReviewStatus;
  createdAt: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
}

export interface Address {
  id: number;
  userId: number;
  label: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface CartLine {
  id: number;
  productId: number;
  variantId: number;
  quantity: number;
  slug: string;
  name: string;
  subtitle: string;
  image: string;
  color: string;
  size: string;
  price: number;
  compareAt: number | null;
  stock: number;
  categorySlug: string;
  gender: Gender;
}

export interface OrderItem {
  id: number;
  orderId: number;
  /** Null once the underlying product has been removed from the catalog. */
  productId: number | null;
  productSlug: string;
  name: string;
  subtitle: string;
  image: string;
  color: string;
  size: string;
  /** Integer cents, captured at purchase time. */
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number | null;
  email: string;
  firstName: string;
  lastName: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  discountCode: string | null;
  shippingMethod: string;
  paymentLast4: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: OrderAddress | null;
}

export interface OrderAddress {
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface Discount {
  id: number;
  code: string;
  description: string;
  type: DiscountType;
  /** Percent (1-100) or cents, depending on `type`. */
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  active: boolean;
  startsAt: string;
  endsAt: string | null;
  usageLimit: number | null;
  usedCount: number;
}

export interface InspirationPost {
  id: number;
  slug: string;
  title: string;
  category: string;
  image: string;
  aspect: "tall" | "square" | "wide";
  productSlugs: string[];
  createdAt: string;
}

export interface ProductQuery {
  q?: string;
  category?: string[];
  gender?: string[];
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
  page?: number;
  perPage?: number;
  onSale?: boolean;
  isNew?: boolean;
  ids?: number[];
  excludeIds?: number[];
  inStockOnly?: boolean;
}

export type SortKey = "newest" | "price-asc" | "price-desc" | "popular" | "rating" | "name";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "name", label: "Alphabetical" },
];

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}
