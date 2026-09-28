import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "../account-nav";
import { getWishlist, listOrdersForUser } from "@/lib/queries";
import { currentUser } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Faccount%2Forders");

  const orders = listOrdersForUser(user.id);
  const saved = getWishlist(user.id);

  return (
    <div className="container-page py-12 lg:py-20">
      <h1 className="text-3xl sm:text-4xl">Orders</h1>
      <p className="mt-2 text-sm text-stone">
        {orders.length === 0
          ? "You haven't placed an order yet."
          : `${orders.length} ${orders.length === 1 ? "order" : "orders"}, most recent first.`}
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

        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-strong px-6 py-16 text-center">
              <p className="font-display text-lg">Nothing here yet</p>
              <p className="mx-auto mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-stone">
                Your first order will show up here with tracking, delivery details, and the option
                to reorder.
              </p>
              <a
                href="/new-arrivals"
                className="mt-6 inline-block text-[0.8125rem] font-medium text-ink underline underline-offset-4"
              >
                Browse new arrivals
              </a>
            </div>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="rounded-lg border border-line">
                <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-bone px-5 py-4">
                  <div>
                    <p className="text-sm font-medium tracking-wide">{order.orderNumber}</p>
                    <p className="mt-0.5 text-[0.8125rem] text-stone">
                      Placed {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-5">
                    <StatusPill status={order.status} />
                    <span className="text-sm">{formatMoney(order.total)}</span>
                  </div>
                </header>

                <ul className="divide-y divide-line">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <a
                          href={`/product/${item.productSlug}`}
                          className="text-sm underline-offset-4 hover:underline"
                        >
                          {item.name}
                        </a>
                        <p className="mt-0.5 text-[0.8125rem] text-stone">
                          {[item.color, item.size].filter(Boolean).join(" · ")} · Qty{" "}
                          {item.quantity}
                        </p>
                      </div>
                      <span className="text-[0.8125rem] text-stone">
                        {formatMoney(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <footer className="flex justify-end border-t border-line px-5 py-4">
                  <a
                    href={`/account/orders/${order.orderNumber}`}
                    className="text-[0.8125rem] font-medium text-ink underline underline-offset-4"
                  >
                    View details
                  </a>
                </footer>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const positive = status === "delivered" || status === "shipped";
  return (
    <span
      className={
        positive
          ? "rounded-full bg-sage-soft px-3 py-1 text-[0.6875rem] uppercase tracking-[0.14em] text-sage"
          : "rounded-full bg-sand px-3 py-1 text-[0.6875rem] uppercase tracking-[0.14em] text-stone"
      }
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
