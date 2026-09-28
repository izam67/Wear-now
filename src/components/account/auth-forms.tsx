"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox, FormError, TextField } from "@/components/ui/field";

/**
 * Sign-in and sign-up forms.
 *
 * Both use `useActionState` so the pending state and the returned field errors
 * are handled by React. The <form> posts to the same Server Action, so they
 * still work with JavaScript disabled — `useActionState` only enhances it.
 */

const initial: AuthState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <FormError>{state.error}</FormError>

      <TextField
        label="Email"
        name="email"
        id="login-email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        error={state.fieldErrors?.email}
      />

      <TextField
        label="Password"
        name="password"
        id="login-password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />

      <div className="flex items-center justify-between gap-4 pt-1">
        <Checkbox name="remember" label="Keep me signed in" defaultChecked />
        <Link
          href="/help/contact"
          className="text-[0.8125rem] text-stone underline underline-offset-4 transition-colors hover:text-ink"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" full loading={pending} className="mt-2">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="pt-2 text-center text-[0.8125rem] text-stone">
        New here?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-medium text-ink underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signup, initial);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <FormError>{state.error}</FormError>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          id="signup-first"
          autoComplete="given-name"
          required
          error={state.fieldErrors?.firstName}
        />
        <TextField
          label="Last name"
          name="lastName"
          id="signup-last"
          autoComplete="family-name"
          required
          error={state.fieldErrors?.lastName}
        />
      </div>

      <TextField
        label="Email"
        name="email"
        id="signup-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />

      <TextField
        label="Password"
        name="password"
        id="signup-password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters."
        error={state.fieldErrors?.password}
      />

      <TextField
        label="Confirm password"
        name="confirm"
        id="signup-confirm"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirm}
      />

      <Checkbox
        name="marketing"
        label="Email me new arrivals and private sales. Unsubscribe any time."
      />

      <Button type="submit" size="lg" full loading={pending} className="mt-2">
        {pending ? "Creating your account…" : "Create account"}
      </Button>

      <p className="pt-2 text-center text-[0.8125rem] leading-relaxed text-stone">
        By creating an account you agree to our{" "}
        <Link href="/legal/terms" className="underline underline-offset-4 hover:text-ink">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-ink">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
