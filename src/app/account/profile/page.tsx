import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "../account-nav";
import { ProfileForm } from "./profile-form";
import { getWishlist, listOrdersForUser } from "@/lib/queries";
import { currentUser } from "@/lib/session";
import { all } from "@/lib/db";

export const metadata: Metadata = {
  title: "Account details",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Faccount%2Fprofile");

  const orders = await listOrdersForUser(user.id);
  const saved = await getWishlist(user.id);
  const phone =
    (await all<{ phone: string | null }>("SELECT phone FROM users WHERE id = ?", user.id))[0]?.phone ?? null;

  return (
    <div className="container-page py-12 lg:py-20">
      <h1 className="text-3xl sm:text-4xl">Account details</h1>

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
          <ProfileForm
            userId={user.id}
            firstName={user.firstName}
            lastName={user.lastName}
            email={user.email}
            phone={phone}
          />
        </div>
      </div>
    </div>
  );
}
