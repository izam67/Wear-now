"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useStore } from "@/components/providers/store-provider";
import { Spinner } from "@/components/ui/button";

/**
 * Quick add on a card, and the primary CTA on a product page.
 *
 * The card variant commits immediately using the product's default in-stock
 * variant — shoppers refine the choice on the product page, so a card click
 * should never dead-end on a "pick a size" prompt.
 */
export function AddToCartButton({
  product,
  variant = "quick",
  quantity = 1,
  overrideVariantId,
  disabled,
  className,
  children,
  onAdded,
}: {
  product: Product;
  variant?: "quick" | "full";
  quantity?: number;
  overrideVariantId?: number | null;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onAdded?: () => void;
}) {
  const { addToCart } = useStore();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const outOfStock = product.stock === 0;
  const inactive = disabled || outOfStock;

  const handle = async () => {
    if (inactive || state === "loading") return;

    // On the product page the shopper's explicit choice wins; on a card we fall
    // back to the default in-stock variant.
    const chosenId = overrideVariantId ?? product.defaultVariant?.id ?? null;
    const dv = product.defaultVariant;

    if (!chosenId) {
      setState("loading");
      await addToCart({
        product,
        variantId: -1,
        color: dv?.color ?? "",
        size: dv?.size ?? "",
        quantity,
      });
      setState("done");
      setTimeout(() => setState("idle"), 1400);
      return;
    }

    setState("loading");
    await addToCart({
      product,
      variantId: chosenId,
      color: dv?.color ?? "",
      size: dv?.size ?? "",
      quantity,
    });
    onAdded?.();
    setState("done");
    setTimeout(() => setState("idle"), 1500);
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handle}
        disabled={inactive}
        aria-busy={state === "loading"}
        className={cn(
          "inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-pill bg-ink text-[0.9375rem] font-medium text-paper transition-[background-color,transform] duration-300 hover:bg-graphite active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45",
          className,
        )}
      >
        {state === "loading" ? (
          <Spinner />
        ) : state === "done" ? (
          <Check size={17} aria-hidden />
        ) : null}
        {state === "done"
          ? "Added to bag"
          : outOfStock
            ? "Sold out"
            : disabled
              ? "Select a size"
              : (children ?? "Add to bag")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={inactive}
      aria-busy={state === "loading"}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-pill px-5 text-[0.8125rem] font-medium transition-[background-color,color,transform] duration-300 active:scale-[0.98] disabled:pointer-events-none",
        outOfStock
          ? "bg-paper/70 text-mist"
          : state === "done"
            ? "bg-sage text-paper"
            : "bg-paper/92 text-ink backdrop-blur-sm hover:bg-paper",
        className,
      )}
    >
      {state === "loading" ? (
        <Spinner className="size-3.5" />
      ) : state === "done" ? (
        <Check size={15} aria-hidden />
      ) : (
        <Plus size={15} aria-hidden />
      )}
      <span>{outOfStock ? "Sold out" : state === "done" ? "Added" : "Quick add"}</span>
    </button>
  );
}
