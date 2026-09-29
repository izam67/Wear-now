import type { Metadata } from "next";
import Link from "next/link";
import {
  ProseList,
  ProseSection,
  StaticPage,
} from "@/components/content/static-page";
import { STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Our Story — ${STORE.name}`,
  description:
    "Wear Now is a considered edit of clothing, shoes, jewelry, bags and accessories — chosen for the way they feel, the way they last, and the finish they give an outfit.",
};

export default function AboutPage() {
  return (
    <StaticPage
      eyebrow="About us"
      title="A considered edit"
      lede={`${STORE.name} started with a simple observation: most wardrobes aren't missing pieces — they're missing pieces that work together. We edit from a deliberately small pool, keep the best of it in stock, and stand behind every item.`}
    >
      <ProseSection heading="The way we buy">
        <p>
          Every piece in the collection passes a short test before it earns a place: does it
          feel good on, does it wear well, and does it make the rest of an outfit look better?
          If it cannot answer all three, it does not get the space.
        </p>
        <p>
          That discipline keeps the catalog small enough to know personally — every product,
          every size, every fabric — and honest enough to recommend with confidence.
        </p>
      </ProseSection>

      <ProseSection heading="What we stand for">
        <ProseList
          items={[
            "Quality over quantity — a few good pieces beat a rack of average ones.",
            "Straightforward pricing — sale prices are real reductions, not staged discounts.",
            "Free returns for 30 days, because fit shouldn't be a gamble.",
            "Modest, considered design — nothing that shouts, everything that lasts.",
          ]}
        />
      </ProseSection>

      <ProseSection heading="A note on our photography">
        <p>
          The catalog is photographed on real bodies at realistic angles, and reviews are
          shown as written — including the critical ones. A wall of five-star quotes reads as
          fake, and filtering it out is both dishonest and easy to see through.
        </p>
      </ProseSection>

      <ProseSection heading="Say hello">
        <p>
          Questions about a piece, an order or an idea? We answer every message.
        </p>
        <p>
          <Link
            href="/help/contact"
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-clay"
          >
            Contact us
          </Link>{" "}
          — or read about{" "}
          <Link
            href="/about/sustainability"
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-clay"
          >
            how we think about sustainability
          </Link>
          .
        </p>
      </ProseSection>
    </StaticPage>
  );
}