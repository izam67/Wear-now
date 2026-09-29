import type { Metadata } from "next";
import {
  ProseList,
  ProseSection,
  StaticPage,
} from "@/components/content/static-page";
import { STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Sustainability — ${STORE.name}`,
  description:
    "How Wear Now thinks about materials, durability and packaging — the honest version, with none of the greenwash.",
};

export default function SustainabilityPage() {
  return (
    <StaticPage
      eyebrow="About us"
      title="Sustainability, plainly"
      lede="We're not a recycled-everything brand. We make honest choices where they count, and we tell you exactly what they are."
    >
      <ProseSection heading="Materials">
        <p>
          We favour natural fibres — cotton, wool, leather and cashmere — chosen for the
          simple reason that they outlast their synthetic equivalents. A garment that is
          worn 200 times is more sustainable than a garment that is recycled once.
        </p>
      </ProseSection>

      <ProseSection heading="Durability as a feature">
        <p>
          Reinforced seams where they matter, lining where it shows, hardware that will not
          tarnish in a season. Nothing here is designed for a single photo shoot.
        </p>
      </ProseSection>

      <ProseSection heading="What we do about it">
        <ProseList
          items={[
            "Repair guidance on every product page's care section.",
            "Plastic-free packaging on all shipments.",
            "No seasonal fire-sales that encourage buy-now-throw-later.",
            "Transparent care instructions so pieces reach their full lifecycle.",
          ]}
        />
      </ProseSection>

      <ProseSection heading="The honest part">
        <p>
          We still fly samples for photography and use new materials that aren&apos;t perfect
          yet. Sustainability is a direction, not a label — we&apos;re a long way along it, and
          we&apos;ll tell you when we fall short.
        </p>
      </ProseSection>
    </StaticPage>
  );
}