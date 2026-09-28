import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "../account-nav";
import { ProductGrid } from "@/components/layout/section";
import { getWishlist, listOrdersForUser } from "@/lib/queries";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

export default async function AccountWishlistPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Faccount%2Fwishlist");

  const saved = getWishlist(user.id);
  const orders = listOrdersForUser(user.id);

  return (
    <div className="container-page py-12 lg:py-20">
      <h1 className="text-3xl sm:text-4xl">Wishlist</h1>
      <p className="mt-2 text-sm text-stone">
        {saved.length === 0
          ? "Pieces you save are kept here, on every device you sign in from."
          : `${saved.length} ${saved.length === 1 ? "piece" : "pieces"} saved.`}
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[15rem_1fr]">
        <AccountNav
          items={[
            { href: "/account", label: "Overview" },
            { href: "/account/orders", label: "Orders", count: orders.length || undefined },
            { href: "/account/wishlist", label: "Wishlist", count: saved.length || undefined },
            { href: "/account/profile", label: "Details" },
            { href: "/account/addresses", label: "Addresses" },
          ]}
        />

        <div>
          {saved.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-strong px-6 py-16 text-center">
              <p className="font-display text-lg">Nothing saved yet</p>
              <p className="mx-auto mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-stone">
                Tap the heart on anything you like. Because you&rsquo;re signed in, your list
                follows you rather than living in this browser.
              </p>
              <a
                href="/new-arrivals"
                className="mt-6 inline-block text-[0.8125rem] font-medium text-ink underline underline-offset-4"
              >
                Browse new arrivals
              </a>
            </div>
          ) : (
            <ProductGrid products={saved} columns={3} />
          )}
        </div>
      </div>
    </div>
  );
}
