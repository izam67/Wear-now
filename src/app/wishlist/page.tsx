import type { Metadata } from "next";
import { WishlistView } from "./wishlist-view";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Pieces you've saved, ready when you are.",
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <div className="container-page py-12 lg:py-20">
      <h1 className="text-3xl sm:text-4xl">Wishlist</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-stone">
        Save now, decide later. Nothing here expires.
      </p>

      <div className="mt-12">
        <WishlistView />
      </div>
    </div>
  );
}
