import type { Metadata } from "next";
import {
  ProseList,
  ProseSection,
  StaticPage,
} from "@/components/content/static-page";
import { STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Careers — ${STORE.name}`,
  description: `Join the ${STORE.name} team — open roles and what it's like to work here.`,
};

const ROLES = [
  { title: "Head of Merchandising", dept: "Buying", location: "New York — hybrid" },
  { title: "Senior Product Photographer", dept: "Creative", location: "New York — studio" },
  { title: "Customer Happiness Lead", dept: "Support", location: "Remote (US hours)" },
  { title: "Editorial Copywriter", dept: "Content", location: "London — hybrid" },
] as const;

export default function CareersPage() {
  return (
    <StaticPage
      eyebrow="About us"
      title="Work with us"
      lede="A small team, a clear bar for what we ship, and no performative busywork. We hire people who care about the details, because our customers notice them."
    >
      <ProseSection heading="Open roles">
        <div className="overflow-hidden rounded-xl border border-line">
          <ul className="divide-y divide-line">
            {ROLES.map((role) => (
              <li
                key={role.title}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"
              >
                <div>
                  <p className="font-medium">{role.title}</p>
                  <p className="text-[0.8125rem] text-stone">
                    {role.dept} · {role.location}
                  </p>
                </div>
                <a
                  href={`mailto:${STORE.email}?subject=${encodeURIComponent(`Application: ${role.title}`)}`}
                  className="rounded-pill border border-line px-4 py-2 text-[0.8125rem] font-medium transition-colors hover:border-ink hover:bg-sand"
                >
                  Apply
                </a>
              </li>
            ))}
          </ul>
        </div>
      </ProseSection>

      <ProseSection heading="What it's like here">
        <ProseList
          items={[
            "Small team, high trust — everyone ships, nobody watches the clock.",
            "We argue about the work, not about each other.",
            "Four-day weeks in July, and a real summer holiday.",
            "Kit allowance, wardrobe credit, and an office dog policy.",
          ]}
        />
      </ProseSection>

      <ProseSection heading="Don't see your role?">
        <p>
          We are always glad to talk to exceptional people. Write to{" "}
          <a
            href={`mailto:${STORE.email}`}
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-clay"
          >
            {STORE.email}
          </a>{" "}
          with a few lines about yourself and what you would want to build here.
        </p>
      </ProseSection>
    </StaticPage>
  );
}