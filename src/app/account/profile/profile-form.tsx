"use client";

import { useActionState } from "react";
import { updateProfile, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

/**
 * Profile form.
 *
 * `updateProfile` is bound to the user id on the server, so the id in the
 * closure is authoritative — a tampered form field cannot target another row.
 */
export function ProfileForm({
  userId,
  firstName,
  lastName,
  email,
  phone,
}: {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updateProfile.bind(null, userId),
    {},
  );

  return (
    <form action={formAction} className="max-w-md space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          id="profile-first"
          autoComplete="given-name"
          defaultValue={firstName}
          required
          error={state.fieldErrors?.firstName}
        />
        <TextField
          label="Last name"
          name="lastName"
          id="profile-last"
          autoComplete="family-name"
          defaultValue={lastName}
          required
          error={state.fieldErrors?.lastName}
        />
      </div>

      <TextField
        label="Email"
        name="email"
        id="profile-email"
        type="email"
        defaultValue={email}
        disabled
        hint="Contact us to change the email on your account."
      />

      <TextField
        label="Phone"
        name="phone"
        id="profile-phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={phone ?? ""}
        optional
        error={state.fieldErrors?.phone}
      />

      <Button type="submit" loading={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
