import type { Metadata } from "next";
import {
  ProseList,
  ProseSection,
  StaticPage,
} from "@/components/content/static-page";
import { STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Press — ${STORE.name}`,
  description: `Press coverage and media resources for ${STORE.name}.`,
};

const PRESS = [
  { outlet: "The Style Sheet", title: "The new edit breaking the seasonal cycle", date: "March 2026" },
  { outlet: "Northlight", title: "Small catalogs, big opinions: the future of the edit", date: "January 2026" },
  { outlet: "Field & Fabric", title: "Where durability actually became the selling point", date: "November 2025" },
  { outlet: "Morning Goods", title: "Straightforward pricing in a discounting world", date: "September 2025" },
] as const;

export default function PressPage() {
  return (
    <StaticPage
      eyebrow="About us"
      title="Press"
      lede="Selected coverage, interviews and media assets. For press inquiries, contact our team directly."
    >
      <ProseSection heading="Selected coverage">
        <ul className="divide-y divide-line border-y border-line">
          {PRESS.map((item) => (
            <li key={item.title} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-[0.8125rem] text-stone">{item.outlet}</p>
              </div>
              <span className="text-[0.75rem] tabular-nums text-mist">{item.date}</span>
            </li>
          ))}
        </ul>
      </ProseSection>

      <ProseSection heading="Media assets">
        <ProseList
          items={[
            "Brand guidelines and logo files on request.",
            "High-resolution product photography for editorial use.",
            "Founder interviews by arrangement.",
          ]}
        />
      </ProseSection>

      <ProseSection heading="Press contact">
        <p>
          For all media inquiries, email{" "}
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