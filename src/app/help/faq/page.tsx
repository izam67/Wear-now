import type { Metadata } from "next";
import { ProseSection, StaticPage } from "@/components/content/static-page";
import { STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `FAQ — ${STORE.name}`,
  description: "Frequently asked questions about ordering, shipping, returns and accounts at Wear Now.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "Do you ship internationally?",
    a: "Yes. We ship to the US, Canada, the UK, Ireland and most of Europe, with express and courier options worldwide. Duties are calculated at checkout for international orders.",
  },
  {
    q: "How long does delivery take?",
    a: "Standard delivery is 4–6 business days and free over K150. Express takes 2–3 business days, and next-day courier gets your order there tomorrow if you order before 2pm.",
  },
  {
    q: "What is your returns policy?",
    a: "Unworn pieces with tags attached can be returned within 30 days for a full refund. Return shipping is free, and refunds land 3–5 business days after we receive the parcel.",
  },
  {
    q: "Can I change or cancel an order?",
    a: "If it hasn't shipped yet, absolutely — email us or call and we'll update it. Once a parcel is with the carrier we can't intercept it, but returns are free.",
  },
  {
    q: "How do I use a discount code?",
    a: "Enter the code in the bag page and the discount is applied before shipping. Codes can't be combined with other offers, and they're only valid during the stated period.",
  },
  {
    q: "Why is a product marked 'Sold out'?",
    a: "Some pieces sell out quickly. Sign in and save one to your wishlist — we'll email you the moment it's back in stock.",
  },
  {
    q: "Do you restock sold-out items?",
    a: "Often, but not always. Wishlist saves are the best signal to us, and they're the first to be notified when stock returns.",
  },
  {
    q: "How do reviews work?",
    a: "Anyone can leave a review after a purchase. Reviews are moderated before they appear, because a wall of five-star quotes reads as fake — and filtering out the critical ones is dishonest.",
  },
];

export default function FaqPage() {
  return (
    <StaticPage
      eyebrow="Customer service"
      title="Frequently asked questions"
      lede="The answers we give most often. Can't find yours? Contact us and a human will reply."
    >
      <div className="divide-y divide-line border-y border-line">
        {FAQS.map((faq) => (
          <details key={faq.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[0.9375rem] font-medium [&::-webkit-details-marker]:hidden">
              {faq.q}
              <span
                aria-hidden
                className="shrink-0 text-lg text-stone transition-transform duration-300 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pt-3 text-[0.875rem] leading-relaxed text-stone">{faq.a}</p>
          </details>
        ))}
      </div>

      <ProseSection heading="Still stuck?">
        <p>
          Email{" "}
          <a
            href="mailto:hello@wearnow.com"
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-clay"
          >
            hello@wearnow.com
          </a>{" "}
          or check the{" "}
          <a href="/help/contact" className="underline underline-offset-4 transition-colors hover:text-ink">
            contact page
          </a>{" "}
          for phone and studio details.
        </p>
      </ProseSection>
    </StaticPage>
  );
}