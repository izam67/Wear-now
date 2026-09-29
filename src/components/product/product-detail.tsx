"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, Truck } from "lucide-react";
import { IMG } from "@/lib/images";
import { cn, discountPercent } from "@/lib/utils";
import type { Product, Variant } from "@/lib/types";
import { Price, SaleBadge } from "./product-card";
import { Stars } from "@/components/ui/stars";
import { WishlistButton } from "./wishlist-button";
import { useStore } from "@/components/providers/store-provider";
import { Spinner } from "@/components/ui/button";

/**
 * Product page body: gallery, colour/size selection wired to real variants and
 * stock, quantity, and add-to-bag. The add correctly labels the line with the
 * shopper's chosen options rather than the product's default variant.
 */
export function ProductDetail({ product, variants }: { product: Product; variants: Variant[] }) {
  const { addToCart, trackView } = useStore();
  const [index, setIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const colors = product.colors;
  const hasVariants = variants.length > 0;

  /* Start from the quick-add default when there is one, otherwise the single
   * option, otherwise leave both unset until the shopper chooses. */
  const [draft] = useState(() => {
    const dv = product.defaultVariant;
    if (dv) return { color: dv.color, size: dv.size };
    if (colors.length === 1) return { color: colors[0]?.name ?? "", size: product.sizes[0] ?? "" };
    return { color: "", size: "" };
  });
  const [color, setColor] = useState(draft.color);
  const [size, setSize] = useState(draft.size);

  useEffect(() => {
    trackView({ id: product.id, slug: product.slug });
  }, [product.id, product.slug, trackView]);

  const sizesFor = (c: string): string[] => {
    if (!hasVariants) return product.sizes;
    const found = new Set(
      variants.filter((v) => v.color.toLowerCase() === c.toLowerCase()).map((v) => v.size),
    );
    const ordered = product.sizes.filter((s) => found.has(s));
    return [...ordered, ...[...found].filter((s) => !ordered.includes(s))];
  };

  const sizes = color ? sizesFor(color) : product.sizes;
  const variant =
    color && size
      ? (variants.find(
          (v) => v.color.toLowerCase() === color.toLowerCase() && v.size === size,
        ) ?? null)
      : null;
  const stock = hasVariants ? (variant?.stock ?? 0) : product.stock;
  const needsColor = !color;
  const needsSize = !!color && !size;
  const soldOut = !!color && !!size && stock === 0;
  const lowStock = stock > 0 && stock <= 5;
  const canAdd = !needsColor && !needsSize && stock > 0;

  const percent = discountPercent(product.price, product.compareAt);
  const images = product.images;
  const mainImage = images[index] ?? images[0] ?? "";

  const onColor = (name: string) => {
    if (name === color) return;
    setColor(name);
    setQuantity(1);
    const next = sizesFor(name);
    const preferred = product.defaultVariant?.color.toLowerCase() === name.toLowerCase()
      ? product.defaultVariant?.size
      : "";
    setSize(
      preferred && next.includes(preferred)
        ? preferred
        : next.length === 1
          ? next[0] ?? ""
          : "",
    );
  };

  const handleAdd = async () => {
    if (!canAdd || state === "loading") return;
    setState("loading");
    await addToCart({
      product,
      variantId: variant ? variant.id : -1,
      color: color ?? "",
      size: size ?? "",
      quantity,
    });
    setState("done");
    setTimeout(() => setState("idle"), 1500);
  };

  return (
    <div className="container-page py-8 md:py-12">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand">
            {mainImage ? (
              <Image
                key={index}
                src={IMG.zoom(mainImage)}
                alt={`${product.name} — ${images.length > 1 ? `photo ${index + 1} of ${images.length}` : "photo"}`}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
                className="animate-fade-in object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-mist">
                <span className="eyebrow">No image</span>
              </div>
            )}

            {images.length > 1 ? (
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIndex((index - 1 + images.length) % images.length)}
                  aria-label="Previous photo"
                  className="grid size-10 place-items-center rounded-full bg-paper/90 text-ink backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
                >
                  <ChevronLeft size={18} aria-hidden />
                </button>
                <span className="rounded-pill bg-ink/70 px-3 py-1 text-[0.6875rem] tabular-nums text-paper backdrop-blur-sm">
                  {index + 1} / {images.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIndex((index + 1) % images.length)}
                  aria-label="Next photo"
                  className="grid size-10 place-items-center rounded-full bg-paper/90 text-ink backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
                >
                  <ChevronRight size={18} aria-hidden />
                </button>
              </div>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {images.map((image, i) => (
                <button
                  key={image + i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`View photo ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "relative aspect-[3/4] overflow-hidden rounded-lg bg-sand transition-[outline-color,transform]",
                    i === index
                      ? "outline outline-2 -outline-offset-2 outline-ink"
                      : "outline outline-1 -outline-offset-1 outline-line hover:outline-ink/40",
                  )}
                >
                  <Image src={IMG.thumb(image)} alt="" aria-hidden fill sizes="20vw" className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Info */}
        <div>
          <nav aria-label="Breadcrumb" className="text-[0.75rem] text-stone">
            <Link
              href={`/category/${product.categorySlug}`}
              className="transition-colors hover:text-ink hover:underline"
            >
              {product.categoryName}
            </Link>
            <span className="mx-2" aria-hidden>/</span>
            <span>{product.name}</span>
          </nav>

          <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          {product.subtitle ? (
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone">{product.subtitle}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Price price={product.price} compareAt={product.compareAt} size="lg" />
            {percent > 0 ? <SaleBadge percent={percent} /> : null}
          </div>

          <a
            href="#reviews"
            className="mt-3 inline-flex items-center gap-2 text-[0.8125rem] text-graphite transition-colors hover:text-ink"
          >
            <Stars rating={product.rating} size={13} count={product.reviewCount} showValue />
          </a>

          <hr className="my-7 border-line" />

          {/* Colour */}
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-[0.8125rem] font-medium text-graphite">Colour</p>
              <p className="text-[0.8125rem] capitalize text-stone">{color ? color : "Select"}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onColor(c.name)}
                  aria-label={`Colour ${c.name}`}
                  aria-pressed={color.toLowerCase() === c.name.toLowerCase()}
                  className={cn(
                    "grid size-11 place-items-center rounded-full border transition-colors",
                    color.toLowerCase() === c.name.toLowerCase()
                      ? "border-ink ring-2 ring-ink/25 ring-offset-2 ring-offset-paper"
                      : "border-line hover:border-ink/50",
                  )}
                >
                  <span className="size-8 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          {hasVariants ? (
            <div className="mt-7">
              <div className="flex items-baseline justify-between">
                <p className="text-[0.8125rem] font-medium text-graphite">Size</p>
                <Link
                  href="/help/size-guide"
                  className="text-[0.75rem] text-stone underline underline-offset-4 transition-colors hover:text-ink"
                >
                  Size guide
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.length > 0 ? (
                  sizes.map((s) => {
                    const v = variants.find(
                      (x) => x.color.toLowerCase() === color.toLowerCase() && x.size === s,
                    );
                    const soldOutSize = v ? v.stock === 0 : false;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSize(s);
                          setQuantity(1);
                        }}
                        disabled={soldOutSize}
                        aria-pressed={size === s}
                        aria-disabled={soldOutSize}
                        className={cn(
                          "min-w-12 rounded-[10px] border px-3 py-2.5 text-[0.8125rem] transition-colors",
                          size === s
                            ? "border-ink bg-ink text-paper"
                            : soldOutSize
                              ? "cursor-not-allowed border-line text-mist line-through"
                              : "border-line hover:border-ink hover:text-ink",
                        )}
                      >
                        {s}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-[0.8125rem] text-mist">No sizes available for this colour.</p>
                )}
              </div>
            </div>
          ) : null}

          {/* Quantity + add */}
          <div className="mt-8 flex flex-wrap items-stretch gap-3">
            <div className="flex items-center rounded-pill border border-line">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="grid size-14 place-items-center text-stone transition-colors hover:text-ink disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus size={16} aria-hidden />
              </button>
              <span aria-live="polite" className="w-8 text-center text-[0.9375rem] tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                aria-label="Increase quantity"
                className="grid size-14 place-items-center text-stone transition-colors hover:text-ink disabled:opacity-40"
                disabled={quantity >= 10}
              >
                <Plus size={16} aria-hidden />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd || state === "loading"}
              aria-busy={state === "loading"}
              className="inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-pill bg-ink text-[0.9375rem] font-medium text-paper transition-[background-color,transform] duration-300 hover:bg-graphite active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
            >
              {state === "loading" ? (
                <Spinner />
              ) : state === "done" ? (
                <Check size={17} aria-hidden />
              ) : null}
              {state === "done"
                ? "Added to bag"
                : soldOut
                  ? "Sold out"
                  : needsColor
                    ? "Select a colour"
                    : needsSize
                      ? "Select a size"
                      : `${product.stock === 0 ? "Sold out" : "Add to bag"}`}
            </button>

            <div className="ml-1 self-center">
              <WishlistButton product={product} size="lg" showLabel={false} />
            </div>
          </div>

          {lowStock ? (
            <p className="mt-3 text-[0.8125rem] uppercase tracking-[0.12em] text-clay">
              Only {stock} left in this colour and size
            </p>
          ) : null}

          {product.stock === 0 && !hasVariants ? (
            <p className="mt-3 text-[0.8125rem] text-clay">This piece is currently sold out.</p>
          ) : null}

          {/* Perks */}
          <div className="mt-8 flex flex-col gap-3 rounded-xl border border-line bg-sand/50 p-5 text-[0.8125rem] text-graphite sm:flex-row sm:items-center sm:gap-8">
            <p className="flex items-center gap-2.5">
              <Truck size={17} className="shrink-0 text-stone" aria-hidden />
              Free delivery over K150
            </p>
            <p className="flex items-center gap-2.5">
              <RotateCcw size={17} className="shrink-0 text-stone" aria-hidden />
              30-day free returns
            </p>
          </div>

          {/* Accordions */}
          <div className="mt-8 divide-y divide-line border-y border-line">
            <Detail heading="Description">
              <p className="max-w-2xl text-[0.875rem] leading-relaxed text-stone">
                {product.description}
              </p>
              {product.materials ? (
                <p className="mt-3 text-[0.8125rem] text-graphite">
                  <span className="font-medium">Materials:</span> {product.materials}
                </p>
              ) : null}
            </Detail>
            <Detail heading="Details & care">
              {product.details.length > 0 ? (
                <ul className="space-y-1.5 text-[0.8125rem] leading-relaxed text-stone">
                  {product.details.map((d) => (
                    <li key={d} className="flex gap-2">
                      <span aria-hidden className="text-clay">·</span>
                      {d}
                    </li>
                  ))}
                </ul>
              ) : null}
              {product.care ? (
                <p className="mt-3 text-[0.8125rem] text-graphite">
                  <span className="font-medium">Care:</span> {product.care}
                </p>
              ) : null}
              {product.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/search?q=${encodeURIComponent(tag)}`}
                      className="rounded-pill border border-line px-3 py-1 text-[0.75rem] text-graphite transition-colors hover:border-ink hover:text-ink"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              ) : null}
            </Detail>
            <Detail heading="Shipping & returns">
              <p className="max-w-2xl text-[0.875rem] leading-relaxed text-stone">
                Standard delivery takes 4–6 business days and is free on orders over
                K150. Express and next-day options are available at checkout. Unworn
                pieces can be returned within 30 days for a full refund.
              </p>
            </Detail>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <details className="group py-5">
      <summary className="flex cursor-pointer list-none select-none items-center justify-between gap-4 text-[0.9375rem] font-medium [&::-webkit-details-marker]:hidden">
        {heading}
        <span
          aria-hidden
          className="flex items-center gap-3 text-[0.75rem] tabular-nums text-stone"
        >
          <span className="transition-transform duration-300 group-open:rotate-180">+</span>
        </span>
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}