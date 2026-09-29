import type { Metadata } from "next";
import Link from "next/link";
import { queryProducts } from "@/lib/queries";
import { AdminShell, Panel } from "@/components/admin/admin-shell";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin · Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const { products, total } = await queryProducts({ sort: "popular", perPage: 200 });

  return (
    <AdminShell active="Products">
      <Panel title={`Active products · ${total}`}>
        <ul className="divide-y divide-line">
          {products.map((product) => (
            <li key={product.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3.5 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${product.slug}`}
                  className="text-[0.875rem] font-medium underline-offset-4 hover:underline"
                >
                  {product.name}
                </Link>
                <p className="text-[0.75rem] text-stone">
                  {product.categoryName} ·{" "}
                  <Link href={`/category/${product.categorySlug}`} className="underline underline-offset-4 hover:text-ink">
                    {product.categorySlug}
                  </Link>
                </p>
              </div>

              <span className="w-16 shrink-0 text-right text-[0.8125rem] tabular-nums">
                {formatMoney(product.price)}
              </span>

              <span
                className={
                  product.stock === 0
                    ? "w-20 shrink-0 text-right text-[0.8125rem] font-medium text-clay"
                    : product.stock <= 8
                      ? "w-20 shrink-0 text-right text-[0.8125rem] font-medium text-stone"
                      : "w-20 shrink-0 text-right text-[0.8125rem] tabular-nums text-stone"
                }
              >
                {product.stock === 0 ? "Out" : `${product.stock}`}
              </span>

              <span className="w-24 shrink-0 text-right text-[0.75rem] tabular-nums text-mist">
                pop {product.popularity}
              </span>
            </li>
          ))}
        </ul>
        {total > products.length ? (
          <p className="mt-4 text-[0.75rem] text-mist">
            Showing the top {products.length} by popularity of {total}.
          </p>
        ) : null}
      </Panel>
    </AdminShell>
  );
}