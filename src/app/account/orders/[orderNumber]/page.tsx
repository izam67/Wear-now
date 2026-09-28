import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { AccountNav } from "../../account-nav";
import { getOrderForUser, getWishlist, listOrdersForUser } from "@/lib/queries";
import { currentUser } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/utils";
import { IMG } from "@/lib/images";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/account/orders")}`);

  const [{ orderNumber }, { placed }, orders, saved] = await Promise.all([
    params,
    searchParams,
    Promise.resolve(listOrdersForUser(user.id)),
    Promise.resolve(getWishlist(user.id)),
  ]);

  // Scoped to the signed-in user, so another customer's order number 404s
  // rather than leaking the fact that it exists.
  const order = await getOrderForUser(orderNumber, user.id);
  if (!order) notFound();

  return (
    <div className="container-page py-12 lg:py-20">
      {placed === "1" ? <ConfirmationBanner orderNumber={order.orderNumber} /> : null}
      <Link
        href="/account/orders"
        className="text-[0.8125rem] text-stone underline underline-offset-4 hover:text-ink"
      >
        ← All orders
      </Link>
      <h1 className="mt-4 text-3xl sm:text-4xl">{order.orderNumber}</h1>
      <p className="mt-2 text-sm text-stone">
        Placed {formatDate(order.createdAt)} · {order.status.replace(/_/g, " ")}
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

        <div className="space-y-10">
          <section>
            <h2 className="text-lg">Items</h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-4">
                  {item.image ? (
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-sand">
                      <Image
                        src={IMG.lineItem(item.image)}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="text-sm underline-offset-4 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-[0.8125rem] text-stone">
                      {[item.color, item.size].filter(Boolean).join(" · ")} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-[0.8125rem]">
                    {formatMoney(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-10 sm:grid-cols-2">
            {order.address ? (
              <div>
                <h2 className="text-lg">Shipping to</h2>
                <address className="mt-3 text-[0.8125rem] not-italic leading-relaxed text-graphite">
                  {order.address.firstName} {order.address.lastName}
                  <br />
                  {order.address.line1}
                  {order.address.line2 ? (
                    <>
                      <br />
                      {order.address.line2}
                    </>
                  ) : null}
                  <br />
                  {order.address.city}, {order.address.region} {order.address.postalCode}
                  <br />
                  {order.address.country}
                </address>
              </div>
            ) : null}

            <div>
              <h2 className="text-lg">Summary</h2>
              <dl className="mt-3 space-y-2 text-[0.8125rem]">
                <Row label="Subtotal" value={formatMoney(order.subtotal)} />
                {order.discount > 0 ? (
                  <Row label={`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`} value={`- ${formatMoney(order.discount)}`} />
                ) : null}
                <Row label="Shipping" value={formatMoney(order.shipping)} />
                <Row label="Tax" value={formatMoney(order.tax)} />
                <div className="rule my-3" />
                <Row label="Total" value={formatMoney(order.total)} strong />
                {order.paymentLast4 ? (
                  <Row label="Paid with" value={`Card ending ${order.paymentLast4}`} />
                ) : null}
              </dl>
            </div>
          </section>

          {order.trackingNumber ? (
            <section>
              <h2 className="text-lg">Tracking</h2>
              <p className="mt-3 text-[0.8125rem] text-graphite">
                {order.carrier ?? "Carrier"} · {order.trackingNumber}
              </p>
              {order.trackingUrl ? (
                <Link
                  href={order.trackingUrl}
                  rel="noopener noreferrer nofollow"
                  className="mt-3 inline-block text-[0.8125rem] font-medium text-ink underline underline-offset-4"
                >
                  Track this parcel
                </Link>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-stone">{label}</dt>
      <dd className={strong ? "font-display text-lg" : "tabular-nums"}>{value}</dd>
    </div>
  );
}

function ConfirmationBanner({ orderNumber }: { orderNumber: string }) {
  return (
    <div
      role="status"
      className="mb-10 rounded-lg border border-sage/30 bg-sage-soft px-6 py-5"
    >
      <p className="font-display text-lg text-sage">Thank you — your order is in.</p>
      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-graphite">
        We&rsquo;ve emailed a confirmation for {orderNumber}. You&rsquo;ll get tracking as soon as it
        leaves the workshop.
      </p>
    </div>
  );
}
