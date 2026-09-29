import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Reviews", href: "/admin/reviews" },
] as const;

/**
 * Guarded wrapper for the admin area. `requireAdmin` redirects non-admins to
 * sign-in / home, so nothing below this component is ever rendered without an
 * admin session.
 */
export async function AdminShell({ children, active }: { children: React.ReactNode; active?: string }) {
  await requireAdmin();

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-8">
        <p className="eyebrow text-clay">Store admin</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Admin</h1>
      </header>

      <nav aria-label="Admin sections" className="mb-10 flex flex-wrap gap-2">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active === n.label ? "page" : undefined}
            className={cn(
              "rounded-pill border px-4 py-2 text-[0.8125rem] font-medium transition-colors",
              active === n.label
                ? "border-ink bg-ink text-paper"
                : "border-line text-graphite hover:border-ink hover:text-ink",
            )}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line p-5">
      <p className="text-[0.75rem] uppercase tracking-[0.08em] text-stone">{label}</p>
      <p className="mt-2 font-display text-2xl tabular-nums sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-[0.75rem] text-mist">{hint}</p> : null}
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line">
      <h2 className="border-b border-line px-5 py-4 font-display text-lg">{title}</h2>
      <div className="p-5">{children}</div>
    </section>
  );
}