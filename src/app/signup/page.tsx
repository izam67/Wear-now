import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/account/auth-forms";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a free Wear Now account for faster checkout, order tracking, and a wishlist that follows you across devices.",
  robots: { index: false, follow: true },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, user] = await Promise.all([searchParams, currentUser()]);
  if (user) redirect(next?.startsWith("/") ? next : "/account");

  return (
    <div className="container-page grid gap-16 py-14 lg:grid-cols-[1fr_1.1fr] lg:py-24">
      <div className="mx-auto w-full max-w-md lg:mx-0">
        <p className="text-[0.6875rem] uppercase tracking-[0.22em] text-mist">Join us</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Create your account</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Browsing is always free. An account only comes into play when you&rsquo;re ready to buy —
          so your bag, wishlist, and orders stay together.
        </p>

        <div className="mt-9">
          <SignupForm next={next} />
        </div>
      </div>

      <aside className="hidden overflow-hidden rounded-lg bg-ink text-paper lg:flex lg:flex-col lg:justify-end lg:p-12">
        <p className="text-[0.6875rem] uppercase tracking-[0.22em] opacity-60">What you get</p>
        <ul className="mt-7 space-y-6">
          {[
            {
              title: "Your bag travels with you",
              body: "Start filling it as a guest, then sign in at checkout — nothing is lost.",
            },
            {
              title: "A wishlist on every device",
              body: "Save pieces now, decide later. We keep your shortlist until you say otherwise.",
            },
            {
              title: "Track and reorder",
              body: "Every order's history in one place, with one-tap reorder on things you love.",
            },
          ].map((item) => (
            <li key={item.title}>
              <p className="font-display text-lg">{item.title}</p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed opacity-70">{item.body}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
