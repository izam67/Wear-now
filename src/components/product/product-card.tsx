import Image from "next/image";
import { cn, discountPercent, formatMoney } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { IMG } from "@/lib/images";
import { WishlistButton } from "./wishlist-button";
import { AddToCartButton } from "./add-to-cart-button";

/* ------------------------------------------------------------------ *
 * Price — handles sale pricing and the "no discount" case cleanly.
 * ------------------------------------------------------------------ */

export function Price({
  price,
  compareAt,
  size = "md",
  className,
}: {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const onSale = !!compareAt && compareAt > price;
  const percent = onSale ? discountPercent(price, compareAt!) : 0;

  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-sans tabular-nums",
          size === "sm" && "text-[0.8125rem]",
          size === "md" && "text-sm",
          size === "lg" && "text-lg",
          onSale ? "text-clay" : "text-ink",
        )}
      >
        {formatMoney(price)}
      </span>
      {onSale ? (
        <>
          <span className="font-sans text-[0.8125rem] text-mist line-through tabular-nums">
            {formatMoney(compareAt!)}
          </span>
          <span className="sr-only">, reduced from {formatMoney(compareAt!)}</span>
          <span className="sr-only">, {percent} percent off</span>
        </>
      ) : null}
    </p>
  );
}

export function SaleBadge({ percent, className }: { percent: number; className?: string }) {
  if (percent <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full bg-paper/92 px-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-clay backdrop-blur-sm",
        className,
      )}
    >
      −{percent}%
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Product card
 *
 * The workhorse of the site. Keeps the image area a fixed aspect ratio so
 * grids never reflow as images load, and surfaces wishlist + quick-add without
 * ever covering the product name.
 * ------------------------------------------------------------------ */

export function ProductCard({
  product,
  priority = false,
  showQuickAdd = true,
  className,
  sizes = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw",
}: {
  product: Product;
  priority?: boolean;
  showQuickAdd?: boolean;
  className?: string;
  sizes?: string;
}) {
  const image = product.images[0];
  const hoverImage = product.images[1];
  const percent = discountPercent(product.price, product.compareAt);
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <article className={cn("group/card relative", className)}>
      <div className="zoom-frame relative aspect-[3/4] overflow-hidden rounded-lg bg-sand">
        {image ? (
          <>
            <Image
              src={IMG.card(image)}
              alt={product.name}
              fill
              sizes={sizes}
              priority={priority}
              className={cn(
                "object-cover transition-opacity duration-500",
                hoverImage && "group-hover/card:opacity-0",
              )}
            />
            {hoverImage ? (
              <Image
                src={IMG.card(hoverImage)}
                alt=""
                aria-hidden
                fill
                sizes={sizes}
                className="object-cover opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
              />
            ) : null}
          </>
        ) : (
          <div className="flex size-full items-center justify-center text-mist">
            <span className="eyebrow">No image</span>
          </div>
        )}

        {/* Flags — top left, stacked, never interactive. */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start gap-1.5">
          {percent > 0 ? <SaleBadge percent={percent} /> : null}
          {product.isNew ? (
            <span className="inline-flex h-6 items-center rounded-full bg-ink/90 px-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-paper backdrop-blur-sm">
              New
            </span>
          ) : null}
        </div>

        {/* Wishlist — top right. Always reachable, never inside a link. */}
        <div className="absolute right-3 top-3">
          <WishlistButton
            product={product}
            tone="on-image"
            className="opacity-100 md:opacity-0 md:translate-y-1 md:transition-[opacity,transform] md:duration-300 md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
          />
        </div>

        {outOfStock ? (
          <div className="absolute inset-0 flex items-end justify-center bg-paper/55 pb-6 backdrop-blur-[1px]">
            <span className="rounded-full bg-paper px-4 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink shadow-sm">
              Sold out
            </span>
          </div>
        ) : showQuickAdd ? (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:pointer-events-auto group-hover/card:translate-y-0 group-hover/card:opacity-100 md:group-focus-within/card:pointer-events-auto md:group-focus-within/card:translate-y-0 md:group-focus-within/card:opacity-100">
            <AddToCartButton
              product={product}
              variant="quick"
              className="w-full shadow-[0_10px_30px_-12px_rgba(18,17,16,0.5)]"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[0.9375rem] leading-snug font-normal">
            <a
              href={`/product/${product.slug}`}
              className="after:absolute after:inset-0 after:content-[''] hover:underline hover:underline-offset-4"
            >
              {product.name}
            </a>
          </h3>
          {lowStock ? (
            <span className="mt-0.5 shrink-0 text-[0.6875rem] uppercase tracking-[0.12em] text-clay">
              {product.stock} left
            </span>
          ) : null}
        </div>
        {product.subtitle ? (
          <p className="clamp-2 text-[0.8125rem] leading-relaxed text-stone">{product.subtitle}</p>
        ) : null}
        <Price price={product.price} compareAt={product.compareAt} size="sm" className="mt-0.5" />
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * Skeleton — matches the card's geometry so grids don't jump on load.
 * ------------------------------------------------------------------ */

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)} aria-hidden>
      <div className="skeleton aspect-[3/4] w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-4 w-20 rounded" />
      </div>
    </div>
  );
}
