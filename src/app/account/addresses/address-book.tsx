"use client";

import { useActionState } from "react";
import { createAddress, removeAddress } from "./actions";
import type { AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox, FormError, TextField } from "@/components/ui/field";
import type { Address } from "@/lib/types";

export function AddressBook({
  userId,
  addresses,
}: {
  userId: number;
  addresses: Address[];
}) {
  return (
    <div className="space-y-12">
      {addresses.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="relative rounded-lg border border-line bg-bone px-5 py-6"
            >
              <div className="flex items-center gap-2">
                <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-mist">
                  {address.label}
                </p>
                {address.isDefault ? (
                  <span className="rounded-full bg-sage-soft px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.12em] text-sage">
                    Default
                  </span>
                ) : null}
              </div>
              <address className="mt-3 text-[0.8125rem] not-italic leading-relaxed text-graphite">
                {address.firstName} {address.lastName}
                <br />
                {address.line1}
                {address.line2 ? (
                  <>
                    <br />
                    {address.line2}
                  </>
                ) : null}
                <br />
                {address.city}, {address.region} {address.postalCode}
                <br />
                {address.country}
              </address>

              <form action={removeAddress.bind(null, userId, address.id)} className="mt-4">
                <button
                  type="submit"
                  className="text-[0.8125rem] text-stone underline underline-offset-4 transition-colors hover:text-clay"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}

      <section>
        <h2 className="text-xl">
          {addresses.length === 0 ? "Add a shipping address" : "Add another address"}
        </h2>
        <p className="mt-2 text-[0.8125rem] text-stone">
          We only ask for this when you&rsquo;re checking out.
        </p>

        <AddressForm userId={userId} />
      </section>
    </div>
  );
}

function AddressForm({ userId }: { userId: number }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    createAddress.bind(null, userId),
    {},
  );

  return (
    <form
      action={formAction}
      className="mt-6 max-w-2xl space-y-5 rounded-lg border border-line p-6"
      noValidate
    >
      <FormError>{state.error}</FormError>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Label"
          name="label"
          id="addr-label"
          defaultValue="Home"
          placeholder="Home, Office…"
          required
          error={state.fieldErrors?.label}
        />
        <TextField
          label="Phone"
          name="phone"
          id="addr-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          optional
          error={state.fieldErrors?.phone}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          id="addr-first"
          autoComplete="given-name"
          required
          error={state.fieldErrors?.firstName}
        />
        <TextField
          label="Last name"
          name="lastName"
          id="addr-last"
          autoComplete="family-name"
          required
          error={state.fieldErrors?.lastName}
        />
      </div>

      <TextField
        label="Address"
        name="line1"
        id="addr-line1"
        autoComplete="address-line1"
        required
        error={state.fieldErrors?.line1}
      />
      <TextField
        label="Apartment, suite, etc."
        name="line2"
        id="addr-line2"
        autoComplete="address-line2"
        optional
        error={state.fieldErrors?.line2}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <TextField
          label="City"
          name="city"
          id="addr-city"
          autoComplete="address-level2"
          required
          error={state.fieldErrors?.city}
        />
        <TextField
          label="State / Region"
          name="region"
          id="addr-region"
          autoComplete="address-level1"
          required
          error={state.fieldErrors?.region}
        />
        <TextField
          label="Postal code"
          name="postalCode"
          id="addr-postal"
          autoComplete="postal-code"
          required
          error={state.fieldErrors?.postalCode}
        />
      </div>

      <input type="hidden" name="country" value="United States" />
      <Checkbox name="isDefault" label="Use as my default shipping address" />

      <Button type="submit" loading={pending}>
        {pending ? "Saving…" : "Save address"}
      </Button>
    </form>
  );
}
