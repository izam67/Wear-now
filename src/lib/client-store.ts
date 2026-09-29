import type { CartLine, Product } from "./types";

/**
 * Client-side persistence for the bag, wishlist and recently-viewed list.
 *
 * This is deliberately a module-level external store rather than React state
 * inside a provider. Three reasons:
 *
 *  1. `useSyncExternalStore` is the only hydration-safe way to read
 *     `localStorage` — the server snapshot and the client snapshot are supplied
 *     separately, so there is no markup mismatch and no setState-in-effect pass.
 *  2. The cart outlives any single component tree. With state in a provider, a
 *     remount would silently drop an in-progress bag.
 *  3. Persistence is a side effect of committing, not a separate concern that
 *     can drift out of sync with the state it mirrors.
 */

/**
 * Saved products are stored whole, not as ids alone.
 *
 * A guest's wishlist is only ever read on their own device, so the page has no
 * way to ask the server "which products did this browser star?" — the data has
 * to come from localStorage. Storing the full `Product` is what lets the grid
 * render offline, and keeps a signed-in shopper's list identical to a guest's.
 * The cost is a few hundred bytes per saved item, which is nothing against the
 * ~5 MB localStorage budget.
 */
export type WishlistItem = Product;

export interface PersistedState {
  lines: CartLine[];
  /** Ordered product ids, most recently saved first. */
  wishlist: number[];
  /** Snapshots for the ids above, so cards render without a round trip. */
  wishlistItems: Record<number, WishlistItem>;
  viewed: { id: number; slug: string }[];
  discount: string | null;
  shipping: string;
}

const KEYS = {
  lines: "wn.cart.v1",
  wishlist: "wn.wishlist.v1",
  /** Kept separate so a schema change here can't corrupt a shopper's ids. */
  wishlistItems: "wn.wishlistItems.v1",
  viewed: "wn.viewed.v1",
  discount: "wn.discount.v1",
  shipping: "wn.shipping.v1",
  theme: "wn.theme.v1",
} as const;

const MAX_VIEWED = 12;

/** Stable empty snapshot — also the value used for server rendering. */
export const EMPTY_STATE: PersistedState = {
  lines: [],
  wishlist: [],
  wishlistItems: {},
  viewed: [],
  discount: null,
  shipping: "standard",
};

let state: PersistedState = EMPTY_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private mode or quota exceeded — the session still works in memory. */
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  state = {
    lines: read<CartLine[]>(KEYS.lines, []),
    wishlist: read<number[]>(KEYS.wishlist, []),
    wishlistItems: read<Record<number, WishlistItem>>(KEYS.wishlistItems, {}),
    viewed: read<{ id: number; slug: string }[]>(KEYS.viewed, []),
    discount: read<string | null>(KEYS.discount, null),
    shipping: read<string>(KEYS.shipping, "standard"),
  };
  // Drop snapshots for ids that are no longer starred, so the two keys can't
  // drift apart across a partial write.
  const live = new Set(state.wishlist);
  const pruned: Record<number, WishlistItem> = {};
  for (const id of state.wishlist) {
    const item = state.wishlistItems[id];
    if (item) pruned[id] = item;
  }
  for (const id of Object.keys(state.wishlistItems)) {
    if (!live.has(Number(id))) delete pruned[Number(id)];
  }
  state.wishlistItems = pruned;
  loaded = true;
}

function commit(next: PersistedState, persist: Partial<Record<keyof PersistedState, true>>) {
  state = next;
  if (persist.lines) write(KEYS.lines, next.lines);
  if (persist.wishlist) write(KEYS.wishlist, next.wishlist);
  if (persist.wishlistItems) write(KEYS.wishlistItems, next.wishlistItems);
  if (persist.viewed) write(KEYS.viewed, next.viewed);
  if (persist.discount) write(KEYS.discount, next.discount);
  if (persist.shipping) write(KEYS.shipping, next.shipping);
  for (const listener of listeners) listener();
}

/* ------------------------------------------------------------------ *
 * useSyncExternalStore bindings
 * ------------------------------------------------------------------ */

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): PersistedState {
  load();
  return state;
}

/** Server render, and the value React compares against during hydration. */
export function getServerSnapshot(): PersistedState {
  return EMPTY_STATE;
}

/* ------------------------------------------------------------------ *
 * Mutations
 * ------------------------------------------------------------------ */

export const cartStore = {
  get(): CartLine[] {
    return getSnapshot().lines;
  },
  set(lines: CartLine[]) {
    commit({ ...getSnapshot(), lines }, { lines: true });
  },
  add(line: CartLine) {
    const current = getSnapshot().lines;
    const existing = current.find((l) => l.variantId === line.variantId);
    const lines = existing
      ? current.map((l) =>
          l.variantId === line.variantId ? { ...l, quantity: l.quantity + line.quantity } : l,
        )
      : [...current, line];
    commit({ ...getSnapshot(), lines }, { lines: true });
  },
  setQuantity(lineId: number, quantity: number) {
    const current = getSnapshot().lines;
    const lines =
      quantity <= 0
        ? current.filter((l) => l.id !== lineId)
        : current.map((l) => (l.id === lineId ? { ...l, quantity } : l));
    commit({ ...getSnapshot(), lines }, { lines: true });
  },
  clear() {
    commit({ ...getSnapshot(), lines: [] }, { lines: true });
  },
  /** Reconciles a server-authoritative cart (after add/update/merge). */
  replace(lines: CartLine[]) {
    cartStore.set(lines);
  },
};

export const wishlistStore = {
  /**
   * Stars or unstars a product, keeping its snapshot so the list can be drawn
   * without another fetch. Returns the resulting membership for the caller to
   * report in a toast.
   */
  toggle(product: WishlistItem): boolean {
    const current = getSnapshot();
    const has = current.wishlist.includes(product.id);

    if (has) {
      const items = { ...current.wishlistItems };
      delete items[product.id];
      commit(
        {
          ...current,
          wishlist: current.wishlist.filter((id) => id !== product.id),
          wishlistItems: items,
        },
        { wishlist: true, wishlistItems: true },
      );
      return false;
    }

    commit(
      {
        ...current,
        wishlist: [product.id, ...current.wishlist],
        wishlistItems: { ...current.wishlistItems, [product.id]: product },
      },
      { wishlist: true, wishlistItems: true },
    );
    return true;
  },
  /** Adopts the account's saved list, which arrives with full product data. */
  replace(products: WishlistItem[]) {
    const items: Record<number, WishlistItem> = {};
    for (const product of products) items[product.id] = product;
    commit(
      { ...getSnapshot(), wishlist: products.map((p) => p.id), wishlistItems: items },
      { wishlist: true, wishlistItems: true },
    );
  },
  clear() {
    commit({ ...getSnapshot(), wishlist: [], wishlistItems: {} }, { wishlist: true, wishlistItems: true });
  },
};

export const viewedStore = {
  track(product: { id: number; slug: string }) {
    const current = getSnapshot().viewed.filter((p) => p.id !== product.id);
    const viewed = [product, ...current].slice(0, MAX_VIEWED);
    commit({ ...getSnapshot(), viewed }, { viewed: true });
  },
};

export const prefsStore = {
  setDiscount(code: string | null) {
    commit({ ...getSnapshot(), discount: code }, { discount: true });
  },
  setShipping(id: string) {
    commit({ ...getSnapshot(), shipping: id }, { shipping: true });
  },
};

/**
 * Called once the session is known.
 *
 * When signed in, the account's real state wins outright — it is authoritative
 * and it is the same list on every device. The local copy is left alone only for
 * a guest, so signing in doesn't visually empty a bag they just filled.
 */
export function adoptServerState(
  signedIn: boolean,
  cart: CartLine[],
  wishlist: WishlistItem[],
) {
  const current = getSnapshot();
  if (!signedIn) return;

  const items: Record<number, WishlistItem> = {};
  for (const product of wishlist) items[product.id] = product;

  commit(
    {
      ...current,
      lines: cart,
      wishlist: wishlist.map((p) => p.id),
      wishlistItems: items,
    },
    { lines: true, wishlist: true, wishlistItems: true },
  );
}

/**
 * The guest bag as it stood before the session was adopted, for merge-on-sign-in.
 *
 * Captured before `adoptServerState` overwrites `lines`, which is the whole
 * point: once the account's cart replaces the local one, the guest's basket
 * would be unrecoverable.
 */
export function guestCart(): CartLine[] {
  return getSnapshot().lines;
}

/**
 * The guest wishlist (full snapshots, in saved order) as it stood before
 * adoption. Mirrors `guestCart` — the ids are pushed up to the account so a
 * shopper doesn't lose products they starred before signing in.
 */
export function guestWishlist(): WishlistItem[] {
  const current = getSnapshot();
  return current.wishlist
    .map((id) => current.wishlistItems[id])
    .filter((p): p is WishlistItem => !!p);
}
