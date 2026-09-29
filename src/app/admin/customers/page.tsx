import type { Metadata } from "next";
import { listCustomers } from "@/lib/queries";
import { AdminShell, Panel } from "@/components/admin/admin-shell";
import { formatMoney, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin · Customers",
  robots: { index: false, follow: false },
};

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <AdminShell active="Customers">
      <Panel title={`Customers · ${customers.length}`}>
        {customers.length === 0 ? (
          <p className="text-[0.8125rem] text-mist">No customers yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {customers.map((customer) => (
              <li key={customer.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-[0.875rem] font-medium">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="truncate text-[0.75rem] text-stone">{customer.email}</p>
                  <p className="text-[0.75rem] text-mist">Joined {formatDate(customer.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.875rem] font-medium tabular-nums">{formatMoney(Math.round(customer.spend))}</p>
                  <p className="text-[0.75rem] text-stone">{customer.orderCount} orders</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminShell>
  );
}