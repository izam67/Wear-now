import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { IMG } from "@/lib/images";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";

/**
 * The homepage and category pages share one section rhythm, so it lives here
 * rather than being re-invented per page.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  bleed = false,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  return (
    <section id={id} className={cn("py-16 md:py-24", className)}>
      <div className={cn(bleed ? "container-wide" : "container-page")}>
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-12">
          <div className="max-w-2xl">
            {eyebrow ? <p className="eyebrow text-clay">{eyebrow}</p> : null}
            <h2 className="mt-2 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-stone">{description}</p>
            ) : null}
          </div>
          {action ? (
            <Link
              href={action.href}
              className="group/link inline-flex items-center gap-2 border-b border-ink pb-1 text-[0.8125rem] font-medium transition-colors hover:border-clay hover:text-clay"
            >
              {action.label}
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover/link:translate-x-1"
              >
                →
              </span>
            </Link>
          ) : null}
        </header>
        {children}
      </div>
    </section>
  );
}

/** Responsive product grid. `priority` is passed for above-the-fold rows only. */
export function ProductGrid({
  products,
  priorityCount = 0,
  columns = 4,
  className,
}: {
  products: Product[];
  priorityCount?: number;
  columns?: 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:gap-y-12",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        className,
      )}
    >
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={i < priorityCount}
          sizes={
            columns === 4
              ? "(min-width: 1024px) 24vw, (min-width: 640px) 30vw, 46vw"
              : "(min-width: 1024px) 32vw, (min-width: 640px) 32vw, 46vw"
          }
        />
      ))}
    </div>
  );
}

/** Wide editorial banner used to break up long product runs. */
export function EditorialBanner({
  eyebrow,
  title,
  body,
  cta,
  image,
  imageAlt,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  image: string;
  imageAlt: string;
  align?: "left" | "right";
}) {
  return (
    <div className="grid items-stretch gap-0 overflow-hidden rounded-xl bg-sand md:grid-cols-2">
      <div
        className={cn(
          "relative min-h-72 md:min-h-96",
          align === "right" && "md:order-2",
        )}
      >
        <Image
          src={IMG.hero(image)}
          alt={imageAlt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div
        className={cn(
          "flex flex-col justify-center p-8 sm:p-12 lg:p-16",
          align === "right" && "md:order-1",
        )}
      >
        <p className="eyebrow text-clay">{eyebrow}</p>
        <h3 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{title}</h3>
        <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-stone">{body}</p>
        <Link
          href={cta.href}
          className="mt-8 inline-flex w-fit items-center gap-2 rounded-pill bg-ink px-6 py-3 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-graphite"
        >
          {cta.label}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
