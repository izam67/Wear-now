import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "../account-nav";
import { AddressBook } from "./address-book";
import { getWishlist, listAddresses, listOrdersForUser } from "@/lib/queries";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Addresses",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Faccount%2Faddresses");

  const [addresses, orders, saved] = [
    await listAddresses(user.id),
    await listOrdersForUser(user.id),
    await getWishlist(user.id),
  ];

  return (
    <div className="container-page py-12 lg:py-20">
      <h1 className="text-3xl sm:text-4xl">Addresses</h1>

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
          <AddressBook userId={user.id} addresses={addresses} />
        </div>
      </div>
    </div>
  );
}
