"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { STORE } from "@/lib/constants";
import { formatMoney, pluralize } from "@/lib/utils";
import { useStore } from "@/components/providers/store-provider";
import { IMG } from "@/lib/images";

/**
 * Full-page bag.
 *
 * Shares the mutation API with the drawer, so quantities stay in sync
 * whichever surface the shopper is using.
 */
export function CartView() {
  const { lines, subtotal, count, updateQuantity, removeLine, signedIn } = useStore();

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong px-6 py-24 text-center">
        <ShoppingBag aria-hidden className="mx-auto size-10 text-mist" />
        <p className="mt-6 font-display text-2xl">Your bag is empty</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-stone">
          Nothing saved yet. Have a look around — you can fill your bag as a guest and only sign in
          when you&rsquo;re ready to buy.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/new-arrivals"
            className="inline-flex h-12 items-center justify-center rounded-pill bg-ink px-7 text-sm font-medium text-paper transition-colors hover:bg-graphite"
          >
            Shop new arrivals
          </Link>
          <Link
            href="/account/wishlist"
            className="inline-flex h-12 items-center justify-center rounded-pill border border-ink/25 px-7 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            View wishlist
          </Link>
        </div>
      </div>
    );
  }

  const threshold = STORE.freeShippingThreshold;
  const remaining = Math.max(0, threshold - subtotal);

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <section aria-label="Bag contents">
        <div className="flex items-baseline justify-between border-b border-line pb-4">
          <h2 className="text-lg">
            {count} {pluralize(count, "item")}
          </h2>
          <p className="text-[0.8125rem] text-stone">{remaining > 0
            ? `${formatMoney(remaining)} from complimentary delivery`
            : "Delivery is on us"}</p>
        </div>

        <ul className="divide-y divide-line">
          {lines.map((line) => (
            <li key={line.id} className="flex gap-4 py-6 sm:gap-6">
              <Link
                href={`/product/${line.slug}`}
                className="relative size-24 shrink-0 overflow-hidden rounded-md bg-sand sm:size-32"
              >
                <Image
                  src={IMG.lineItem(line.image)}
                  alt={line.name}
                  fill
                  sizes="(max-width: 640px) 96px, 128px"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${line.slug}`}
                      className="text-sm leading-snug underline-offset-4 hover:underline"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 text-[0.8125rem] text-stone">
                      {[line.color, line.size].filter(Boolean).join(" · ")}
                    </p>
                    {line.stock <= 3 ? (
                      <p className="mt-1.5 text-[0.75rem] text-clay">
                        Only {line.stock} left in stock
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    aria-label={`Remove ${line.name} from bag`}
                    className="shrink-0 rounded-full p-2 text-mist transition-colors hover:bg-sand hover:text-clay"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(next) => updateQuantity(line.id, next)}
                    label={line.name}
                  />
                  <p className="text-sm tabular-nums">
                    {formatMoney(line.price * line.quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-lg border border-line bg-bone p-6">
          <h2 className="text-lg">Summary</h2>

          <dl className="mt-5 space-y-2.5 text-[0.8125rem]">
            <div className="flex justify-between">
              <dt className="text-stone">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone">Delivery</dt>
              <dd className="text-stone">Calculated at checkout</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone">Tax</dt>
              <dd className="text-stone">Calculated at checkout</dd>
            </div>
          </dl>

          <div className="rule my-5" />

          <div className="flex items-baseline justify-between">
            <span className="text-[0.9375rem]">Estimated total</span>
            <span className="font-display text-2xl tabular-nums">{formatMoney(subtotal)}</span>
          </div>

          <Link
            href={signedIn ? "/checkout" : "/login?next=%2Fcheckout"}
            className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-pill bg-ink text-[0.9375rem] font-medium text-paper transition-colors hover:bg-graphite"
          >
            {signedIn ? "Proceed to checkout" : "Sign in to check out"}
          </Link>

          {!signedIn ? (
            <p className="mt-3 text-center text-[0.75rem] leading-relaxed text-stone">
              Your bag is saved.{" "}
              <Link
                href="/signup?next=%2Fcheckout"
                className="underline underline-offset-4 hover:text-ink"
              >
                Create an account
              </Link>{" "}
              to check out — or{" "}
              <Link href="/login?next=%2Fcheckout" className="underline underline-offset-4 hover:text-ink">
                sign in
              </Link>
              . We&rsquo;ll bring your bag with you.
            </p>
          ) : null}

          <ul className="mt-6 space-y-2 text-[0.75rem] text-stone">
            {[
              "Free returns within 30 days",
              "Carbon-neutral delivery",
              "Secure checkout",
            ].map((line) => (
              <li key={line} className="flex items-center gap-2">
                <span aria-hidden className="text-sage">
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function QuantityStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center rounded-pill border border-line">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label={`Decrease quantity of ${label}`}
        className="grid size-9 place-items-center rounded-l-pill text-stone transition-colors hover:bg-sand hover:text-ink"
      >
        <Minus aria-hidden className="size-3.5" />
      </button>
      <span
        aria-live="polite"
        className="min-w-8 text-center text-[0.8125rem] tabular-nums"
        aria-label={`Quantity of ${label}: ${value}`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={`Increase quantity of ${label}`}
        className="grid size-9 place-items-center rounded-r-pill text-stone transition-colors hover:bg-sand hover:text-ink"
      >
        <Plus aria-hidden className="size-3.5" />
      </button>
    </div>
  );
}
