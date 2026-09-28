import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/utils";
import { currentUser } from "@/lib/session";
import { getWishlist, listOrdersForUser } from "@/lib/queries";
import { AccountNav } from "./account-nav";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  // Server component on purpose: the order history is per-user data and has no
  // business being serialised into the client bundle.
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Faccount");

  const [orders, saved] = [await listOrdersForUser(user.id), await getWishlist(user.id)];

  return (
    <div className="container-page py-12 lg:py-20">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[0.6875rem] uppercase tracking-[0.22em] text-mist">Your account</p>
          <h1 className="mt-3 text-3xl sm:text-4xl">Hello, {user.firstName}</h1>
          <p className="mt-2 text-sm text-stone">{user.email}</p>
        </div>

        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </header>

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

        <div className="space-y-14">
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Orders placed" value={String(orders.length)} />
            <StatCard label="Pieces saved" value={String(saved.length)} />
            <StatCard
              label="Member since"
              value={String(new Date(user.createdAt).getFullYear())}
            />
          </section>

          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl">Recent orders</h2>
              {orders.length > 0 ? (
                <Link
                  href="/account/orders"
                  className="text-[0.8125rem] text-stone underline underline-offset-4 transition-colors hover:text-ink"
                >
                  View all
                </Link>
              ) : null}
            </div>

            {orders.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-line-strong px-6 py-14 text-center">
                <p className="font-display text-lg">No orders yet</p>
                <p className="mx-auto mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-stone">
                  When you&rsquo;re ready, your orders will appear here with tracking and one-tap
                  reorder.
                </p>
                <Link
                  href="/new-arrivals"
                  className="mt-6 inline-block text-[0.8125rem] font-medium text-ink underline underline-offset-4"
                >
                  Browse new arrivals
                </Link>
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {orders.slice(0, 3).map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/account/orders/${order.orderNumber}`}
                      className="group flex items-center justify-between gap-6 py-5 transition-colors hover:bg-bone"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium tracking-wide">{order.orderNumber}</p>
                        <p className="mt-1 text-[0.8125rem] text-stone">
                          {formatDate(order.createdAt)} ·{" "}
                          {order.items.reduce((n, i) => n + i.quantity, 0)} items
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-6">
                        <span className="hidden text-[0.75rem] uppercase tracking-[0.14em] text-stone sm:inline">
                          {order.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm">{formatMoney(order.total)}</span>
                        <span
                          aria-hidden
                          className="text-mist transition-transform group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bone px-5 py-6">
      <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-mist">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}
