import type { Metadata } from "next";
import {
  ProseList,
  ProseSection,
  StaticPage,
} from "@/components/content/static-page";
import { STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Terms of Service — ${STORE.name}`,
  description: `The terms that govern your use of ${STORE.name}.`,
};

export default function TermsPage() {
  return (
    <StaticPage
      eyebrow="Legal"
      title="Terms of service"
      lede={`Last updated February 2026. By using ${STORE.name} you agree to these terms. They're written plainly so you know exactly where you stand.`}
    >
      <ProseSection heading="Orders & pricing">
        <p>
          All prices are shown in USD, inclusive of tax where applicable. We make every
          effort to keep them accurate, but if a price is obviously wrong — a charging error
          rather than a sale — we'll let you know before charging. You can cancel an order
          at any time before it ships.
        </p>
      </ProseSection>

      <ProseSection heading="Returns">
        <p>
          Unworn items can be returned within 30 days for a full refund, per our{" "}
          <a href="/help/returns" className="underline underline-offset-4 hover:text-ink">
            returns policy
          </a>
          . Items worn, washed or altered are not eligible.
        </p>
      </ProseSection>

      <ProseSection heading="Accounts"
      >
        <ProseList
          items={[
            "You're responsible for keeping your sign-in details safe.",
            "One account per person — bulk or reseller buying isn't covered by consumer guarantees.",
            "We may close accounts used for abusive behaviour or payment fraud.",
          ]}
        />
      </ProseSection>

      <ProseSection heading="Reviews & content">
        <p>
          Reviews must be honest and about the product. We moderate before publishing, and we
          keep the critical ones — our customers deserve the truth.
        </p>
      </ProseSection>

      <ProseSection heading="Limits of liability">
        <p>
          We make every reasonable effort to ensure products match their descriptions, sizes
          and photography. Nothing here limits your statutory consumer rights. Where the law
          allows, liability is limited to the amount you paid for the goods in question.
        </p>
      </ProseSection>

      <ProseSection heading="Contact">
        <p>
          Questions about these terms? Write to{" "}
          <a
            href={`mailto:${STORE.email}`}
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-clay"
          >
            {STORE.email}
          </a>
          .
        </p>
      </ProseSection>
    </StaticPage>
  );
}