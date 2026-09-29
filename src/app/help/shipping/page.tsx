import type { Metadata } from "next";
import { ProseList, ProseSection, StaticPage } from "@/components/content/static-page";
import { SHIPPING_METHODS, STORE } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: `Shipping & Delivery — ${STORE.name}`,
  description: "Shipping methods, delivery windows and free-shipping thresholds at Wear Now.",
};

export default function ShippingPage() {
  return (
    <StaticPage
      eyebrow="Customer service"
      title="Shipping & delivery"
      lede={`Orders placed before 2pm ship the same day. Choose your speed at checkout.`}
    >
      <ProseSection heading="Delivery options">
        <div className="overflow-hidden rounded-xl border border-line">
          <ul className="divide-y divide-line">
            {SHIPPING_METHODS.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <div>
                  <p className="font-medium">{m.label}</p>
                  <p className="text-[0.8125rem] text-stone">{m.description}</p>
                </div>
                <p className="text-[0.8125rem]">
                  {m.price === 0 ? (
                    m.threshold ? (
                      <span className="font-medium text-sage">Free</span>
                    ) : (
                      "Free"
                    )
                  ) : (
                    formatMoney(m.price)
                  )}
                  {m.thresholdNote ? (
                    <span className="ml-1.5 text-mist">{m.thresholdNote}</span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <p>
          Free standard delivery on orders over {formatMoney(STORE.freeShippingThreshold)} —
          applied automatically at checkout.
        </p>
      </ProseSection>

      <ProseSection heading="Where we deliver">
        <ProseList
          items={[
            "United States — all 50 states, plus DC and Puerto Rico.",
            "Canada, the UK, Ireland and most of Europe.",
            "Express and courier options ship worldwide via DHL.",
          ]}
        />
      </ProseSection>

      <ProseSection heading="Tracking your order">
        <p>
          You will get a confirmation the moment your order ships, with a tracking link for
          standard and express parcels. Missed a delivery? The carrier will hold your parcel
          for five business days before returning it.
        </p>
      </ProseSection>
    </StaticPage>
  );
}