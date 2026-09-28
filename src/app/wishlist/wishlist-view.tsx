"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductGrid } from "@/components/layout/section";
import { useStore } from "@/components/providers/store-provider";

/**
 * Wishlist, readable without an account.
 *
 * Guests see the list held in this browser; the server-rendered version at
 * `/account/wishlist` shows the account's saved list, which follows them to any
 * device. This page explains the difference rather than hiding it.
 */
export function WishlistView() {
  const { wishlistItems, signedIn, ready } = useStore();

  if (ready && wishlistItems.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong px-6 py-24 text-center">
        <Heart aria-hidden className="mx-auto size-10 text-mist" />
        <p className="mt-6 font-display text-2xl">Nothing saved yet</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-stone">
          Tap the heart on anything you like. If you&rsquo;re signed in, your list follows you to
          every device instead of staying in this browser.
        </p>
        <Link
          href="/new-arrivals"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-pill bg-ink px-7 text-sm font-medium text-paper transition-colors hover:bg-graphite"
        >
          Shop new arrivals
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!signedIn ? (
        <p className="rounded-lg border border-line bg-bone px-5 py-4 text-[0.8125rem] leading-relaxed text-graphite">
          You&rsquo;re browsing as a guest, so these {wishlistItems.length}{" "}
          {wishlistItems.length === 1 ? "piece is" : "pieces are"} saved in this browser only.{" "}
          <Link href="/login?next=%2Fwishlist" className="font-medium text-ink underline underline-offset-4">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/signup?next=%2Fwishlist" className="font-medium text-ink underline underline-offset-4">
            create an account
          </Link>{" "}
          to keep them everywhere.
        </p>
      ) : null}

      <ProductGrid products={wishlistItems} columns={4} />
    </div>
  );
}
