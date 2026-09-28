import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/auth-forms";
import { STORE } from "@/lib/constants";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${STORE.name} to check out faster and track your orders.`,
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, user] = await Promise.all([searchParams, currentUser()]);
  if (user) redirect(next?.startsWith("/") ? next : "/account");

  return (
    <div className="container-page grid gap-16 py-14 lg:grid-cols-[1fr_1.1fr] lg:py-24">
      <div className="mx-auto w-full max-w-md lg:mx-0">
        <p className="text-[0.6875rem] uppercase tracking-[0.22em] text-mist">Your account</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Welcome back</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Sign in for faster checkout, order tracking, and your saved wishlist across devices.
        </p>

        <div className="mt-9">
          <LoginForm next={next} />
        </div>
      </div>

      <aside className="relative hidden overflow-hidden rounded-lg bg-sand lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_20%_0%,var(--wn-bone),transparent)]" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="display-md max-w-sm">
            &ldquo;Everything I ordered arrived wrapped in tissue, with a hand-written note.&rdquo;
          </p>
          <p className="mt-6 text-[0.8125rem] text-stone">— Priya R., verified customer</p>
          <hr className="rule mt-10" />
          <ul className="mt-6 space-y-3 text-[0.8125rem] text-graphite">
            {[
              "Free returns within 30 days",
              "Order history and tracking",
              "Early access to private sales",
            ].map((line) => (
              <li key={line} className="flex items-center gap-3">
                <span aria-hidden className="text-sage">
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="mt-10 text-[0.8125rem] font-medium text-ink underline underline-offset-4"
          >
            New here? Create an account
          </Link>
        </div>
      </aside>
    </div>
  );
}
