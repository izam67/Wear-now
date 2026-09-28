"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { IMG } from "@/lib/images";
import { STORE } from "@/lib/constants";
import { cn, formatMoney, pluralize } from "@/lib/utils";
import { useStore } from "@/components/providers/store-provider";

/** Progress toward the free-delivery threshold. */
function FreeShippingMeter({ subtotal }: { subtotal: number }) {
  const threshold = STORE.freeShippingThreshold;
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, (subtotal / threshold) * 100);

  return (
    <div className="border-b border-line bg-sand/50 px-5 py-3.5">
      <p className="text-[0.8125rem] leading-snug">
        {remaining > 0 ? (
          <>
            You&apos;re <strong className="font-medium">{formatMoney(remaining)}</strong> away from
            complimentary delivery
          </>
        ) : (
          <span className="text-sage">Your order ships free</span>
        )}
      </p>
      <div
        className="mt-2 h-1 overflow-hidden rounded-pill bg-line"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress toward free delivery"
      >
        <div
          className="h-full rounded-pill bg-clay transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function LineRow({ lineId }: { lineId: number }) {
  const { lines, updateQuantity, removeLine } = useStore();
  const line = lines.find((l) => l.id === lineId);
  if (!line) return null;

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/product/${line.slug}`}
        className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-md bg-sand"
      >
        {line.image ? (
          <Image src={IMG.thumb(line.image)} alt="" fill sizes="96px" className="object-cover" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/product/${line.slug}`}
              className="block truncate text-[0.9375rem] hover:underline hover:underline-offset-4"
            >
              {line.name}
            </Link>
            <p className="mt-0.5 text-[0.75rem] text-stone">
              {[line.color, line.size].filter(Boolean).join(" · ")}
            </p>
          </div>
          <p className="shrink-0 text-[0.875rem] tabular-nums">
            {formatMoney(line.price * line.quantity)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center rounded-pill border border-line">
            <button
              type="button"
              onClick={() => updateQuantity(line.id, line.quantity - 1)}
              aria-label={`Decrease quantity of ${line.name}`}
              className="grid size-8 place-items-center rounded-l-pill text-stone transition-colors hover:text-ink"
            >
              <Minus size={13} aria-hidden />
            </button>
            <span
              aria-live="polite"
              className="min-w-7 text-center text-[0.8125rem] tabular-nums"
            >
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(line.id, line.quantity + 1)}
              disabled={line.quantity >= line.stock}
              aria-label={`Increase quantity of ${line.name}`}
              className="grid size-8 place-items-center rounded-r-pill text-stone transition-colors hover:text-ink disabled:opacity-35"
            >
              <Plus size={13} aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeLine(line.id)}
            className="text-[0.75rem] text-stone underline underline-offset-4 transition-colors hover:text-ink"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartDrawer() {
  const { isCartOpen, closeCart, lines, subtotal, count, signedIn } = useStore();

  useEffect(() => {
    if (!isCartOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[85]" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button
        type="button"
        aria-label="Close bag"
        onClick={closeCart}
        className="animate-fade-in absolute inset-0 cursor-default bg-ink/35 backdrop-blur-[3px]"
      />

      <div className="animate-slide-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper shadow-[-30px_0_60px_-30px_rgba(18,17,16,0.4)]">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl">
            Your bag
            {count > 0 ? (
              <span className="ml-2 font-sans text-[0.8125rem] text-stone">
                {pluralize(count, "item")}
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close bag"
            className="grid size-9 place-items-center rounded-full text-stone transition-colors hover:bg-sand hover:text-ink"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-sand text-stone">
              <ShoppingBag size={22} strokeWidth={1.4} aria-hidden />
            </span>
            <div>
              <p className="font-display text-xl">Your bag is empty</p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-stone">
                Start with the new season edit — pieces picked to work hard in a wardrobe.
              </p>
            </div>
            <Link
              href="/new-arrivals"
              onClick={closeCart}
              className="mt-1 rounded-pill bg-ink px-6 py-3 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-graphite"
            >
              Shop new arrivals
            </Link>
          </div>
        ) : (
          <>
            <FreeShippingMeter subtotal={subtotal} />

            <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-5">
              {lines.map((line) => (
                <LineRow key={line.id} lineId={line.id} />
              ))}
            </ul>

            <footer className="border-t border-line bg-sand/40 px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.9375rem]">Subtotal</span>
                <span className="font-display text-xl tabular-nums">{formatMoney(subtotal)}</span>
              </div>
              <p className="mt-1 text-[0.75rem] text-stone">
                Taxes and delivery calculated at checkout.
              </p>

              {/* Browsing is open to everyone; committing to a purchase needs an
                  account, so the button routes through sign-in and returns here. */}
              <Link
                href={signedIn ? "/checkout" : "/login?next=%2Fcheckout"}
                onClick={closeCart}
                className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-pill bg-ink text-[0.9375rem] font-medium text-paper transition-colors hover:bg-graphite"
              >
                {signedIn ? "Proceed to checkout" : "Sign in to check out"}
                {!signedIn ? (
                  <span aria-hidden className="text-[0.8125rem] opacity-70">
                    →
                  </span>
                ) : null}
              </Link>
              {!signedIn ? (
                <p className="mt-2 text-center text-[0.75rem] text-stone">
                  No account yet?{" "}
                  <Link
                    href="/signup?next=%2Fcheckout"
                    onClick={closeCart}
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    Create one in a minute
                  </Link>
                </p>
              ) : null}

              <button
                type="button"
                onClick={closeCart}
                className="mt-2.5 w-full py-2.5 text-[0.8125rem] text-stone underline underline-offset-4 transition-colors hover:text-ink"
              >
                Continue shopping
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

/** Condensed bag summary used in the header on desktop. */
export function CartButton({ className }: { className?: string }) {
  const { openCart, count } = useStore();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={count > 0 ? `Open bag, ${pluralize(count, "item")}` : "Open bag"}
      className={cn(
        "relative grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-sand",
        className,
      )}
    >
      <ShoppingBag size={19} strokeWidth={1.5} aria-hidden />
      {count > 0 ? (
        <span className="absolute top-1 right-0.5 grid min-w-4.5 place-items-center rounded-full bg-clay px-1 text-[0.625rem] font-medium leading-4.5 text-paper tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
