import type { Metadata } from "next";
import Link from "next/link";
import { getAdminStats } from "@/lib/queries";
import { AdminShell, Panel, StatCard } from "@/components/admin/admin-shell";
import { formatMoney, formatDate, pluralize } from "@/lib/utils";
import { ORDER_STATUS_META } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const aov = stats.orders ? stats.revenue / stats.orders : 0;
  const maxDay = Math.max(1, ...stats.series.map((s) => s.revenue));
  const maxCat = Math.max(1, ...stats.byCategory.map((c) => c.count));

  return (
    <AdminShell active="Dashboard">
      <div className="space-y-10">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Revenue" value={formatMoney(stats.revenue)} hint={`${stats.orders} orders`} />
          <StatCard label="Average order" value={formatMoney(Math.round(aov))} />
          <StatCard label="Customers" value={stats.customers.toLocaleString()} />
          <StatCard label="Active products" value={stats.products.toLocaleString()} />
          <StatCard label="Open orders" value={stats.openOrders.toLocaleString()} hint="Awaiting delivery" />
          <StatCard label="Pending reviews" value={stats.pendingReviews.toLocaleString()} hint="Needs moderation" />
          <StatCard label="Low stock items" value={stats.lowStock.length.toLocaleString()} hint="≤ 8 units left" />
          <StatCard label="Categories" value={stats.byCategory.length.toLocaleString()} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Revenue series */}
          <Panel title="Revenue · last 30 days">
            {stats.series.length > 0 ? (
              <div>
                <div className="flex h-32 items-end gap-[3px]">
                  {stats.series.map((s) => (
                    <div
                      key={s.day}
                      title={`${formatDate(s.day)} — ${formatMoney(s.revenue)} (${s.orders} orders)`}
                      className="min-w-0 flex-1 rounded-t-[3px] bg-clay/80 transition-colors hover:bg-clay"
                      style={{ height: `${Math.max(3, Math.round((s.revenue / maxDay) * 100))}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[0.6875rem] text-mist">
                  <span>{stats.series[0] ? formatDate(stats.series[0].day, { month: "short", day: "numeric" }) : ""}</span>
                  <span>{stats.series.at(-1) ? formatDate(stats.series.at(-1)!.day, { month: "short", day: "numeric" }) : ""}</span>
                </div>
              </div>
            ) : (
              <p className="text-[0.8125rem] text-mist">No orders recorded in the last 30 days.</p>
            )}
          </Panel>

          {/* Category split */}
          <Panel title="Catalog by category">
            <ul className="space-y-3">
              {stats.byCategory.map((c) => (
                <li key={c.label}>
                  <div className="flex items-baseline justify-between text-[0.8125rem]">
                    <span className="font-medium">{c.label}</span>
                    <span className="tabular-nums text-stone">
                      {c.value} · {c.count.toLocaleString()} popularity
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-sand">
                    <div
                      className="h-full rounded-pill bg-ink transition-[width] duration-500"
                      style={{ width: `${Math.max(2, Math.round((c.count / maxCat) * 100))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Top products */}
        <Panel title="Top products by units sold">
          <ul className="divide-y divide-line">
            {stats.topProducts.map((p, i) => (
              <li key={p.slug} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-5 shrink-0 text-[0.75rem] tabular-nums text-mist">{i + 1}</span>
                  <Link
                    href={`/product/${p.slug}`}
                    className="truncate text-[0.875rem] font-medium transition-colors hover:underline"
                  >
                    {p.name}
                  </Link>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[0.8125rem] tabular-nums">
                    {pluralize(p.units, "unit")}
                  </p>
                  <p className="text-[0.75rem] tabular-nums text-mist">{formatMoney(Math.round(p.revenue))}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Low stock */}
          <Panel title="Low stock (8 or fewer units)">
            {stats.lowStock.length > 0 ? (
              <ul className="divide-y divide-line">
                {stats.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/product/${p.slug}`}
                      className="min-w-0 truncate text-[0.875rem] font-medium transition-colors hover:underline"
                    >
                      {p.name}
                    </Link>
                    <span
                      className={
                        p.stock === 0
                          ? "shrink-0 text-[0.8125rem] font-medium text-clay"
                          : "shrink-0 text-[0.8125rem] tabular-nums text-stone"
                      }
                    >
                      {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.8125rem] text-mist">Everything is well stocked.</p>
            )}
          </Panel>

          {/* Open orders */}
          <Panel title="Orders in flight">
            <p className="mb-4 text-[0.8125rem] text-stone">
              {stats.openOrders} order{stats.openOrders === 1 ? "" : "s"} currently moving
              through fulfilment.
            </p>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-2.5 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-graphite"
            >
              Manage orders →
            </Link>
            <p className="mt-4 text-[0.75rem] text-mist">{Object.values(ORDER_STATUS_META).length} statuses supported</p>
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}