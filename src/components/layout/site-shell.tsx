"use client";

import { useEffect, useState } from "react";
import { AnnouncementBar } from "./announcement-bar";
import { Header } from "./header";
import { Footer } from "./footer";
import { SearchOverlay } from "./search-overlay";
import { CartDrawer } from "./cart-drawer";
import { MobileTabBar } from "./mobile-tab-bar";
import { ToastProvider } from "@/components/providers/toast-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import { FOOTER_COLUMNS } from "@/lib/constants";
import type { CartLine, Product } from "@/lib/types";

/**
 * The single client boundary for the whole storefront.
 *
 * Everything above this line is server-rendered; this component hydrates once
 * to attach cart, wishlist, search and navigation behaviour. Keeping the island
 * this small is what lets the rest of the site stay static and fast.
 */
export function SiteShell({
  children,
  signedIn,
  serverCart = [],
  serverWishlist = [],
}: {
  children: React.ReactNode;
  signedIn: boolean;
  serverCart?: CartLine[];
  /** Full products so the client can render the wishlist without a fetch. */
  serverWishlist?: Product[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  /* The search overlay listens for this so ⌘K works from anywhere. */
  useEffect(() => {
    const open = () => setSearchOpen(true);
    document.addEventListener("wn:open-search", open);
    return () => document.removeEventListener("wn:open-search", open);
  }, []);

  return (
    <ToastProvider>
      <StoreProvider
        signedIn={signedIn}
        serverCart={serverCart}
        serverWishlist={serverWishlist}
      >
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        <AnnouncementBar />
        <Header signedIn={signedIn} onOpenSearch={() => setSearchOpen(true)} />

        <main id="main" className="min-h-[60vh]">
          {children}
        </main>

        <Footer columns={FOOTER_COLUMNS} />

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <CartDrawer />
        <MobileTabBar onOpenSearch={() => setSearchOpen(true)} />
      </StoreProvider>
    </ToastProvider>
  );
}
