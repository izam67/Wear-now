import type { Metadata } from "next";
import {
  ProseList,
  ProseSection,
  StaticPage,
} from "@/components/content/static-page";
import { APPAREL_SIZES, SHOE_SIZES, STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Size Guide — ${STORE.name}`,
  description: "Apparel and shoe size charts for Wear Now.",
};

const APPAREL_ROWS: [string, string, string, string][] = [
  ["XS", "32–34", "60–63", "24–25"],
  ["S", "34–36", "63–65", "25–26.5"],
  ["M", "36–38", "65–68", "26.5–28"],
  ["L", "38–41", "68–70", "28–29.5"],
  ["XL", "41–44", "70–73", "29.5–31"],
  ["XXL", "44–47", "73–76", "31–32.5"],
];

export default function SizeGuidePage() {
  return (
    <StaticPage
      eyebrow="Customer service"
      title="Size guide"
      lede="Measure yourself against the chart below, then pick the size whose ranges you fall inside. When you're between sizes, size up for a relaxed fit and down for a close one."
    >
      <ProseSection heading="Apparel (chest · waist · hip, inches)">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.8125rem]">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 pr-4 font-medium text-graphite">Size</th>
                <th className="py-2 pr-4 font-medium text-graphite">Chest</th>
                <th className="py-2 pr-4 font-medium text-graphite">Waist</th>
                <th className="py-2 font-medium text-graphite">Hip</th>
              </tr>
            </thead>
            <tbody>
              {APPAREL_ROWS.map(([size, chest, waist, hip]) => (
                <tr key={size} className="border-b border-line/60">
                  <td className="py-2.5 pr-4 font-medium">{size}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-stone">{chest}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-stone">{waist}</td>
                  <td className="py-2.5 tabular-nums text-stone">{hip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[0.8125rem] text-stone">
          Available sizes: {APPAREL_SIZES.join(" · ")}
        </p>
      </ProseSection>

      <ProseSection heading="Shoes (EU)">
        <ProseList
          items={[
            `We carry EU sizes ${SHOE_SIZES[0]}–${SHOE_SIZES[SHOE_SIZES.length - 1]}.`,
            "Between two sizes? Take the larger — leather stretches, sizing down doesn't.",
            "Shoes should fit firmly at the heel with a thumb's width at the toe.",
          ]}
        />
      </ProseSection>

      <ProseSection heading="One-size pieces">
        <p>
          Hats, scarves, belts and most jewelry are marked One Size and designed to fit a
          normal range of body types. If a piece runs small or large we say so in its
          description.
        </p>
      </ProseSection>

      <ProseSection heading="Still unsure?">
        <p>
          With free 30-day returns, the cost of being wrong is zero — order the size you lean
          towards and swap it if needed.
        </p>
      </ProseSection>
    </StaticPage>
  );
}