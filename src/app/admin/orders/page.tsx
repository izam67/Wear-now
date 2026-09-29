import type { Metadata } from "next";
import Link from "next/link";
import { listAllOrders } from "@/lib/queries";
import { AdminShell, Panel } from "@/components/admin/admin-shell";
import { formatMoney, formatDateTime, pluralize } from "@/lib/utils";
import { ORDER_STATUS_META } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Admin · Orders",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const orders = await listAllOrders(100);

  return (
    <AdminShell active="Orders">
      <Panel title={`Recent orders · ${orders.length}`}>
        {orders.length === 0 ? (
          <p className="text-[0.8125rem] text-mist">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {orders.map((order) => {
              const meta =
                ORDER_STATUS_META[order.status] ?? { label: order.status, tone: "neutral" as const, blurb: "" };
              return (
                <li key={order.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/account/orders/${order.orderNumber}`}
                      className="font-mono text-[0.8125rem] font-medium underline-offset-4 hover:underline"
                    >
                      #{order.orderNumber}
                    </Link>
                    <p className="truncate text-[0.75rem] text-stone">
                      {order.firstName} {order.lastName} · {order.email}
                    </p>
                    <p className="text-[0.75rem] text-mist">
                      {pluralize(order.items.length, "item")} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[0.875rem] font-medium tabular-nums">{formatMoney(order.total)}</p>
                    <p
                      className={
                        meta.tone === "danger"
                          ? "text-[0.75rem] text-clay"
                          : meta.tone === "success"
                            ? "text-[0.75rem] text-sage"
                            : "text-[0.75rem] text-stone"
                      }
                    >
                      {meta.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </AdminShell>
  );
}