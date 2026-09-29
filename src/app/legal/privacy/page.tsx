import type { Metadata } from "next";
import {
  ProseList,
  ProseSection,
  StaticPage,
} from "@/components/content/static-page";
import { STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Privacy Policy — ${STORE.name}`,
  description: `How ${STORE.name} collects, uses and protects your personal data.`,
};

export default function PrivacyPage() {
  return (
    <StaticPage
      eyebrow="Legal"
      title="Privacy policy"
      lede={`Last updated February 2026. This page explains what ${STORE.name} collects, why we collect it, and the choices you have. The short version: we don't sell your data, we don't track you around the web, and you can delete everything we hold about you on request.`}
    >
      <ProseSection heading="What we collect">
        <ProseList
          items={[
            "Account details — name, email and a securely hashed password.",
            "Order history — what you bought, delivery and payment details needed to fulfil it.",
            "Support correspondence — only what you send us.",
            "Browsing data — anonymous analytics that tell us which pages people actually use.",
          ]}
        />
      </ProseSection>

      <ProseSection heading="How we use it">
        <p>
          To operate the store — process orders, manage returns, send order updates — and to
          improve the catalog with honest usage data. Marketing emails are opt-in only, and
          you can unsubscribe in one click.
        </p>
      </ProseSection>

      <ProseSection heading="What we don't do">
        <ProseList
          items={[
            "We never sell or rent personal data to third parties.",
            "We don't run cross-site advertising trackers.",
            "Payment details are handled by our payment processor; we never store card numbers.",
          ]}
        />
      </ProseSection>

      <ProseSection heading="Your choices">
        <p>
          You can export or delete your account data at any time by emailing{" "}
          <a
            href={`mailto:${STORE.email}`}
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-clay"
          >
            {STORE.email}
          </a>
          . We'll confirm within 30 days. Cookies are limited to what's needed to keep you
          signed in and remember your bag.
        </p>
      </ProseSection>

      <ProseSection heading="Contact">
        <p>
          Questions about this policy? Write to{" "}
          <a
            href={`mailto:${STORE.email}`}
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-clay"
          >
            {STORE.email}
          </a>{" "}
          or {STORE.phone}.
        </p>
      </ProseSection>
    </StaticPage>
  );
}