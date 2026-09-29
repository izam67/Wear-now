"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CartLine, Product } from "@/lib/types";
import {
  adoptServerState,
  cartStore,
  getServerSnapshot,
  getSnapshot,
  guestCart,
  guestWishlist,
  prefsStore,
  subscribe,
  viewedStore,
  wishlistStore,
  type WishlistItem,
} from "@/lib/client-store";
import { useToast } from "./toast-provider";

/* ------------------------------------------------------------------ *
 * Store
 *
 * Two rules shape this design:
 *
 *  1. Never block the UI on the network. Every mutation updates local state
 *     immediately and reconciles with the server in the background, so
 *     "Add to bag" feels instant on a slow connection.
 *
 *  2. Guests and members behave identically. A guest bag lives in
 *     localStorage; on sign-in the server copy is merged in so nothing is lost
 *     at the moment of account creation.
 * ------------------------------------------------------------------ */

export interface AddToCartInput {
  product: Pick<
    Product,
    "id" | "slug" | "name" | "subtitle" | "images" | "price" | "compareAt" | "categorySlug" | "gender"
  >;
  variantId: number;
  color: string;
  size: string;
  quantity?: number;
}

interface StoreValue {
  /* Session */
  signedIn: boolean;
  /** False during the first paint, before localStorage has been read. */
  ready: boolean;

  /* Cart */
  lines: CartLine[];
  count: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (input: AddToCartInput) => Promise<void>;
  updateQuantity: (lineId: number, quantity: number) => Promise<void>;
  removeLine: (lineId: number) => Promise<void>;
  clearCart: () => Promise<void>;

  /* Preferences, persisted so a total survives a refresh */
  discountCode: string | null;
  setDiscountCode: (code: string | null) => void;
  shippingMethod: string;
  setShippingMethod: (id: string) => void;

  /* Wishlist */
  wishlist: number[];
  /** Saved products in order, ready to hand to a card grid. */
  wishlistItems: WishlistItem[];
  isWishlisted: (productId: number) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  clearWishlist: () => void;

  /* Recently viewed */
  recentlyViewed: { id: number; slug: string }[];
  trackView: (product: { id: number; slug: string }) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export function StoreProvider({
  children,
  signedIn,
  serverCart = [],
  serverWishlist = [],
}: {
  children: React.ReactNode;
  signedIn: boolean;
  serverCart?: CartLine[];
  /** Full products, not just ids — the client needs the data to draw cards. */
  serverWishlist?: Product[];
}) {
  const { toast } = useToast();
  const [isCartOpen, setCartOpen] = useState(false);

  /* Read-through to localStorage with a server snapshot for hydration. */
  const persisted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { lines, wishlist, wishlistItems, viewed, discount, shipping } = persisted;

  /* `localStorage` is only populated on the client, so the first render always
   * sees the empty server snapshot. Anything that would otherwise flash an
   * "empty bag" message waits on this instead of guessing. Reading it through
   * `useSyncExternalStore` — false on the server, true on the client — gets the
   * post-hydration signal without a setState-in-effect pass. */
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  /* Reconcile the account's real state into the client store. This writes to
   * the external store rather than to React state, which is exactly what an
   * effect is for. */
  const adopted = useRef(false);
  useEffect(() => {
    if (adopted.current) return;
    adopted.current = true;

    // Snapshot the guest bag *before* adoption overwrites it — after this call
    // the orphan lines are gone, and merge-on-sign-in would find nothing.
    const orphan = signedIn ? guestCart() : [];
    // Same for the wishlist: the account list replaces the local one, so the
    // ids a guest starred must be captured now while they still exist. The
    // server's snapshots win for any overlap.
    const orphanSaved = signedIn ? guestWishlist() : [];
    const savedSnapshots = new Map<number, WishlistItem>(
      orphanSaved.map((p) => [p.id, p]),
    );
    for (const p of serverWishlist) savedSnapshots.set(p.id, p);

    adoptServerState(signedIn, serverCart, serverWishlist);

    if (orphan.length === 0) return;

    // Best effort: push each guest line up and let the server's response become
    // the new truth. A failure here leaves the account cart as adopted, which is
    // a lesser evil than showing a bag the shopper thinks they lost.
    for (const line of orphan) {
      void fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: line.variantId, quantity: line.quantity }),
      })
        .then((res) => (res.ok ? (res.json() as Promise<{ cart?: CartLine[] }>) : null))
        .then((data) => {
          if (data?.cart) cartStore.replace(data.cart);
        })
        .catch(() => {
          /* keep the adopted cart */
        });
    }

    // Push the guest's starred ids up once. The server responds with the
    // merged order; combined snapshots cover every id on both sides.
    if (orphanSaved.length > 0) {
      void fetch("/api/wishlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: orphanSaved.map((p) => p.id) }),
      })
        .then((res) => (res.ok ? (res.json() as Promise<{ wishlist?: number[] }>) : null))
        .then((data) => {
          if (!data?.wishlist) return;
          const merged = data.wishlist
            .map((id) => savedSnapshots.get(id))
            .filter((p): p is WishlistItem => !!p);
          if (merged.length > 0) wishlistStore.replace(merged);
        })
        .catch(() => {
          /* keep the adopted wishlist */
        });
    }
  }, [signedIn, serverCart, serverWishlist]);

  const addToCart = useCallback(
    async ({ product, variantId, color, size, quantity = 1 }: AddToCartInput) => {
      cartStore.add({
        // Provisional id; replaced by the server's line id on the next sync.
        id: -Date.now(),
        productId: product.id,
        variantId,
        quantity,
        slug: product.slug,
        name: product.name,
        subtitle: product.subtitle,
        image: product.images[0] ?? "",
        color,
        size,
        price: product.price,
        compareAt: product.compareAt,
        stock: 99,
        categorySlug: product.categorySlug,
        gender: product.gender,
      });
      setCartOpen(true);
      toast(`${product.name} added to your bag`, {
        action: { label: "View", href: "/cart" },
      });

      if (!signedIn) return;
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, quantity }),
        });
        if (res.ok) {
          const data = (await res.json()) as { cart?: CartLine[] };
          if (data.cart) cartStore.replace(data.cart);
        }
      } catch {
        /* keep the optimistic state */
      }
    },
    [signedIn, toast],
  );

  const updateQuantity = useCallback(
    async (lineId: number, quantity: number) => {
      cartStore.setQuantity(lineId, quantity);
      if (!signedIn) return;
      try {
        const res = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineId, quantity }),
        });
        if (res.ok) {
          const data = (await res.json()) as { cart?: CartLine[] };
          if (data.cart) cartStore.replace(data.cart);
        }
      } catch {
        /* keep the optimistic state */
      }
    },
    [signedIn],
  );

  const removeLine = useCallback(
    async (lineId: number) => {
      cartStore.setQuantity(lineId, 0);
      if (!signedIn) return;
      try {
        const res = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineId }),
        });
        if (res.ok) {
          const data = (await res.json()) as { cart?: CartLine[] };
          if (data.cart) cartStore.replace(data.cart);
        }
      } catch {
        /* keep the optimistic state */
      }
    },
    [signedIn],
  );

  const clearCart = useCallback(async () => {
    cartStore.clear();
    if (!signedIn) return;
    await fetch("/api/cart", { method: "DELETE" }).catch(() => undefined);
  }, [signedIn]);

  const toggleWishlist = useCallback(
    async (product: Product) => {
      const nowSaved = wishlistStore.toggle(product);
      toast(
        nowSaved ? `${product.name} saved to wishlist` : `${product.name} removed from wishlist`,
        {
          tone: nowSaved ? "success" : "info",
          action: nowSaved ? { label: "View", href: "/wishlist" } : undefined,
        },
      );

      if (!signedIn) return;
      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
        if (res.ok) {
          // The server returns the authoritative id list; the snapshots we hold
          // are still valid, so only the ordering is replaced.
          const data = (await res.json()) as { wishlist?: number[] };
          if (data.wishlist) {
            const known = new Set(wishlist);
            const items = [...data.wishlist]
              .map((id) => wishlistItems[id])
              .filter((p): p is WishlistItem => !!p);
            if (items.length === known.size) {
              wishlistStore.replace(items);
            }
          }
        }
      } catch {
        /* keep the optimistic state */
      }
    },
    [signedIn, toast, wishlist, wishlistItems],
  );

  const trackView = useCallback((product: { id: number; slug: string }) => {
    viewedStore.track(product);
  }, []);

  const value = useMemo<StoreValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

    // Order follows the id list, not insertion order of the snapshot map.
    const savedProducts = wishlist
      .map((id) => wishlistItems[id])
      .filter((p): p is WishlistItem => !!p);

    return {
      signedIn,
      ready,
      lines,
      count,
      subtotal,
      isCartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      addToCart,
      updateQuantity,
      removeLine,
      clearCart,
      discountCode: discount,
      setDiscountCode: prefsStore.setDiscount,
      shippingMethod: shipping,
      setShippingMethod: prefsStore.setShipping,
      wishlist,
      wishlistItems: savedProducts,
      isWishlisted: (id) => wishlist.includes(id),
      toggleWishlist,
      clearWishlist: wishlistStore.clear,
      recentlyViewed: viewed,
      trackView,
    };
  }, [
    signedIn, ready, lines, isCartOpen, addToCart, updateQuantity, removeLine, clearCart,
    discount, shipping, wishlist, wishlistItems, toggleWishlist, viewed, trackView,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
