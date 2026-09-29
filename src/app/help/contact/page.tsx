import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { StaticPage } from "@/components/content/static-page";
import { STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Contact Us — ${STORE.name}`,
  description: `How to reach ${STORE.name} support — email, phone and our Lusaka studio.`,
};

export default function ContactPage() {
  return (
    <StaticPage
      eyebrow="Customer service"
      title="Contact us"
      lede="We answer every message — usually within a few hours on business days, and within a day on weekends."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <a
          href={`mailto:${STORE.email}`}
          className="group rounded-xl border border-line p-6 transition-colors hover:border-ink hover:bg-sand/50"
        >
          <Mail size={20} className="text-clay" aria-hidden />
          <p className="mt-4 font-medium">Email</p>
          <p className="mt-1 break-all text-[0.8125rem] text-stone group-hover:text-ink">
            {STORE.email}
          </p>
        </a>

        <a
          href={`tel:${STORE.phone.replace(/[^0-9+]/g, "")}`}
          className="group rounded-xl border border-line p-6 transition-colors hover:border-ink hover:bg-sand/50"
        >
          <Phone size={20} className="text-clay" aria-hidden />
          <p className="mt-4 font-medium">Phone</p>
          <p className="mt-1 text-[0.8125rem] text-stone group-hover:text-ink">{STORE.phone}</p>
        </a>

        <div className="rounded-xl border border-line p-6">
          <MapPin size={20} className="text-clay" aria-hidden />
          <p className="mt-4 font-medium">Studio</p>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-stone">{STORE.address}</p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-sand/50 p-6 text-[0.9375rem] leading-relaxed text-stone">
        <p className="font-medium text-ink">Before you write in</p>
        <p className="mt-2">
          Order status, shipping times and returns are covered on the{" "}
          <Link href="/account/orders" className="underline underline-offset-4 hover:text-ink">
            order tracking
          </Link>{" "}
          page and in our{" "}
          <a href="/help/faq" className="underline underline-offset-4 hover:text-ink">
            FAQ
          </a>
          .
        </p>
      </div>
    </StaticPage>
  );
}