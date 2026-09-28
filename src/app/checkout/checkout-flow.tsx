"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { placeOrder, type CheckoutState } from "./actions";
import { Button } from "@/components/ui/button";
import { Checkbox, FormError, TextField } from "@/components/ui/field";
import { SHIPPING_METHODS, STORE } from "@/lib/constants";
import { cn, formatMoney } from "@/lib/utils";
import type { Address } from "@/lib/types";
import { IMG } from "@/lib/images";

type CartLine = {
  id: number;
  slug: string;
  name: string;
  image: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  stock: number;
};

const initial: CheckoutState = {};

/**
 * Checkout, as a three-step client flow.
 *
 * Totals are recomputed here purely to keep the summary live as the shopper
 * changes delivery or applies a code. The authoritative figure is recalculated
 * server-side inside `placeOrder` — this is presentation only, never a source
 * of truth for money.
 */
export function CheckoutFlow({
  userId,
  email,
  firstName,
  lastName,
  addresses,
  lines,
}: {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  addresses: Address[];
  lines: CartLine[];
}) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    placeOrder.bind(null, userId),
    initial,
  );

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<number | "new">(
    defaultAddress ? defaultAddress.id : "new",
  );
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [code, setCode] = useState("");

  const selected = addresses.find((a) => a.id === addressId);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
    const method = SHIPPING_METHODS.find((m) => m.id === shippingMethod)!;
    const shipping =
      method.threshold && subtotal >= method.threshold ? 0 : method.price;
    const tax = Math.round(subtotal * STORE.taxRate);
    return { subtotal, shipping, tax, total: subtotal + shipping + tax };
  }, [lines, shippingMethod]);

  return (
    <form action={formAction} className="grid gap-14 lg:grid-cols-[1fr_22rem]" noValidate>
      <div className="space-y-14">
        <FormError>{state.error}</FormError>

        <section>
          <StepHeading n={1} title="Delivery address" />
          {addresses.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={cn(
                    "cursor-pointer rounded-lg border px-4 py-4 text-[0.8125rem] transition-colors",
                    addressId === address.id
                      ? "border-ink bg-bone"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="addressChoice"
                    value={address.id}
                    checked={addressId === address.id}
                    onChange={() => setAddressId(address.id)}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2 font-medium">
                    {address.label}
                    {address.isDefault ? (
                      <span className="rounded-full bg-sage-soft px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.12em] text-sage">
                        Default
                      </span>
                    ) : null}
                  </span>
                  <address className="mt-1.5 not-italic leading-relaxed text-stone">
                    {address.firstName} {address.lastName}, {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.region}{" "}
                    {address.postalCode}
                  </address>
                </label>
              ))}

              <label
                className={cn(
                  "flex cursor-pointer items-center rounded-lg border px-4 py-4 text-[0.8125rem] font-medium transition-colors",
                  addressId === "new" ? "border-ink bg-bone" : "border-line hover:border-line-strong",
                )}
              >
                <input
                  type="radio"
                  name="addressChoice"
                  value="new"
                  checked={addressId === "new"}
                  onChange={() => setAddressId("new")}
                  className="sr-only"
                />
                Use a different address
              </label>
            </div>
          ) : null}

          {addressId === "new" ? (
            <div className="mt-6 space-y-5">
              <TextField
                label="Email"
                name="email"
                id="co-email"
                type="email"
                defaultValue={email}
                required
                error={state.fieldErrors?.email}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="First name"
                  name="firstName"
                  id="co-first"
                  defaultValue={firstName}
                  required
                  error={state.fieldErrors?.firstName}
                />
                <TextField
                  label="Last name"
                  name="lastName"
                  id="co-last"
                  defaultValue={lastName}
                  required
                  error={state.fieldErrors?.lastName}
                />
              </div>
              <TextField
                label="Address"
                name="line1"
                id="co-line1"
                defaultValue={selected ? `${selected.line1}` : ""}
                required
                error={state.fieldErrors?.line1}
              />
              <TextField
                label="Apartment, suite, etc."
                name="line2"
                id="co-line2"
                defaultValue={selected?.line2 ?? ""}
                optional
                error={state.fieldErrors?.line2}
              />
              <div className="grid gap-5 sm:grid-cols-3">
                <TextField
                  label="City"
                  name="city"
                  id="co-city"
                  defaultValue={selected?.city ?? ""}
                  required
                  error={state.fieldErrors?.city}
                />
                <TextField
                  label="State / Region"
                  name="region"
                  id="co-region"
                  defaultValue={selected?.region ?? ""}
                  required
                  error={state.fieldErrors?.region}
                />
                <TextField
                  label="Postal code"
                  name="postalCode"
                  id="co-postal"
                  defaultValue={selected?.postalCode ?? ""}
                  required
                  error={state.fieldErrors?.postalCode}
                />
              </div>
              <TextField
                label="Phone"
                name="phone"
                id="co-phone"
                type="tel"
                inputMode="tel"
                defaultValue={selected?.phone ?? ""}
                optional
                hint="Only used if the courier needs to reach you."
                error={state.fieldErrors?.phone}
              />
              <input type="hidden" name="country" value="United States" />
              <Checkbox name="saveAddress" label="Save this to my address book" defaultChecked />
            </div>
          ) : (
            // Chosen from the address book: still submit the values, so the
            // order snapshot is explicit rather than a lookup at render time.
            <AddressSnapshot address={selected!} email={email} />
          )}
        </section>

        <section>
          <StepHeading n={2} title="Delivery method" />
          <div className="mt-5 space-y-3">
            {SHIPPING_METHODS.map((method) => {
              const free = method.threshold ? totals.subtotal >= method.threshold : false;
              return (
                <label
                  key={method.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-5 py-4 transition-colors",
                    shippingMethod === method.id
                      ? "border-ink bg-bone"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={method.id}
                      checked={shippingMethod === method.id}
                      onChange={() => setShippingMethod(method.id)}
                      className="size-4 accent-[var(--wn-ink)]"
                    />
                    <span>
                      <span className="block text-sm">{method.label}</span>
                      <span className="block text-[0.75rem] text-stone">{method.description}</span>
                    </span>
                  </span>
                  <span className="text-[0.8125rem] tabular-nums">
                    {free || method.price === 0 ? "Free" : formatMoney(method.price)}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <StepHeading n={3} title="Payment" />
          <div className="mt-5 space-y-5">
            <TextField
              label="Name on card"
              name="cardName"
              id="co-cardname"
              autoComplete="cc-name"
              required
              error={state.fieldErrors?.cardName}
            />
            <TextField
              label="Card number"
              name="cardNumber"
              id="co-cardnumber"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              required
              hint="Demo only — nothing is sent anywhere and no card is charged."
              error={state.fieldErrors?.cardNumber}
            />
            <TextField
              label="Delivery notes"
              name="notes"
              id="co-notes"
              optional
              hint="Gate code, safe place, gift message…"
              error={state.fieldErrors?.notes}
            />
          </div>
        </section>

        <section>
          <label className="text-[0.8125rem] font-medium tracking-wide text-graphite">
            Discount code
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              name="discountCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="WEARNOW10"
              className="h-12 flex-1 rounded-[10px] border border-line bg-paper px-3.5 text-sm outline-none transition-colors focus:border-ink/45"
            />
          </div>
          {state.fieldErrors?.discountCode ? (
            <p role="alert" className="mt-2 text-[0.8125rem] text-clay">
              {state.fieldErrors.discountCode}
            </p>
          ) : (
            <p className="mt-2 text-[0.8125rem] text-mist">
              Try <code className="rounded bg-sand px-1.5 py-0.5">WEARNOW10</code> on orders over $150.
            </p>
          )}
        </section>

        <Button type="submit" size="xl" full loading={pending}>
          {pending ? "Placing your order…" : `Pay ${formatMoney(totals.total)}`}
        </Button>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-lg border border-line bg-bone p-6">
          <h2 className="text-lg">Order summary</h2>

          <ul className="mt-5 space-y-4">
            {lines.map((line) => (
              <li key={line.id} className="flex gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded bg-sand">
                  <Image src={IMG.lineItem(line.image)} alt="" fill sizes="64px" className="object-cover" />
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ink text-[0.625rem] text-paper">
                    {line.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${line.slug}`}
                    className="block truncate text-[0.8125rem] underline-offset-4 hover:underline"
                  >
                    {line.name}
                  </Link>
                  <p className="text-[0.75rem] text-stone">
                    {[line.color, line.size].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="text-[0.8125rem] tabular-nums">
                  {formatMoney(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="rule my-5" />

          <dl className="space-y-2.5 text-[0.8125rem]">
            <Row label="Subtotal" value={formatMoney(totals.subtotal)} />
            <Row label="Delivery" value={totals.shipping === 0 ? "Free" : formatMoney(totals.shipping)} />
            <Row label="Tax" value={formatMoney(totals.tax)} />
          </dl>

          <div className="rule my-5" />

          <div className="flex items-baseline justify-between">
            <span className="text-[0.9375rem]">Total</span>
            <span className="font-display text-2xl tabular-nums">
              {formatMoney(totals.total)}
            </span>
          </div>
        </div>
      </aside>
    </form>
  );
}

function StepHeading({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-3 text-xl">
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-[0.75rem] text-stone"
      >
        {n}
      </span>
      {title}
    </h2>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-stone">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

/** Hidden inputs mirroring a saved address so the order records it verbatim. */
function AddressSnapshot({ address, email }: { address: Address; email: string }) {
  return (
    <div className="mt-5">
      {Object.entries({
        email,
        firstName: address.firstName,
        lastName: address.lastName,
        line1: address.line1,
        line2: address.line2 ?? "",
        city: address.city,
        region: address.region,
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone,
      }).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </div>
  );
}
