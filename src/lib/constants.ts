/* ------------------------------------------------------------------ *
 * Navigation
 * ------------------------------------------------------------------ */

export const MAIN_NAV = [
  { label: "Home", href: "/" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Women", href: "/category/women" },
  { label: "Men", href: "/category/men" },
  { label: "Shoes", href: "/category/shoes" },
  { label: "Jewelry", href: "/category/jewelry" },
  { label: "Accessories", href: "/category/accessories" },
  { label: "Sale", href: "/sale" },
] as const;

export const MOBILE_NAV = [
  { label: "Home", href: "/" },
  { label: "New In", href: "/new-arrivals" },
  { label: "Women", href: "/category/women" },
  { label: "Men", href: "/category/men" },
  { label: "Sale", href: "/sale" },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "New Arrivals", href: "/new-arrivals" },
      { label: "Women", href: "/category/women" },
      { label: "Men", href: "/category/men" },
      { label: "Shoes", href: "/category/shoes" },
      { label: "Jewelry", href: "/category/jewelry" },
      { label: "Bags", href: "/category/bags" },
      { label: "Accessories", href: "/category/accessories" },
      { label: "Sale", href: "/sale" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { label: "Contact Us", href: "/help/contact" },
      { label: "Shipping & Delivery", href: "/help/shipping" },
      { label: "Returns & Exchanges", href: "/help/returns" },
      { label: "Size Guide", href: "/help/size-guide" },
      { label: "Track Your Order", href: "/account/orders" },
      { label: "FAQ", href: "/help/faq" },
    ],
  },
  {
    title: "About Us",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Sustainability", href: "/about/sustainability" },
      { label: "Careers", href: "/about/careers" },
      { label: "Press", href: "/about/press" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
    ],
  },
] as const;

export const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", handle: "@wearnow" },
  { label: "Pinterest", href: "https://pinterest.com", handle: "@wearnow" },
  { label: "TikTok", href: "https://tiktok.com", handle: "@wearnow" },
  { label: "YouTube", href: "https://youtube.com", handle: "@wearnow" },
] as const;

/* ------------------------------------------------------------------ *
 * Announcement bar
 * ------------------------------------------------------------------ */

export const ANNOUNCEMENTS = [
  "Complimentary delivery on orders over $150",
  "New season drop — up to 40% off selected pieces",
  "Free 30-day returns, no questions asked",
  "Members get first access to every new release",
] as const;

/* ------------------------------------------------------------------ *
 * Store configuration
 * ------------------------------------------------------------------ */

export const STORE = {
  name: "Wear Now",
  tagline: "Style that speaks for you",
  description:
    "A considered edit of clothing, shoes, jewelry, bags and accessories — chosen for the way they feel, the way they last, and the way they make an outfit feel finished.",
  email: "hello@wearnow.com",
  phone: "+1 (212) 555-0184",
  address: "48 Mercer Street, SoHo, New York, NY 10013",
  currency: "USD",
  freeShippingThreshold: 15000,
  taxRate: 0.08,
} as const;

export const SHIPPING_METHODS = [
  {
    id: "standard",
    label: "Standard",
    description: "4–6 business days",
    price: 0,
    threshold: 15000,
    thresholdNote: "Free over $150",
  },
  {
    id: "express",
    label: "Express",
    description: "2–3 business days",
    price: 1200,
    threshold: null,
    thresholdNote: null,
  },
  {
    id: "courier",
    label: "Next Day Courier",
    description: "Ordered before 2pm, delivered tomorrow",
    price: 2400,
    threshold: null,
    thresholdNote: null,
  },
] as const;

export type ShippingMethodId = (typeof SHIPPING_METHODS)[number]["id"];

export function getShippingMethod(id: string) {
  return SHIPPING_METHODS.find((m) => m.id === id) ?? SHIPPING_METHODS[0];
}

/** Shipping is free above the threshold for the standard tier. */
export function shippingFor(id: string, subtotal: number) {
  const method = getShippingMethod(id);
  let price = method.price;
  if (method.threshold && subtotal >= method.threshold) price = 0;
  return { ...method, price };
}

/* ------------------------------------------------------------------ *
 * Variants
 * ------------------------------------------------------------------ */

export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43"] as const;
export const ONE_SIZE = ["One Size"] as const;

export const SIZE_FILTERS = [...APPAREL_SIZES, ...SHOE_SIZES, "One Size"] as const;

export const COLOR_FILTERS = [
  { name: "Black", hex: "#121110" },
  { name: "White", hex: "#F7F6F3" },
  { name: "Cream", hex: "#E8DFD1" },
  { name: "Camel", hex: "#B08968" },
  { name: "Brown", hex: "#6B4A2F" },
  { name: "Olive", hex: "#5A6146" },
  { name: "Sage", hex: "#A3B093" },
  { name: "Navy", hex: "#1F2A44" },
  { name: "Blue", hex: "#4A6C8C" },
  { name: "Burgundy", hex: "#6B2233" },
  { name: "Red", hex: "#A32D2A" },
  { name: "Pink", hex: "#E5C3C0" },
  { name: "Lilac", hex: "#B9AECF" },
  { name: "Grey", hex: "#8C8C8C" },
  { name: "Gold", hex: "#C9A227" },
  { name: "Silver", hex: "#C7C9CC" },
] as const;

/* ------------------------------------------------------------------ *
 * Discovery
 * ------------------------------------------------------------------ */

export const TRENDING_SEARCHES = [
  "trench coat",
  "silk slip dress",
  "leather loafers",
  "gold hoops",
  "structured tote",
  "cashmere knit",
  "denim jacket",
  "minimal jewelry",
] as const;

export const INSPIRATION_CATEGORIES = [
  "Street Style",
  "Luxury",
  "Casual",
  "Date Night",
  "Office Style",
  "Weekend",
  "Accessories",
] as const;

export const ORDER_STATUS_META: Record<
  string,
  { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger"; blurb: string }
> = {
  pending: { label: "Pending", tone: "warning", blurb: "Awaiting payment confirmation" },
  confirmed: { label: "Confirmed", tone: "info", blurb: "Payment received" },
  processing: { label: "Processing", tone: "info", blurb: "Preparing your pieces" },
  shipped: { label: "Shipped", tone: "info", blurb: "On its way" },
  out_for_delivery: { label: "Out for delivery", tone: "info", blurb: "Arriving today" },
  delivered: { label: "Delivered", tone: "success", blurb: "Enjoy your pieces" },
  cancelled: { label: "Cancelled", tone: "danger", blurb: "Order cancelled" },
  refunded: { label: "Refunded", tone: "neutral", blurb: "Refund issued" },
};

export const ORDER_STATUS_FLOW: readonly string[] = [
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

/* ------------------------------------------------------------------ *
 * SEO / pagination
 * ------------------------------------------------------------------ */

export const PRODUCTS_PER_PAGE = 12;
