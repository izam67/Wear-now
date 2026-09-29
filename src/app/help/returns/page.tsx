import type { Metadata } from "next";
import { ProseList, ProseSection, StaticPage } from "@/components/content/static-page";
import { STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Returns & Exchanges — ${STORE.name}`,
  description: "Wear Now's 30-day returns policy — what's returnable, how it works and the timeline.",
};

export default function ReturnsPage() {
  return (
    <StaticPage
      eyebrow="Customer service"
      title="Returns & exchanges"
      lede="Unworn pieces can be returned within 30 days for a full refund — no questions asked, no restocking fee."
    >
      <ProseSection heading="The short version">
        <ProseList
          items={[
            "30 days from delivery for a full refund.",
            "Free return shipping on every return.",
            "Refunds land in 3–5 business days once we receive the parcel.",
            "Exchanges are free and ship as soon as the return is scanned.",
          ]}
        />
      </ProseSection>

      <ProseSection heading="What can be returned">
        <p>
          Anything that hasn&apos;t been worn, washed or altered, with the tags attached.
          Underwear and earrings are final sale. If a piece arrives damaged or is the wrong
          size, tell us within 14 days and we&apos;ll make it right — replacement, repair or
          refund, your choice.
        </p>
      </ProseSection>

      <ProseSection heading="How to start a return">
        <p>
          Return labels are available under your order in{" "}
          <a href="/account/orders" className="underline underline-offset-4 hover:text-ink">
            your account
          </a>
          . Drop the parcel at any post office or arrange a courier pickup — most carriers can
          collect from your door the next business day.
        </p>
      </ProseSection>

      <ProseSection heading="Refunds">
        <p>
          Refunds go back to your original payment method. Gift orders can be refunded to the
          purchaser or exchanged for a credit note — just email us from the account the order
          was placed on.
        </p>
      </ProseSection>
    </StaticPage>
  );
}