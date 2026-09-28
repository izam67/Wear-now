"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/components/providers/store-provider";
import type { Product } from "@/lib/types";

export function WishlistButton({
  product,
  tone = "default",
  size = "md",
  showLabel = false,
  className,
}: {
  /** The whole product, so a guest's saved list can be drawn without a fetch. */
  product: Product;
  tone?: "default" | "on-image";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  const { id: productId, name } = product;
  const { isWishlisted, toggleWishlist } = useStore();
  const [popping, setPopping] = useState(false);
  const active = isWishlisted(productId);

  const handleClick = async (event: React.MouseEvent) => {
    // Product cards wrap the whole tile in a link; don't navigate on toggle.
    event.preventDefault();
    event.stopPropagation();
    if (!active) {
      setPopping(true);
      setTimeout(() => setPopping(false), 450);
    }
    await toggleWishlist(product);
  };

  const dimension = size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-9";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={cn(
        "grid place-items-center rounded-full transition-[background-color,color,transform] duration-300",
        dimension,
        tone === "on-image"
          ? "bg-paper/88 text-ink backdrop-blur-sm hover:bg-paper active:scale-90"
          : "border border-line text-ink hover:border-ink hover:bg-sand active:scale-90",
        active && (tone === "on-image" ? "bg-paper text-clay" : "border-clay/30 text-clay"),
        popping && "animate-heart",
        className,
      )}
    >
      <Heart
        size={size === "sm" ? 15 : 17}
        strokeWidth={1.6}
        className={cn("transition-transform duration-300", active && "scale-110")}
        fill={active ? "currentColor" : "none"}
        aria-hidden
      />
      {showLabel ? (
        <span className="ml-2 text-[0.8125rem]">{active ? "Saved" : "Save"}</span>
      ) : null}
    </button>
  );
}
